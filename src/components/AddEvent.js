import { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, doc, getDoc, writeBatch } from 'firebase/firestore';

function AddEvent({ onClose, onEventAdded }) {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Recurrence state
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('WEEKLY');
  const [daysOfWeek, setDaysOfWeek] = useState([1]); // 0=Sun, 1=Mon, etc.
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  const categories = [
    { name: 'School', color: '#667eea', icon: '📚' },
    { name: 'Sports', color: '#f093fb', icon: '⚽' },
    { name: 'Medical', color: '#4facfe', icon: '🏥' },
    { name: 'Activities', color: '#43e97b', icon: '🎨' },
    { name: 'Family', color: '#fa709a', icon: '👨‍👩‍👧' },
    { name: 'Other', color: '#a8edea', icon: '📌' }
  ];

  // Generate UUID for recurring event grouping
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  // Check if date matches recurrence pattern
  const matchesRecurrencePattern = (checkDate, startDate) => {
    const dayOfWeek = checkDate.getDay();

    switch (recurrenceType) {
      case 'DAILY':
        return true;
      case 'WEEKLY':
        return daysOfWeek.includes(dayOfWeek);
      case 'BIWEEKLY':
        const weeksDiff = Math.floor((checkDate - startDate) / (7 * 24 * 60 * 60 * 1000));
        return weeksDiff % 2 === 0 && daysOfWeek.includes(dayOfWeek);
      case 'MONTHLY':
        return checkDate.getDate() === startDate.getDate();
      default:
        return false;
    }
  };

  // Generate all instances for recurring event
  const generateRecurringInstances = (baseEventData) => {
    if (!isRecurring || !recurrenceEndDate) {
      return [baseEventData];
    }

    const instances = [];
    const startDate = new Date(baseEventData.date);
    const endDate = new Date(recurrenceEndDate);
    const groupId = generateUUID();

    let currentDate = new Date(startDate);
    let instanceIndex = 0;

    while (currentDate <= endDate && instanceIndex < 200) { // Max 200 instances to prevent browser crash
      if (matchesRecurrencePattern(currentDate, startDate)) {
        instances.push({
          ...baseEventData,
          date: currentDate.toISOString().split('T')[0],
          isRecurring: true,
          recurrenceType,
          recurringEventGroupId: groupId,
          instanceIndex: instances.length
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return instances.length > 0 ? instances : [baseEventData];
  };

  // Format recurrence preview
  const formatRecurrencePreview = () => {
    if (!isRecurring || recurrenceType === 'NONE') {
      return '';
    }

    let preview = 'Repeats ';

    switch (recurrenceType) {
      case 'DAILY':
        preview += 'daily';
        break;
      case 'WEEKLY':
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNames = daysOfWeek.sort().map(d => days[d]).join(', ');
        preview += `every ${dayNames}`;
        break;
      case 'BIWEEKLY':
        const days2 = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayNames2 = daysOfWeek.sort().map(d => days2[d]).join(', ');
        preview += `every 2 weeks on ${dayNames2}`;
        break;
      case 'MONTHLY':
        preview += 'on the ' + new Date(date).getDate() + 'th of each month';
        break;
      default:
        return '';
    }

    if (recurrenceEndDate) {
      const endDate = new Date(recurrenceEndDate);
      const formattedEnd = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      preview += ` until ${formattedEnd}`;
    }

    return preview;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!category) {
      setError('Please select a category');
      setLoading(false);
      return;
    }

    try {
      const user = auth.currentUser;
      const selectedCategory = categories.find(c => c.name === category);

      // Get user's familyId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const familyId = userDoc.exists() && userDoc.data().familyId;

      const baseEventData = {
        title,
        date,
        time,
        location,
        notes,
        category: selectedCategory.name,
        color: selectedCategory.color,
        icon: selectedCategory.icon,
        createdBy: user.uid,
        createdAt: new Date(),
        familyId: familyId || user.uid,
        isRecurring: isRecurring && recurrenceType !== 'NONE'
      };

      // Generate instances if recurring
      const eventsToAdd = generateRecurringInstances(baseEventData);

      // Batch write all instances
      const batch = writeBatch(db);
      eventsToAdd.forEach((eventData) => {
        const docRef = doc(collection(db, 'events'));
        batch.set(docRef, eventData);
      });
      await batch.commit();

      // Clear form
      setTitle('');
      setDate('');
      setTime('');
      setLocation('');
      setNotes('');
      setCategory('');
      setIsRecurring(false);
      setRecurrenceType('WEEKLY');
      setDaysOfWeek([1]);
      setRecurrenceEndDate('');

      if (onEventAdded) onEventAdded();
      if (onClose) onClose();

      const count = eventsToAdd.length;
      const message = count === 1 ? 'Event added successfully!' : `${count} recurring events added successfully!`;
      alert(message);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
          <h2 style={{ margin: 0, color: '#333' }}>Add New Event</h2>
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

          {/* Recurrence Options */}
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Make This Event Recurring?
            </label>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', color: '#333' }}>
                <input
                  type="radio"
                  name="recurrence"
                  checked={!isRecurring}
                  onChange={() => setIsRecurring(false)}
                  style={{ marginRight: '8px' }}
                />
                One-time event
              </label>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', cursor: 'pointer', color: '#333' }}>
                <input
                  type="radio"
                  name="recurrence"
                  checked={isRecurring}
                  onChange={() => setIsRecurring(true)}
                  style={{ marginRight: '8px' }}
                />
                Repeat event
              </label>
            </div>

            {isRecurring && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#666' }}>
                    Repeat Pattern
                  </label>
                  <select
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Every 2 Weeks</option>
                    <option value="MONTHLY">Monthly</option>
                  </select>
                </div>

                {(recurrenceType === 'WEEKLY' || recurrenceType === 'BIWEEKLY') && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#666' }}>
                      Days of Week
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, idx) => (
                        <label key={day} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '13px', color: '#333' }}>
                          <input
                            type="checkbox"
                            checked={daysOfWeek.includes(idx)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDaysOfWeek([...daysOfWeek, idx]);
                              } else {
                                setDaysOfWeek(daysOfWeek.filter(d => d !== idx));
                              }
                            }}
                            style={{ marginRight: '6px' }}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#666' }}>
                    Recurrence Ends
                  </label>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(e) => setRecurrenceEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>
                    Leave empty to repeat indefinitely
                  </div>
                </div>

                {formatRecurrencePreview() && (
                  <div style={{
                    padding: '8px',
                    background: '#e3f2fd',
                    border: '1px solid #90caf9',
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#1565c0',
                    fontWeight: '500'
                  }}>
                    {formatRecurrencePreview()}
                  </div>
                )}
              </>
            )}
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

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
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
            {loading ? 'Adding...' : 'Add Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddEvent;