import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, getDoc, deleteDoc, writeBatch, updateDoc } from 'firebase/firestore';
import AddEvent from '../components/AddEvent';
import CustodySetup from '../components/CustodySetup';
import FamilySetup from '../components/FamilySetup';
import CustodyCalendar from '../components/CustodyCalendar';
import ParentLinking from '../components/ParentLinking';
import EditEvent from '../components/EditEvent';
import NotificationCenter from '../components/NotificationCenter';
import CalendarExport from '../components/CalendarExport';
import BottomTabBar from '../components/BottomTabBar';
import ExpenseTracker from '../components/ExpenseTracker';
import MessageThread from '../components/MessageThread';
import { createNotification } from '../services/NotificationService';
import RoutineSetup from '../components/RoutineSetup';
import ChildInvite from '../components/ChildInvite';
import { scheduleAllNotifications } from '../services/LocalNotificationService';
import ChildMessages from '../components/ChildMessages';
import EventDetail from '../components/EventDetail';

const localDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

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
  const [currentUserName, setCurrentUserName] = useState('');
  const [activeTab, setActiveTab] = useState('events');

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateRange] = useState({ start: '', end: '' });
  const [sortBy] = useState('date');

  const [showRoutineSetup, setShowRoutineSetup] = useState(false);
  const [showChildInvite, setShowChildInvite] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Delete scope dialog state for recurring events
  const [showDeleteScopeDialog, setShowDeleteScopeDialog] = useState(false);
  const [deleteEventData, setDeleteEventData] = useState(null);
  const [deleteScope, setDeleteScope] = useState('THIS_ONLY');

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
      
      const todayStr = localDateStr();
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('familyId', '==', userFamilyId || user.uid),
        where('date', '>=', todayStr),
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
        if (userData.familyId) setFamilyId(userData.familyId);
        if (userData.linkedParentId) setLinkedParentId(userData.linkedParentId);
        if (userData.name) setCurrentUserName(userData.name);

        // If not yet linked, check if a sent invite was accepted
        if (!userData.linkedParentId) {
          const inviteQuery = query(
            collection(db, 'parentInvites'),
            where('invitedBy', '==', user.uid),
            where('status', '==', 'accepted')
          );
          const inviteSnap = await getDocs(inviteQuery);
          if (!inviteSnap.empty) {
            const invite = inviteSnap.docs[0].data();
            await updateDoc(doc(db, 'users', user.uid), {
              linkedParentId: invite.acceptedBy,
              familyId: invite.familyId
            });
            setLinkedParentId(invite.acceptedBy);
            setFamilyId(invite.familyId);
          }
        }
      }
    } catch (err) {
      console.error('Error loading family:', err);
    }
  };

  const deleteEvent = async (eventId) => {
    try {
      // Load the event to check if it's recurring
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (!eventDoc.exists()) return;

      const eventData = eventDoc.data();

      // If recurring, show scope dialog; otherwise delete immediately
      if (eventData.isRecurring) {
        setDeleteEventData({ id: eventId, ...eventData });
        setDeleteScope('THIS_ONLY');
        setShowDeleteScopeDialog(true);
      } else {
        if (!window.confirm('Are you sure you want to delete this event?')) {
          return;
        }
        await performDelete(eventId, 'THIS_ONLY', null, null, eventData);
      }
    } catch (err) {
      console.error('Error preparing event deletion:', err);
      alert('Failed to delete event. Please try again.');
    }
  };

  const performDelete = async (eventId, scope, recurringGroupId, instanceIndex, eventDataOverride) => {
    try {
      if (scope === 'THIS_ONLY') {
        // Delete just this event
        await deleteDoc(doc(db, 'events', eventId));
      } else if (scope === 'THIS_AND_FOLLOWING') {
        // Delete this event and all following instances
        const batch = writeBatch(db);

        // Get all events in the recurring series
        const allInstancesQuery = query(
          collection(db, 'events'),
          where('recurringEventGroupId', '==', recurringGroupId)
        );
        const allInstancesSnapshot = await getDocs(allInstancesQuery);

        // Delete this and following instances
        allInstancesSnapshot.forEach(doc => {
          const docInstanceIndex = doc.data().instanceIndex || 0;
          if (docInstanceIndex >= instanceIndex) {
            batch.delete(doc.ref);
          }
        });

        await batch.commit();
      } else if (scope === 'ALL') {
        // Delete all instances in the series
        const batch = writeBatch(db);

        // Get all events in the recurring series
        const allInstancesQuery = query(
          collection(db, 'events'),
          where('recurringEventGroupId', '==', recurringGroupId)
        );
        const allInstancesSnapshot = await getDocs(allInstancesQuery);

        // Delete all instances
        allInstancesSnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
      }

      // Notify co-parent about the deletion
      const deletedEventTitle = (eventDataOverride || deleteEventData)?.title;
      const deletedEventDate = (eventDataOverride || deleteEventData)?.date;
      if (deletedEventTitle && user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userName = (userDoc.exists() && userDoc.data().name) || 'Your co-parent';
        if (linkedParentId) {
          await createNotification(
            linkedParentId,
            'Event Removed',
            `${userName} removed "${deletedEventTitle}"`,
            'event_deleted',
            { eventTitle: deletedEventTitle, deletedBy: user.uid }
          );
        }
        // Notify child accounts in the family
        if (familyId) {
          const familyDoc = await getDoc(doc(db, 'families', familyId));
          if (familyDoc.exists()) {
            const members = familyDoc.data().members || [];
            for (const memberId of members) {
              if (memberId === user.uid || memberId === linkedParentId) continue;
              const memberDoc = await getDoc(doc(db, 'users', memberId));
              if (memberDoc.exists() && memberDoc.data().role === 'child') {
                const dateFormatted = deletedEventDate
                  ? new Date(deletedEventDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
                  : '';
                await createNotification(
                  memberId,
                  '📅 Something changed!',
                  `${deletedEventTitle}${dateFormatted ? ' on ' + dateFormatted : ''} has been cancelled. Your schedule has been updated.`,
                  'event_deleted_child',
                  { eventTitle: deletedEventTitle, eventDate: deletedEventDate }
                );
              }
            }
          }
        }
      }

      alert('Event deleted successfully!');
      loadEvents();
      setShowDeleteScopeDialog(false);
      setDeleteEventData(null);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Schedule local notifications whenever events or custody schedule change
  useEffect(() => {
    scheduleAllNotifications({ events, custodySchedule });
  }, [events, custodySchedule]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Get filtered and sorted events
  const getFilteredAndSortedEvents = () => {
    const today = localDateStr();

    // For recurring events, only keep the next upcoming instance per group
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
        nonRecurring.push(event);
      }
    });

    let filtered = [...nonRecurring.filter(e => e.date >= today), ...Object.values(recurringGroupMap)];

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

  const tabs = [
    { id: 'events', icon: '📅', label: 'Events' },
    { id: 'calendar', icon: '🏠', label: 'Calendar' },
    { id: 'messages', icon: '💬', label: 'Messages' },
    { id: 'expenses', icon: '💰', label: 'Expenses' },
    { id: 'settings', icon: '⚙️', label: 'More' },
  ];

  const pageStyle = {
    minHeight: '100vh',
    background: '#f5f7fa',
    fontFamily: 'system-ui',
    paddingBottom: '72px'
  };

  const contentStyle = {
    padding: '16px',
    maxWidth: '700px',
    margin: '0 auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    background: 'white',
    padding: '14px 16px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  };

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={{ margin: 0, color: '#333', fontSize: '20px' }}>HarmonyHub</h1>
            <p style={{ margin: '2px 0 0 0', color: '#888', fontSize: '12px' }}>
              {currentUserName || 'Parent Dashboard'}
            </p>
          </div>
          <NotificationCenter userId={user.uid} />
        </div>

        {/* EVENTS TAB */}
        {activeTab === 'events' && (
          <div>
            <button
              onClick={() => setShowAddEvent(true)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '20px' }}>+</span> Add New Event
            </button>

            {/* Search */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search events..."
                style={{
                  flex: 1, padding: '10px 14px', border: '1px solid #ddd',
                  borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box'
                }}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} style={{
                  padding: '10px 14px', background: '#f5f7fa', border: '1px solid #ddd',
                  borderRadius: '8px', cursor: 'pointer', color: '#666', fontWeight: 'bold'
                }}>✕</button>
              )}
            </div>

            {/* Category pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
              {['All', 'School', 'Sports', 'Medical', 'Activities', 'Family', 'Other'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat === 'All' ? '' : (filterCategory === cat ? '' : cat))}
                  style={{
                    padding: '6px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                    background: (cat === 'All' && filterCategory === '') || filterCategory === cat ? '#667eea' : '#eee',
                    color: (cat === 'All' && filterCategory === '') || filterCategory === cat ? 'white' : '#555',
                    fontWeight: '600', fontSize: '13px', flexShrink: 0, whiteSpace: 'nowrap'
                  }}
                >{cat}</button>
              ))}
            </div>

            {/* Events List */}
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h2 style={{ marginTop: 0, color: '#333', fontSize: '17px' }}>Upcoming Events</h2>
              {loading ? (
                <p style={{ color: '#666', textAlign: 'center', padding: '32px' }}>Loading...</p>
              ) : events.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                  <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>📅</p>
                  <p style={{ margin: 0 }}>No events yet. Tap "Add New Event" to start!</p>
                </div>
              ) : filteredEvents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#666' }}>
                  <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>🔍</p>
                  <p style={{ margin: 0 }}>No events match your search.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {filteredEvents.map(event => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      style={{
                        padding: '12px', border: `2px solid ${event.color}`,
                        borderLeft: `6px solid ${event.color}`, borderRadius: '8px',
                        background: `${event.color}10`, cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div style={{ fontSize: '26px', flexShrink: 0 }}>{event.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 'bold', color: '#333', fontSize: '15px', wordBreak: 'break-word' }}>{event.title}</div>
                          <div style={{ color: '#666', fontSize: '12px', marginTop: '2px' }}>
                            {formatDate(event.date)}{event.time && ` at ${event.time}`}
                            {event.location && ` • ${event.location}`}
                          </div>
                          {event.notes && <div style={{ color: '#888', fontSize: '11px', marginTop: '2px' }}>{event.notes}</div>}
                        </div>
                        <div style={{
                          background: event.color, color: 'white', padding: '2px 7px',
                          borderRadius: '10px', fontSize: '10px', fontWeight: 'bold', flexShrink: 0
                        }}>{event.category}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {event.isRecurring && (
                          <span style={{
                            background: '#667eea', color: 'white', padding: '3px 8px',
                            borderRadius: '10px', fontSize: '10px', fontWeight: 'bold'
                          }}>🔄 Recurring</span>
                        )}
                        <button onClick={e => { e.stopPropagation(); openEditEvent(event.id); }} style={{
                          background: '#4facfe', color: 'white', border: 'none',
                          borderRadius: '8px', padding: '5px 14px', cursor: 'pointer',
                          fontWeight: 'bold', fontSize: '13px'
                        }}>Edit</button>
                        <button onClick={e => { e.stopPropagation(); deleteEvent(event.id); }} style={{
                          background: '#ff4444', color: 'white', border: 'none',
                          borderRadius: '8px', padding: '5px 14px', cursor: 'pointer',
                          fontWeight: 'bold', fontSize: '13px'
                        }}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CALENDAR TAB */}
        {activeTab === 'calendar' && (
          <div>
            {custodySchedule ? (
              <CustodyCalendar custodySchedule={custodySchedule} events={events} />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>🏠</p>
                <p style={{ color: '#666', marginBottom: '16px' }}>No custody schedule set up yet.</p>
                <button onClick={() => setShowCustodySetup(true)} style={{
                  padding: '12px 24px', background: '#4facfe', color: 'white',
                  border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer'
                }}>Set Up Custody Schedule</button>
              </div>
            )}
            {custodySchedule && (
              <button onClick={() => setShowCustodySetup(true)} style={{
                width: '100%', marginTop: '12px', padding: '12px',
                background: 'white', color: '#4facfe', border: '2px solid #4facfe',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
              }}>Edit Custody Schedule</button>
            )}
            <CalendarExport events={events} custodySchedule={custodySchedule} />
          </div>
        )}

        {/* MESSAGES TAB */}
        {activeTab === 'messages' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <MessageThread
              familyId={familyId}
              linkedParentId={linkedParentId}
              currentUserName={currentUserName}
              fullPage
            />
            {familyId && (
              <ChildMessages
                familyId={familyId}
                userId={user?.uid}
                userName={currentUserName}
              />
            )}
          </div>
        )}

        {/* EXPENSES TAB */}
        {activeTab === 'expenses' && (
          familyId ? (
            <ExpenseTracker
              familyId={familyId}
              linkedParentId={linkedParentId}
              currentUserName={currentUserName}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: '40px', margin: '0 0 12px 0' }}>💰</p>
              <p style={{ color: '#666' }}>Set up a family group to track shared expenses.</p>
            </div>
          )
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>Account</h3>
              <p style={{ margin: '0 0 4px 0', color: '#666', fontSize: '14px' }}>Logged in as <strong>{user.email}</strong></p>
              <p style={{ margin: '0 0 16px 0', color: '#888', fontSize: '13px' }}>Name: {currentUserName}</p>
              <button onClick={handleLogout} style={{
                width: '100%', padding: '12px', background: 'white', color: '#ff4444',
                border: '2px solid #ff4444', borderRadius: '10px', fontWeight: 'bold',
                cursor: 'pointer', fontSize: '14px'
              }}>Log Out</button>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>Family</h3>
              <button onClick={() => setShowFamilySetup(true)} style={{
                width: '100%', padding: '12px', marginBottom: '8px',
                background: familyId ? 'white' : '#34a853', color: familyId ? '#34a853' : 'white',
                border: familyId ? '2px solid #34a853' : 'none',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
              }}>👨‍👩‍👧 {familyId ? `Family Code: ${familyId}` : 'Set Up Family'}</button>
              <button onClick={() => setShowParentLinking(true)} style={{
                width: '100%', padding: '12px',
                background: linkedParentId ? 'white' : '#ff6b9d',
                color: linkedParentId ? '#ff6b9d' : 'white',
                border: linkedParentId ? '2px solid #ff6b9d' : 'none',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
              }}>👥 {linkedParentId ? 'Co-Parent Linked ✓' : 'Link Co-Parent'}</button>
              {familyId && (
                <button onClick={() => setShowRoutineSetup(true)} style={{
                  width: '100%', padding: '12px', marginTop: '8px',
                  background: 'white', color: '#667eea',
                  border: '2px solid #667eea',
                  borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
                }}>🏠 Manage Routines</button>
              )}
              {familyId && (
                <button onClick={() => setShowChildInvite(true)} style={{
                  width: '100%', padding: '12px', marginTop: '8px',
                  background: 'white', color: '#43a047',
                  border: '2px solid #43a047',
                  borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
                }}>👧 Invite Child</button>
              )}
            </div>

            <div style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>Legal</h3>
              <a href="/privacy-policy" style={{
                display: 'block', padding: '12px', color: '#667eea',
                textDecoration: 'none', fontSize: '14px', fontWeight: 'bold',
                border: '2px solid #667eea', borderRadius: '10px', textAlign: 'center'
              }}>🔒 Privacy Policy</a>
            </div>
          </div>
        )}

      </div>

      <BottomTabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Add Event Modal */}
      {showAddEvent && (
        <AddEvent
          onClose={() => setShowAddEvent(false)}
          onEventAdded={loadEvents}
          linkedParentId={linkedParentId}
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
          linkedParentId={linkedParentId}
        />
      )}

      {/* Event Detail Sheet */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(id) => { setSelectedEvent(null); openEditEvent(id); }}
          onDelete={(id) => { setSelectedEvent(null); deleteEvent(id); }}
        />
      )}

      {/* Child Invite Modal */}
      {showChildInvite && familyId && (
        <ChildInvite familyId={familyId} onClose={() => setShowChildInvite(false)} />
      )}

      {/* Routine Setup Modal */}
      {showRoutineSetup && familyId && (
        <RoutineSetup
          familyId={familyId}
          onClose={() => setShowRoutineSetup(false)}
        />
      )}

      {/* Delete Scope Dialog for Recurring Events */}
      {showDeleteScopeDialog && deleteEventData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#333' }}>Delete Recurring Event</h2>
            <p style={{ color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
              Which events do you want to delete?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: deleteScope === 'THIS_ONLY' ? '2px solid #ff4444' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: deleteScope === 'THIS_ONLY' ? '#ff444415' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="deleteScope"
                  value="THIS_ONLY"
                  checked={deleteScope === 'THIS_ONLY'}
                  onChange={(e) => setDeleteScope(e.target.value)}
                  style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>Only this event</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Delete just this single occurrence</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: deleteScope === 'THIS_AND_FOLLOWING' ? '2px solid #ff4444' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: deleteScope === 'THIS_AND_FOLLOWING' ? '#ff444415' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="deleteScope"
                  value="THIS_AND_FOLLOWING"
                  checked={deleteScope === 'THIS_AND_FOLLOWING'}
                  onChange={(e) => setDeleteScope(e.target.value)}
                  style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>This and following events</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Delete this event and all future occurrences</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: deleteScope === 'ALL' ? '2px solid #ff4444' : '1px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                background: deleteScope === 'ALL' ? '#ff444415' : 'white',
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="deleteScope"
                  value="ALL"
                  checked={deleteScope === 'ALL'}
                  onChange={(e) => setDeleteScope(e.target.value)}
                  style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>All events in series</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Delete every occurrence of this recurring event</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => performDelete(
                  deleteEventData.id,
                  deleteScope,
                  deleteEventData.recurringEventGroupId,
                  deleteEventData.instanceIndex || 0
                )}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#ff4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteScopeDialog(false);
                  setDeleteEventData(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'white',
                  color: '#333',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParentDashboard;