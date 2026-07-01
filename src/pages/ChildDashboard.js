import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, Timestamp } from 'firebase/firestore';
import WhereAmI from '../components/WhereAmI';
import PackList from '../components/PackList';
import RoutineCards from '../components/RoutineCards';
import FamilySetup from '../components/FamilySetup';
import NotificationCenter from '../components/NotificationCenter';
import VisualSchedule from '../components/VisualSchedule';
import CustodyCalendar from '../components/CustodyCalendar';
import BottomTabBar from '../components/BottomTabBar';
import { scheduleAllNotifications } from '../services/LocalNotificationService';
import { getCustodyStatus } from '../utils/custodySchedule';
import ChildMessages from '../components/ChildMessages';
import EventDetail from '../components/EventDetail';

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
  const [selectedEvent, setSelectedEvent] = useState(null);

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
          const todayStr = new Date().toISOString().split('T')[0];
          const q = query(eventsRef, where('familyId', '==', fid), where('date', '>=', todayStr), orderBy('date', 'asc'));
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

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const fid = userData.familyId;
      if (!fid) return;

      // Try familyId directly as a custody doc (parent's UID = familyId)
      const fidCustody = await getDoc(doc(db, 'custody', fid));
      if (fidCustody.exists()) {
        setCustodySchedule(fidCustody.data());
        return;
      }

      // Try linkedParentId directly
      if (userData.linkedParentId) {
        const linkedCustody = await getDoc(doc(db, 'custody', userData.linkedParentId));
        if (linkedCustody.exists()) {
          setCustodySchedule(linkedCustody.data());
          return;
        }
      }

      // Fall back to searching family members
      const familyDoc = await getDoc(doc(db, 'families', fid));
      if (familyDoc.exists()) {
        const members = familyDoc.data().members || [];
        for (const memberId of members) {
          if (memberId === user.uid) continue;
          const memberCustody = await getDoc(doc(db, 'custody', memberId));
          if (memberCustody.exists()) {
            setCustodySchedule(memberCustody.data());
            return;
          }
        }
      }

      // Last resort: search all parentInvites accepted involving this user's family
      const inviteSnap = await getDocs(query(
        collection(db, 'parentInvites'),
        where('familyId', '==', fid),
        where('status', '==', 'accepted')
      ));
      for (const d of inviteSnap.docs) {
        const inv = d.data();
        for (const uid of [inv.invitedBy, inv.acceptedBy]) {
          if (!uid || uid === user.uid) continue;
          const c = await getDoc(doc(db, 'custody', uid));
          if (c.exists()) {
            setCustodySchedule(c.data());
            return;
          }
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

  // Schedule local notifications whenever events or custody schedule change
  useEffect(() => {
    scheduleAllNotifications({ events, custodySchedule });
  }, [events, custodySchedule]);

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
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    return getDeduplicatedEvents().find(event => {
      if (event.date > todayStr) return true;
      if (event.date === todayStr) {
        // today's event: only show if it hasn't started yet (or has no time)
        return !event.time || event.time > currentTime;
      }
      return false;
    }) || null;
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

  const custodyStatus = getCustodyStatus(custodySchedule);
  const transitionInfo = custodyStatus.currentParent ? {
    currentParent: custodyStatus.currentParent,
    nextParent: custodyStatus.nextParent,
    daysUntil: custodyStatus.daysUntilTransition,
    isToday: custodyStatus.daysUntilTransition === 0,
  } : null;

  const todayEvents = getTodayEvents();
  const nextEvent = getNextEvent();

  const [unreadMessages, setUnreadMessages] = useState(0);

  const tabs = [
    { id: 'today', icon: '🏠', label: 'Today', badge: todayEvents.length },
    { id: 'week', icon: '🗓️', label: 'Week' },
    { id: 'pack', icon: '🎒', label: 'Pack' },
    { id: 'messages', icon: '💬', label: 'Messages', badge: unreadMessages },
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

              // Find block length by looking back to when the current stay started
              let blockLength = daysUntil;
              for (let back = 1; back <= 14; back++) {
                const checkDate = new Date(); checkDate.setHours(0,0,0,0); checkDate.setDate(checkDate.getDate() - back);
                const { currentParent: cp } = getCustodyStatus(custodySchedule, checkDate);
                if (cp !== currentParent) { blockLength = back + daysUntil; break; }
              }
              const daysIn = blockLength - daysUntil;
              const progress = Math.min(100, Math.max(0, (daysIn / blockLength) * 100));

              let emoji, headline, sub, accentColor, bgColor;
              if (daysUntil === 0) {
                emoji = '🎒'; headline = `Moving to ${nextParent}'s today!`;
                sub = 'Time to grab your bag and go!';
                accentColor = '#43a047'; bgColor = '#e8f5e9';
              } else if (daysUntil === 1) {
                emoji = '🌙'; headline = `Tomorrow: ${nextParent}'s house`;
                sub = "Don't forget to start packing tonight!";
                accentColor = '#1e88e5'; bgColor = '#e3f2fd';
              } else if (daysUntil === 2) {
                emoji = '📅'; headline = `2 days until ${nextParent}'s`;
                sub = 'A good time to start getting your bag ready.';
                accentColor = '#8e24aa'; bgColor = '#f3e5f5';
              } else if (daysUntil <= 5) {
                emoji = '🏠'; headline = `Staying at ${currentParent}'s`;
                sub = `${nextParent}'s in ${daysUntil} days`;
                accentColor = '#667eea'; bgColor = '#f0f4ff';
              } else {
                emoji = '😊'; headline = `You're at ${currentParent}'s`;
                sub = `Next up: ${nextParent}'s in ${daysUntil} days`;
                accentColor = '#888'; bgColor = '#f5f5f5';
              }

              return (
                <div style={{
                  background: bgColor,
                  border: `2px solid ${accentColor}`,
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '16px',
                  boxShadow: `0 4px 16px ${accentColor}22`
                }}>
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      fontSize: '44px',
                      background: 'white',
                      borderRadius: '14px',
                      width: '60px', height: '60px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>{emoji}</div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '17px', color: '#333', lineHeight: 1.3 }}>{headline}</div>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{sub}</div>
                    </div>
                  </div>

                  {/* Progress bar: days through this stay */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#888', marginBottom: '5px' }}>
                      <span>Day {Math.max(1, daysIn)} of stay</span>
                      <span>{daysUntil === 0 ? 'Transition today!' : `${daysUntil} day${daysUntil === 1 ? '' : 's'} left`}</span>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.08)', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        background: accentColor,
                        borderRadius: '8px',
                        transition: 'width 0.5s ease'
                      }} />
                    </div>
                  </div>

                  {/* Two-house display */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    marginTop: '14px', justifyContent: 'center'
                  }}>
                    <div style={{
                      flex: 1, padding: '8px', background: 'white', borderRadius: '12px',
                      textAlign: 'center', border: `2px solid ${daysUntil > 0 ? accentColor : '#ddd'}`,
                      opacity: daysUntil > 0 ? 1 : 0.5
                    }}>
                      <div style={{ fontSize: '22px' }}>🏠</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', marginTop: '2px' }}>{currentParent}</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>Now</div>
                    </div>
                    <div style={{ fontSize: '20px', color: '#ccc' }}>→</div>
                    <div style={{
                      flex: 1, padding: '8px', background: 'white', borderRadius: '12px',
                      textAlign: 'center', border: `2px solid ${daysUntil === 0 ? accentColor : '#ddd'}`,
                      opacity: daysUntil === 0 ? 1 : 0.5
                    }}>
                      <div style={{ fontSize: '22px' }}>🏡</div>
                      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#555', marginTop: '2px' }}>{nextParent}</div>
                      <div style={{ fontSize: '10px', color: '#888' }}>
                        {daysUntil === 0 ? 'Today!' : `In ${daysUntil}d`}
                      </div>
                    </div>
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
          <>
            <VisualSchedule custodySchedule={custodySchedule} events={events} onEventClick={setSelectedEvent} />
            <CustodyCalendar custodySchedule={custodySchedule} events={events} />
          </>
        )}

        {/* PACK TAB */}
        {activeTab === 'pack' && (
          <>
            <PackList events={events} custodySchedule={custodySchedule} familyId={familyId} userId={user?.uid} />
            <RoutineCards familyId={familyId} userId={user.uid} />
          </>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <ChildMessages
            familyId={familyId}
            userId={user?.uid}
            userName={user?.displayName || 'Me'}
            onUnreadChange={setUnreadMessages}
          />
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
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px', background: `${event.color}15`,
                      border: `2px solid ${event.color}`, borderRadius: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '32px' }}>{event.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{event.title}</div>
                      <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>{formatDate(event.date)}</div>
                    </div>
                    <span style={{ fontSize: '18px', color: '#ccc' }}>›</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MORE TAB */}
        {activeTab === 'more' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => setShowFamilySetup(true)} style={{
              width: '100%', padding: '18px', background: 'white',
              border: '2px solid #34a853', borderRadius: '16px',
              color: '#34a853', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
            }}>
              🏠 {familyId ? 'Change Family Code' : 'Join Family'}
            </button>
            <button onClick={handleLogout} style={{
              width: '100%', padding: '18px', background: 'white',
              border: '2px solid #ff4444', borderRadius: '16px',
              color: '#ff4444', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer'
            }}>
              🚪 Logout
            </button>
            <a href="/privacy-policy" style={{
              display: 'block', padding: '14px', color: '#667eea',
              textDecoration: 'none', fontSize: '14px', fontWeight: 'bold',
              border: '2px solid #667eea', borderRadius: '14px', textAlign: 'center'
            }}>🔒 Privacy Policy</a>
          </div>
        )}
      </div>

      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Event Detail Sheet */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}

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