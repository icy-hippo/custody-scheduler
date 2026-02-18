import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc } from 'firebase/firestore';
import AddEvent from '../components/AddEvent';
import CustodySetup from '../components/CustodySetup';
import FamilySetup from '../components/FamilySetup';
import CustodyCalendar from '../components/CustodyCalendar';
import ParentLinking from '../components/ParentLinking';
import EditEvent from '../components/EditEvent';
import NotificationCenter from '../components/NotificationCenter';
import CalendarExport from '../components/CalendarExport';

function ParentDashboard() {
  const navigate = useNavigate();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showCustodySetup, setShowCustodySetup] = useState(false);
  const [showFamilySetup, setShowFamilySetup] = useState(false);
  const [showParentLinking, setShowParentLinking] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [custodySchedule, setCustodySchedule] = useState(null);
  const [familyId, setFamilyId] = useState(null);
  const [linkedParentId, setLinkedParentId] = useState(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [sortBy, setSortBy] = useState('date');

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
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.familyId) {
          setFamilyId(userData.familyId);
        }
        if (userData.linkedParentId) {
          setLinkedParentId(userData.linkedParentId);
        }
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

  const openEditEvent = (eventId) => {
    setEditingEventId(eventId);
    setShowEditEvent(true);
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

  // Get filtered and sorted events
  const getFilteredAndSortedEvents = () => {
    let filtered = events;

    // Search filter (title + location)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(term) ||
        (event.location && event.location.toLowerCase().includes(term))
      );
    }

    // Category filter
    if (filterCategory) {
      filtered = filtered.filter(event => event.category === filterCategory);
    }

    // Date range filter
    if (filterDateRange.start) {
      filtered = filtered.filter(event => event.date >= filterDateRange.start);
    }
    if (filterDateRange.end) {
      filtered = filtered.filter(event => event.date <= filterDateRange.end);
    }

    // Sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          return new Date(a.date) - new Date(b.date);
      }
    });

    return sorted;
  };

  const filteredEvents = getFilteredAndSortedEvents();

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
<div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
  <NotificationCenter userId={user.uid} />
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

          <CalendarExport events={events} custodySchedule={custodySchedule} />

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

          <button
            onClick={() => setShowParentLinking(true)}
            style={{
              padding: '16px 32px',
              background: linkedParentId ? 'white' : '#ff6b9d',
              color: linkedParentId ? '#ff6b9d' : 'white',
              border: linkedParentId ? '2px solid #ff6b9d' : 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: linkedParentId ? 'none' : '0 4px 12px rgba(255, 107, 157, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            👥 {linkedParentId ? 'Co-Parent Linked' : 'Link Co-Parent'}
          </button>
        </div>

        {/* Custody Calendar */}
        {custodySchedule && (
          <div style={{ marginBottom: '24px' }}>
            <CustodyCalendar custodySchedule={custodySchedule} />
          </div>
        )}

        {/* Search and Filter Bar */}
        {events.length > 0 && (
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '16px' }}>
              🔍 Search & Filter Events
            </h3>

            {/* Search Input */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title or location..."
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      padding: '12px 16px',
                      background: '#f5f7fa',
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#666'
                    }}
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500', fontSize: '14px' }}>
                Category
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setFilterCategory('')}
                  style={{
                    padding: '8px 16px',
                    background: filterCategory === '' ? '#667eea' : 'white',
                    color: filterCategory === '' ? 'white' : '#667eea',
                    border: filterCategory === '' ? 'none' : '2px solid #667eea',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  All
                </button>
                {['School', 'Sports', 'Medical', 'Activities', 'Family', 'Other'].map(category => (
                  <button
                    key={category}
                    onClick={() => setFilterCategory(filterCategory === category ? '' : category)}
                    style={{
                      padding: '8px 16px',
                      background: filterCategory === category ? '#667eea' : 'white',
                      color: filterCategory === category ? 'white' : '#667eea',
                      border: filterCategory === category ? 'none' : '2px solid #667eea',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div style={{ marginBottom: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500', fontSize: '14px' }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={filterDateRange.start}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, start: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500', fontSize: '14px' }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={filterDateRange.end}
                  onChange={(e) => setFilterDateRange({ ...filterDateRange, end: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Sort and Clear Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <label style={{ color: '#666', fontWeight: '500', fontSize: '14px' }}>Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="category">Category</option>
                </select>
              </div>

              {(searchTerm || filterCategory || filterDateRange.start || filterDateRange.end || sortBy !== 'date') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterCategory('');
                    setFilterDateRange({ start: '', end: '' });
                    setSortBy('date');
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#f5f7fa',
                    color: '#666',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Results Summary */}
            {events.length > 0 && (
              <div style={{ marginTop: '12px', color: '#888', fontSize: '14px' }}>
                Showing {filteredEvents.length} of {events.length} events
              </div>
            )}
          </div>
        )}

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
          ) : filteredEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>🔍</p>
              <p style={{ margin: 0 }}>No events match your filters. Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {filteredEvents.map(event => (
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
                    onClick={() => openEditEvent(event.id)}
                    style={{
                      background: '#4facfe',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    Edit
                  </button>
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

      {/* Parent Linking Modal */}
      {showParentLinking && (
        <ParentLinking
          onClose={() => setShowParentLinking(false)}
          onParentLinked={() => {
            loadFamily();
            loadEvents();
          }}
          familyId={familyId}
        />
      )}

      {/* Edit Event Modal */}
      {showEditEvent && editingEventId && (
        <EditEvent
          eventId={editingEventId}
          onClose={() => {
            setShowEditEvent(false);
            setEditingEventId(null);
          }}
          onEventUpdated={loadEvents}
        />
      )}
    </div>
  );
}

export default ParentDashboard;