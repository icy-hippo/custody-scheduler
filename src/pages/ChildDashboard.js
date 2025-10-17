import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import WhereAmI from '../components/WhereAmI';
import PackList from '../components/PackList';
import FamilySetup from '../components/FamilySetup';

function ChildDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [custodySchedule, setCustodySchedule] = useState(null);
  const [showFamilySetup, setShowFamilySetup] = useState(false);
  const [familyId, setFamilyId] = useState(null);

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
      const custodyDoc = await getDoc(doc(db, 'custody', user.uid));
      if (custodyDoc.exists()) {
        setCustodySchedule(custodyDoc.data());
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
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  // Get today's events
  const getTodayEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    return events.filter(event => event.date === today);
  };

  // Get next upcoming event
  const getNextEvent = () => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now || event.date === todayStr;
    });
    
    return upcomingEvents[0] || null;
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

  const todayEvents = getTodayEvents();
  const nextEvent = getNextEvent();

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
      padding: '24px',
      fontFamily: 'system-ui'
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '32px' }}>My Schedule 📅</h1>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '16px' }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {!familyId && (
              <button 
                onClick={() => setShowFamilySetup(true)}
                style={{
                  padding: '8px 16px',
                  background: '#34a853',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                Join Family
              </button>
            )}
            <button 
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '20px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Where Am I Today */}
        <WhereAmI custodySchedule={custodySchedule} />

        {/* Pack List */}
        <PackList events={events} custodySchedule={custodySchedule} />

        {/* What's Next Card */}
        {nextEvent ? (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            marginBottom: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            border: `4px solid ${nextEvent.color}`
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#888', 
              textTransform: 'uppercase',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              ⏰ What's Next
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ fontSize: '64px' }}>{nextEvent.icon}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: 0, fontSize: '28px', color: '#333' }}>{nextEvent.title}</h2>
                <p style={{ margin: '8px 0', color: '#666', fontSize: '18px' }}>
                  {formatDate(nextEvent.date)} {nextEvent.time && `at ${formatTime(nextEvent.time)}`}
                </p>
                {nextEvent.location && (
                  <p style={{ margin: 0, color: '#888', fontSize: '16px' }}>
                    📍 {nextEvent.location}
                  </p>
                )}
              </div>
              <div style={{
                background: nextEvent.color,
                color: 'white',
                padding: '12px 24px',
                borderRadius: '20px',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                {nextEvent.category}
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '40px',
            marginBottom: '24px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ margin: 0, color: '#333' }}>No upcoming events!</h2>
            <p style={{ color: '#666', marginTop: '8px' }}>Enjoy your free time!</p>
          </div>
        )}

        {/* Today's Schedule */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>
            📋 Today's Schedule
          </h2>
          
          {loading ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Loading...</p>
          ) : todayEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>😊</p>
              <p style={{ margin: 0, fontSize: '18px' }}>Nothing scheduled for today!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {todayEvents.map(event => (
                <div 
                  key={event.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '20px',
                    background: `${event.color}15`,
                    border: `3px solid ${event.color}`,
                    borderRadius: '16px'
                  }}
                >
                  <div style={{ fontSize: '48px' }}>{event.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', fontSize: '20px', color: '#333' }}>
                      {event.title}
                    </div>
                    <div style={{ color: '#666', fontSize: '16px', marginTop: '4px' }}>
                      {event.time ? formatTime(event.time) : 'All day'}
                      {event.location && ` • ${event.location}`}
                    </div>
                  </div>
                  <div style={{
                    background: event.color,
                    color: 'white',
                    padding: '8px 16px',
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

        {/* This Week Preview */}
        {events.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '32px',
            marginTop: '24px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>
              📆 Coming Up
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {events.slice(0, 6).map(event => (
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
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>{event.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {formatDate(event.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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