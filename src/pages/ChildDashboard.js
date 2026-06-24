import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import WhereAmI from '../components/WhereAmI';
import PackList from '../components/PackList';
import RoutineCards from '../components/RoutineCards';
import FamilySetup from '../components/FamilySetup';
import NotificationCenter from '../components/NotificationCenter';
import VisualSchedule from '../components/VisualSchedule';
import BottomTabBar from '../components/BottomTabBar';

function ChildDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [custodySchedule, setCustodySchedule] = useState(null);
  const [showFamilySetup, setShowFamilySetup] = useState(false);
  const [familyId, setFamilyId] = useState(null);
  const [activeTab, setActiveTab] = useState('today');

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Load events
  const loadEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's familyId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const userFamilyId = userData.familyId;

      console.log('Child loadEvents - uid:', user.uid, 'familyId:', userFamilyId, 'userData:', userData);

      // Collect all familyIds to try: the child's own + any parent's uid in the family
      const familyIdsToTry = new Set();
      if (userFamilyId) familyIdsToTry.add(userFamilyId);
      familyIdsToTry.add(user.uid);

      // Also try linkedParentId directly
      if (userData.linkedParentId) familyIdsToTry.add(userData.linkedParentId);

      if (userFamilyId) {
        const familyDoc = await getDoc(doc(db, 'families', userFamilyId));
        console.log('Family doc exists:', familyDoc.exists(), familyDoc.exists() ? familyDoc.data() : null);
        if (familyDoc.exists()) {
          (familyDoc.data().members || []).forEach(id => familyIdsToTry.add(id));
        }
      }

      // Also search parentInvites for any invite involving this user
      const inviteSnap = await getDocs(query(
        collection(db, 'parentInvites'),
        where('status', '==', 'accepted')
      ));
      inviteSnap.docs.forEach(d => {
        const inv = d.data();
        if (inv.invitedBy === user.uid || inv.acceptedBy === user.uid ||
            inv.invitedEmail === userData.email) {
          if (inv.invitedBy) familyIdsToTry.add(inv.invitedBy);
          if (inv.acceptedBy) familyIdsToTry.add(inv.acceptedBy);
          if (inv.familyId) familyIdsToTry.add(inv.familyId);
        }
      });

      const eventsRef = collection(db, 'events');
      const allEvents = [];
      const seen = new Set();

      for (const fid of familyIdsToTry) {
        try {
          const q = query(eventsRef, where('familyId', '==', fid), orderBy('date', 'asc'));
          const snap = await getDocs(q);
          snap.docs.forEach(d => {
            if (!seen.has(d.id)) {
              seen.add(d.id);
              allEvents.push({ id: d.id, ...d.data() });
            }
          });
        } catch (e) {
          // index may not exist for this familyId, skip
        }
      }

      allEvents.sort((a, b) => a.date.localeCompare(b.date));
      console.log('Child loadEvents - familyIdsToTry:', Array.from(familyIdsToTry), 'allEvents found:', allEvents.length, allEvents);
      setEvents(allEvents);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustodySchedule = async () => {
    if (!user) return;

    try {
      // Try child's own doc first
      let custodyDoc = await getDoc(doc(db, 'custody', user.uid));
      if (custodyDoc.exists()) {
        setCustodySchedule(custodyDoc.data());
        return;
      }

      // Fall back to a parent in the same family
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const fid = userDoc.exists() && userDoc.data().familyId;
      if (!fid) return;

      const familyDoc = await getDoc(doc(db, 'families', fid));
      if (!familyDoc.exists()) return;

      const members = familyDoc.data().members || [];
      for (const memberId of members) {
        if (memberId === user.uid) continue;
        const memberCustody = await getDoc(doc(db, 'custody', memberId));
        if (memberCustody.exists()) {
          setCustodySchedule(memberCustody.data());
          return;
        }
      }
    } catch (err) {
      console.error('Error loading custody schedule:', err);
    }
  };

  const loadFamily = async () => {
    if (!user) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().familyId) {
        setFamilyId(userDoc.data().familyId);
      }
    } catch (err) {
      console.error('Error loading family:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadEvents();
      loadCustodySchedule();
      loadFamily();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Deduplicate recurring events — only keep next upcoming instance per group
  const getDeduplicatedEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    const recurringGroupMap = {};
    const nonRecurring = [];

    events.forEach(event => {
      if (event.isRecurring && event.recurringEventGroupId) {
        const gid = event.recurringEventGroupId;
        if (event.date >= today) {
          if (!recurringGroupMap[gid] || event.date < recurringGroupMap[gid].date) {
            recurringGroupMap[gid] = event;
          }
        }
      } else {
        if (event.date >= today) nonRecurring.push(event);
      }
    });

    return [...nonRecurring, ...Object.values(recurringGroupMap).filter(e => e.date >= today)]
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  // Get today's events
  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return getDeduplicatedEvents().filter(event => event.date === today);
  };

  // Get next upcoming event
  const getNextEvent = () => {
    const upcoming = getDeduplicatedEvents();
    return upcoming[0] || null;
  };

  // Format time nicely
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Format date nicely
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  const getTransitionInfo = () => {
    if (!custodySchedule) return null;
    const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;
    if (!pattern || !startDate) return null;

    const start = new Date(startDate);
    const today = new Date();
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    let currentParent;
    let daysUntil;

    if (pattern === 'alternating-weeks') {
      const weekNumber = Math.floor(daysDiff / 7);
      currentParent = weekNumber % 2 === 0 ? parent1Name : parent2Name;
      const daysInCurrentWeek = daysDiff % 7;
      daysUntil = 7 - daysInCurrentWeek;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
      if (cycle < 2) { currentParent = parent1Name; daysUntil = 2 - cycle; }
      else if (cycle < 4) { currentParent = parent2Name; daysUntil = 4 - cycle; }
      else { currentParent = parent1Name; daysUntil = 7 - cycle; }
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = today.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      currentParent = isWeekend ? parent2Name : parent1Name;
      if (isWeekend) {
        daysUntil = dayOfWeek === 6 ? 1 : 5;
      } else {
        daysUntil = 6 - dayOfWeek;
      }
    } else {
      return null;
    }

    const nextParent = currentParent === parent1Name ? parent2Name : parent1Name;
    return { daysUntil, nextParent, currentParent, isToday: daysUntil === 0 };
  };

  const transitionInfo = getTransitionInfo();

  const todayEvents = getTodayEvents();
  const nextEvent = getNextEvent();

  const tabs = [
    { id: 'today', icon: '🏠', label: 'Today', badge: todayEvents.length },
    { id: 'week', icon: '🗓️', label: 'Week' },
    { id: 'pack', icon: '🎒', label: 'Pack' },
    { id: 'upcoming', icon: '📆', label: 'Coming Up' },
    { id: 'more', icon: '⚙️', label: 'More' },
  ];

  if (!user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      paddingBottom: '72px',
      fontFamily: 'system-ui'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '16px 20px 12px 20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, color: '#333', fontSize: '20px', fontWeight: '700' }}>My Schedule</h1>
          <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '12px' }}>
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {user && <NotificationCenter userId={user.uid} />}
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '700px', margin: '0 auto' }}>
        {/* TODAY TAB */}
        {activeTab === 'today' && (
          <>
            {transitionInfo && (() => {
              const { daysUntil, nextParent, currentParent } = transitionInfo;
              let emoji, text, subText, bgColor, borderColor;
              if (daysUntil === 0) {
                emoji = '🏡'; text = `You're going to ${nextParent}'s today!`;
                subText = 'Pack up and get ready!';
                bgColor = '#e8f5e9'; borderColor = '#66bb6a';
              } else if (daysUntil === 1) {
                emoji = '🌙'; text = `Tomorrow you go to ${nextParent}'s`;
                subText = 'Almost time to pack your bag!';
                bgColor = '#e3f2fd'; borderColor = '#64b5f6';
              } else if (daysUntil <= 3) {
                emoji = '📅'; text = `${daysUntil} days until ${nextParent}'s`;
                subText = 'Coming up soon!';
                bgColor = '#f3e5f5'; borderColor = '#ba68c8';
              } else {
                emoji = '✨'; text = `${daysUntil} days at ${currentParent}'s`;
                subText = 'Enjoy your time!';
                bgColor = '#f5f5f5'; borderColor = '#bdbdbd';
              }
              return (
                <div style={{
                  background: bgColor,
                  border: `2px solid ${borderColor}`,
                  borderRadius: '20px',
                  padding: '16px',
                  marginBottom: '16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}>
                  <div style={{ fontSize: '40px', flexShrink: 0 }}>{emoji}</div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{text}</div>
                    <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{subText}</div>
                  </div>
                </div>
              );
            })()}
            <WhereAmI custodySchedule={custodySchedule} />

            {nextEvent && (
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                border: `3px solid ${nextEvent.color}`
              }}>
                <div style={{ fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>
                  ⏰ What's Next
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '48px' }}>{nextEvent.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{nextEvent.title}</div>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      {formatDate(nextEvent.date)}{nextEvent.time && ` at ${formatTime(nextEvent.time)}`}
                    </div>
                    {nextEvent.location && (
                      <div style={{ color: '#888', fontSize: '13px', marginTop: '2px' }}>📍 {nextEvent.location}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '18px' }}>📋 Today's Schedule</h2>
              {loading ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '24px' }}>Loading...</p>
              ) : todayEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                  <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>😊</p>
                  <p style={{ margin: 0, fontSize: '16px' }}>Nothing scheduled for today!</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {todayEvents.map(event => (
                    <div key={event.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '16px', background: `${event.color}15`,
                      border: `2px solid ${event.color}`, borderRadius: '14px'
                    }}>
                      <div style={{ fontSize: '36px' }}>{event.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{event.title}</div>
                        <div style={{ color: '#666', fontSize: '13px', marginTop: '2px' }}>
                          {event.time ? formatTime(event.time) : 'All day'}{event.location && ` • ${event.location}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* WEEK TAB */}
        {activeTab === 'week' && (
          <VisualSchedule custodySchedule={custodySchedule} events={events} />
        )}

        {/* PACK TAB */}
        {activeTab === 'pack' && (
          <>
            <PackList events={events} custodySchedule={custodySchedule} />
            <RoutineCards familyId={familyId} userId={user.uid} />
          </>
        )}

        {/* COMING UP TAB */}
        {activeTab === 'upcoming' && (
          <div style={{ background: 'white', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '18px' }}>📆 Coming Up</h2>
            {getDeduplicatedEvents().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>📭</p>
                <p style={{ margin: 0 }}>No upcoming events</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getDeduplicatedEvents().map(event => (
                  <div key={event.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '14px', background: `${event.color}15`,
                    border: `2px solid ${event.color}`, borderRadius: '12px'
                  }}>
                    <div style={{ fontSize: '32px' }}>{event.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{event.title}</div>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>{formatDate(event.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MORE TAB */}
        {activeTab === 'more' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {!familyId && (
              <button onClick={() => setShowFamilySetup(true)} style={{
                width: '100%', padding: '18px', background: 'white',
                border: '2px solid #34a853', borderRadius: '16px',
                color: '#34a853', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
              }}>
                🏠 Join Family
              </button>
            )}
            <button onClick={handleLogout} style={{
              width: '100%', padding: '18px', background: 'white',
              border: '2px solid #ff4444', borderRadius: '16px',
              color: '#ff4444', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
            }}>
              🚪 Logout
            </button>
          </div>
        )}
      </div>

      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Family Setup Modal */}
      {showFamilySetup && (
        <FamilySetup
          onClose={() => setShowFamilySetup(false)}
          onFamilyJoined={() => {
            loadFamily();
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

export default ChildDashboard;