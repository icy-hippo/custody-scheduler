import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import WhereAmI from '../components/WhereAmI';
import PackList from '../components/PackList';
import FamilySetup from '../components/FamilySetup';
import NotificationCenter from '../components/NotificationCenter';
import VisualSchedule from '../components/VisualSchedule';
import NowNextLaterHome from '../components/NowNextLaterHome';
import RoutineCards from '../components/RoutineCards';
import ChangeExplanation from '../components/ChangeExplanation';
import SocialStoryBuilder from '../components/SocialStoryBuilder';
import VisualLabelGrid from '../components/VisualLabelGrid';
import CustodyPatternPreview from '../components/CustodyPatternPreview';
import {
  formatFriendlyDate,
  formatFriendlyTime,
  getTodayEvents,
  isEventUpcoming,
} from '../utils/custodySchedule';
import { DEFAULT_VISUAL_LABELS } from '../utils/spectrumSupport';

const childTabs = [
  { id: 'now', label: 'Now', icon: 'Home' },
  { id: 'week', label: 'Week', icon: 'Week' },
  { id: 'pack', label: 'Pack', icon: 'Bag' },
  { id: 'story', label: 'Story', icon: 'Story' },
  { id: 'routines', label: 'Routines', icon: 'List' },
];

function ChildDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [custodySchedule, setCustodySchedule] = useState(null);
  const [showFamilySetup, setShowFamilySetup] = useState(false);
  const [familyId, setFamilyId] = useState(null);
  const [calmMode, setCalmMode] = useState(false);
  const [visualLabels, setVisualLabels] = useState(DEFAULT_VISUAL_LABELS);
  const [activeTab, setActiveTab] = useState('now');

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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const loadEvents = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userFamilyId = userDoc.exists() && userDoc.data().familyId;

      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('familyId', '==', userFamilyId || user.uid),
        orderBy('date', 'asc')
      );

      const querySnapshot = await getDocs(q);
      const eventsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEvents(eventsData);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCustodySchedule = async () => {
    if (!user) return;

    try {
      let custodyDoc = await getDoc(doc(db, 'custody', user.uid));
      if (custodyDoc.exists()) {
        setCustodySchedule(custodyDoc.data());
        return;
      }

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

  const loadVisualLabels = async (fid) => {
    if (!fid) return;

    try {
      const labelsRef = collection(db, 'visualLabels');
      const labelsQuery = query(labelsRef, where('familyId', '==', fid));
      const snapshot = await getDocs(labelsQuery);
      const labels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVisualLabels(labels.length ? labels : DEFAULT_VISUAL_LABELS);
    } catch (err) {
      console.error('Error loading picture labels:', err);
      setVisualLabels(DEFAULT_VISUAL_LABELS);
    }
  };

  const loadFamily = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists() && userDoc.data().familyId) {
        const fid = userDoc.data().familyId;
        setFamilyId(fid);
        await loadVisualLabels(fid);
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

  const todayEvents = getTodayEvents(events, currentTime);
  const upcomingEvents = events
    .filter(event => isEventUpcoming(event, currentTime))
    .slice(0, 6);
  const background = calmMode ? '#eef1ea' : '#f6fbfb';
  const activeTabInfo = childTabs.find(tab => tab.id === activeTab);

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

  const renderTodaySchedule = () => (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '18px',
      padding: calmMode ? '22px' : '28px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.08)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>Today's Schedule</h2>
      {loading ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '36px' }}>Loading...</p>
      ) : todayEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '36px', color: '#666' }}>
          <p style={{ margin: 0, fontSize: '18px' }}>Nothing scheduled for today.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '14px' }}>
          {todayEvents.map(event => (
            <div
              key={event.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '18px',
                background: `${event.color}15`,
                border: `3px solid ${event.color}`,
                borderRadius: '14px',
                flexWrap: 'wrap'
              }}
            >
              <div style={{ fontSize: calmMode ? '28px' : '40px', fontWeight: 'bold' }}>{event.icon}</div>
              <div style={{ flex: 1, minWidth: '210px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#333' }}>{event.title}</div>
                <div style={{ color: '#666', fontSize: '16px', marginTop: '4px' }}>
                  {event.time ? formatFriendlyTime(event.time) : 'All day'}
                  {event.location && ` - ${event.location}`}
                </div>
              </div>
              <div style={{
                background: event.color,
                color: 'white',
                padding: '8px 14px',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                {event.category}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background, fontFamily: 'system-ui', padding: '18px 18px 96px' }}>
      <div style={{ maxWidth: '920px', margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '18px',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#263238', fontSize: '30px' }}>
              {activeTabInfo?.label || 'My Schedule'}
            </h1>
            <p style={{ margin: '4px 0 0 0', color: '#607d8b', fontSize: '15px' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <NotificationCenter userId={user.uid} />
            <button
              onClick={() => setCalmMode(!calmMode)}
              style={{
                padding: '10px 16px',
                background: calmMode ? '#2a9d8f' : 'white',
                color: calmMode ? 'white' : '#2a9d8f',
                border: '2px solid #2a9d8f',
                borderRadius: '18px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              {calmMode ? 'Calm On' : 'Calm Mode'}
            </button>
            {!familyId && (
              <button
                onClick={() => setShowFamilySetup(true)}
                style={{
                  padding: '10px 14px',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '18px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px'
                }}
              >
                Join Family
              </button>
            )}
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 16px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '18px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '13px'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {activeTab === 'now' && (
          <>
            <NowNextLaterHome custodySchedule={custodySchedule} events={events} currentTime={currentTime} calmMode={calmMode} />
            <WhereAmI custodySchedule={custodySchedule} calmMode={calmMode} />
            {renderTodaySchedule()}
          </>
        )}

        {activeTab === 'week' && (
          <>
            <VisualSchedule custodySchedule={custodySchedule} events={events} calmMode={calmMode} />
            <CustodyPatternPreview custodySchedule={custodySchedule} calmMode={calmMode} />
            {upcomingEvents.length > 0 && (
              <div style={{
                background: 'white',
                borderRadius: calmMode ? '12px' : '18px',
                padding: calmMode ? '22px' : '28px',
                boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.08)'
              }}>
                <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>Coming Up</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px' }}>
                  {upcomingEvents.map(event => (
                    <div
                      key={event.id}
                      style={{
                        padding: '16px',
                        background: `${event.color}15`,
                        border: `2px solid ${event.color}`,
                        borderRadius: '12px',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{ fontSize: calmMode ? '24px' : '30px', marginBottom: '8px', fontWeight: 'bold' }}>{event.icon}</div>
                      <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{event.title}</div>
                      <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{formatFriendlyDate(event.date, currentTime)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'pack' && (
          <>
            <PackList events={events} custodySchedule={custodySchedule} calmMode={calmMode} />
            <VisualLabelGrid labels={visualLabels} calmMode={calmMode} />
          </>
        )}

        {activeTab === 'story' && (
          <>
            <ChangeExplanation events={events} currentTime={currentTime} calmMode={calmMode} />
            <SocialStoryBuilder custodySchedule={custodySchedule} calmMode={calmMode} visualLabels={visualLabels} />
          </>
        )}

        {activeTab === 'routines' && <RoutineCards calmMode={calmMode} />}
      </div>

      <nav style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'white',
        borderTop: '1px solid #dbe3e6',
        boxShadow: '0 -4px 18px rgba(0,0,0,0.08)',
        padding: '8px 10px',
        zIndex: 20
      }}>
        <div style={{ maxWidth: '920px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
          {childTabs.map(tab => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  minHeight: '58px',
                  padding: '8px 4px',
                  background: selected ? '#2a9d8f' : '#f5f7fa',
                  color: selected ? 'white' : '#455a64',
                  border: selected ? '2px solid #2a9d8f' : '2px solid #e3eaee',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                <div style={{ fontSize: '13px', marginBottom: '3px' }}>{tab.icon}</div>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

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
