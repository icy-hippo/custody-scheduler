import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, updateDoc, doc, getDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';

function EditEvent({ eventId, onClose, onEventUpdated }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringEventGroupId, setRecurringEventGroupId] = useState(null);
  const [showEditScopeDialog, setShowEditScopeDialog] = useState(false);
  const [editScope, setEditScope] = useState('THIS_ONLY');

  const categories = [
    { name: 'School', color: '#667eea', icon: '📚' },
    { name: 'Sports', color: '#f093fb', icon: '⚽' },
    { name: 'Medical', color: '#4facfe', icon: '🏥' },
    { name: 'Activities', color: '#43e97b', icon: '🎨' },
    { name: 'Family', color: '#fa709a', icon: '👨‍👩‍👧' },
    { name: 'Other', color: '#a8edea', icon: '📌' }
  ];

  // Load event data
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const eventDoc = await getDoc(doc(db, 'events', eventId));
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setTitle(data.title);
          setDate(data.date);
          setTime(data.time || '');
          setLocation(data.location || '');
          setNotes(data.notes || '');
          setCategory(data.category || '');
          setIsRecurring(data.isRecurring || false);
          setRecurringEventGroupId(data.recurringEventGroupId || null);
        }
      } catch (err) {
        setError('Failed to load event: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadEvent();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!category) {
      setError('Please select a category');
      return;
    }

    // If recurring, show scope dialog instead of updating immediately
    if (isRecurring) {
      setShowEditScopeDialog(true);
      return;
    }

    // Non-recurring event: update immediately
    await performUpdate('THIS_ONLY');
  };

  const performUpdate = async (scope) => {
    setLoading(true);
    try {
      const selectedCategory = categories.find(c => c.name === category);

      const updatedData = {
        title,
        date,
        time,
        location,
        notes,
        category: selectedCategory.name,
        color: selectedCategory.color,
        icon: selectedCategory.icon,
        updatedAt: new Date()
      };

      if (scope === 'THIS_ONLY') {
        // Update just this event
        await updateDoc(doc(db, 'events', eventId), updatedData);
      } else if (scope === 'THIS_AND_FOLLOWING') {
        // Update this event and all following instances
        const batch = writeBatch(db);

        // Get the current event to find its instance index
        const currentEventDoc = await getDoc(doc(db, 'events', eventId));
        const currentInstanceIndex = currentEventDoc.data().instanceIndex || 0;

        // Get all events in the recurring series
        const allInstancesQuery = query(
          collection(db, 'events'),
          where('recurringEventGroupId', '==', recurringEventGroupId)
        );
        const allInstancesSnapshot = await getDocs(allInstancesQuery);

        // Update this and following instances
        allInstancesSnapshot.forEach(doc => {
          const instanceIndex = doc.data().instanceIndex || 0;
          if (instanceIndex >= currentInstanceIndex) {
            batch.update(doc.ref, updatedData);
          }
        });

        await batch.commit();
      } else if (scope === 'ALL') {
        // Update all instances in the series
        const batch = writeBatch(db);

        // Get all events in the recurring series
        const allInstancesQuery = query(
          collection(db, 'events'),
          where('recurringEventGroupId', '==', recurringEventGroupId)
        );
        const allInstancesSnapshot = await getDocs(allInstancesQuery);

        // Update all instances
        allInstancesSnapshot.forEach(doc => {
          batch.update(doc.ref, updatedData);
        });

        await batch.commit();
      }

      if (onEventUpdated) onEventUpdated();
      if (onClose) onClose();

      const scopeText = scope === 'THIS_ONLY' ? 'Event' : scope === 'THIS_AND_FOLLOWING' ? 'Events' : 'All events';
      alert(`${scopeText} updated successfully!`);
      setShowEditScopeDialog(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !title) {
    return (
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
        zIndex: 1000
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center'
        }}>
          <p style={{ color: '#666' }}>Loading event...</p>
        </div>
      </div>
    );
  }

  // Edit scope dialog for recurring events
  if (showEditScopeDialog) {
    return (
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
          <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Edit Recurring Event</h2>
          <p style={{ color: '#666', marginBottom: '24px', lineHeight: 1.5 }}>
            Which events do you want to update?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              border: editScope === 'THIS_ONLY' ? '2px solid #667eea' : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              background: editScope === 'THIS_ONLY' ? '#667eea15' : 'white',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="editScope"
                value="THIS_ONLY"
                checked={editScope === 'THIS_ONLY'}
                onChange={(e) => setEditScope(e.target.value)}
                style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>Only this event</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Change just this single occurrence</div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              border: editScope === 'THIS_AND_FOLLOWING' ? '2px solid #667eea' : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              background: editScope === 'THIS_AND_FOLLOWING' ? '#667eea15' : 'white',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="editScope"
                value="THIS_AND_FOLLOWING"
                checked={editScope === 'THIS_AND_FOLLOWING'}
                onChange={(e) => setEditScope(e.target.value)}
                style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>This and following events</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Update this event and all future occurrences</div>
              </div>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              border: editScope === 'ALL' ? '2px solid #667eea' : '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              background: editScope === 'ALL' ? '#667eea15' : 'white',
              transition: 'all 0.2s'
            }}>
              <input
                type="radio"
                name="editScope"
                value="ALL"
                checked={editScope === 'ALL'}
                onChange={(e) => setEditScope(e.target.value)}
                style={{ marginRight: '12px', cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>All events in series</div>
                <div style={{ fontSize: '13px', color: '#888' }}>Update every occurrence of this recurring event</div>
              </div>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => performUpdate(editScope)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
            <button
              onClick={() => setShowEditScopeDialog(false)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
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
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Edit Event</h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Event Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Soccer Practice"
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

          {/* Category */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Category *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              {categories.map(cat => (
                <div
                  key={cat.name}
                  onClick={() => setCategory(cat.name)}
                  style={{
                    padding: '12px',
                    border: category === cat.name ? `3px solid ${cat.color}` : '2px solid #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    background: category === cat.name ? `${cat.color}15` : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>{cat.icon}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{cat.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Date */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Date *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
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

          {/* Time */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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

          {/* Location */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Mom's house, School gym"
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

          {/* Notes */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional details..."
              rows="3"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                fontFamily: 'system-ui',
                resize: 'vertical'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee',
              color: '#c33',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Updating...' : 'Update Event'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditEvent;