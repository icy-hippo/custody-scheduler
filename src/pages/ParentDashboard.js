import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import AddEvent from '../components/AddEvent';
import CustodySetup from '../components/CustodySetup';
import FamilySetup from '../components/FamilySetup';

function ParentDashboard() {
  const navigate = useNavigate();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showCustodySetup, setShowCustodySetup] = useState(false);
  const [showFamilySetup, setShowFamilySetup] = useState(false);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [custodySchedule, setCustodySchedule] = useState(null);
  const [familyId, setFamilyId] = useState(null);

  // Listen for auth state changes
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

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

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

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'events', eventId));
      alert('Event deleted successfully!');
      loadEvents();
    } catch (err) {
      console.error('Error deleting event:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  // Load events, custody, and family when user is ready
  useEffect(() => {
    if (user) {
      loadEvents();
      loadCustodySchedule();
      loadFamily();
    }
  }, [user]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Show loading while checking auth
  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', padding: '40px', fontFamily: 'system-ui' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '32px',
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h1 style={{ margin: 0, color: '#333' }}>Parent Dashboard</h1>
            <p style={{ margin: '8px 0 0 0', color: '#666' }}>Manage your family's schedule</p>
          </div>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 24px',
              background: 'white',
              color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setShowAddEvent(true)}
            style={{
              padding: '16px 32px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span style={{ fontSize: '20px' }}>+</span> Add New Event
          </button>

          <button
            onClick={() => setShowCustodySetup(true)}
            style={{
              padding: '16px 32px',
              background: custodySchedule ? 'white' : '#4facfe',
              color: custodySchedule ? '#4facfe' : 'white',
              border: custodySchedule ? '2px solid #4facfe' : 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: custodySchedule ? 'none' : '0 4px 12px rgba(79, 172, 254, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🏠 {custodySchedule ? 'Edit Custody Schedule' : 'Set Up Custody Schedule'}
          </button>

          <button
            onClick={() => setShowFamilySetup(true)}
            style={{
              padding: '16px 32px',
              background: familyId ? 'white' : '#34a853',
              color: familyId ? '#34a853' : 'white',
              border: familyId ? '2px solid #34a853' : 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: familyId ? 'none' : '0 4px 12px rgba(52, 168, 83, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            👨‍👩‍👧 {familyId ? `Family: ${familyId}` : 'Set Up Family'}
          </button>
        </div>

        {/* Events List */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ marginTop: 0, color: '#333' }}>Upcoming Events</h2>
          
          {loading ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>Loading events...</p>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📅</p>
              <p style={{ margin: 0 }}>No events yet. Click "Add New Event" to get started!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {events.map(event => (
                <div 
                  key={event.id}
                  style={{
                    padding: '16px',
                    border: `2px solid ${event.color}`,
                    borderLeft: `6px solid ${event.color}`,
                    borderRadius: '8px',
                    background: `${event.color}10`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}
                >
                  <div style={{ fontSize: '32px' }}>{event.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '18px' }}>{event.title}</div>
                    <div style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      {formatDate(event.date)} {event.time && `at ${event.time}`}
                      {event.location && ` • ${event.location}`}
                    </div>
                    {event.notes && (
                      <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
                        {event.notes}
                      </div>
                    )}
                  </div>
                  <div style={{
                    background: event.color,
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {event.category}
                  </div>
                  <button
                    onClick={() => deleteEvent(event.id)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEvent && (
        <AddEvent 
          onClose={() => setShowAddEvent(false)}
          onEventAdded={loadEvents}
        />
      )}

      {/* Custody Setup Modal */}
      {showCustodySetup && (
        <CustodySetup 
          onClose={() => setShowCustodySetup(false)}
          onScheduleSet={loadCustodySchedule}
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

export default ParentDashboard;