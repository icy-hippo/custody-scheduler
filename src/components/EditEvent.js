import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

function EditEvent({ event, onClose, onEventUpdated }) {
  const [title, setTitle] = useState(event.title);
  const [date, setDate] = useState(event.date);
  const [time, setTime] = useState(event.time || '');
  const [location, setLocation] = useState(event.location || '');
  const [notes, setNotes] = useState(event.notes || '');
  const [category, setCategory] = useState(event.category);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { name: 'School', color: '#667eea', icon: '📚' },
    { name: 'Sports', color: '#f093fb', icon: '⚽' },
    { name: 'Medical', color: '#4facfe', icon: '🏥' },
    { name: 'Activities', color: '#43e97b', icon: '🎨' },
    { name: 'Family', color: '#fa709a', icon: '👨‍👩‍👧' },
    { name: 'Other', color: '#a8edea', icon: '📌' }
  ];

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
      const selectedCategory = categories.find(c => c.name === category);

      const eventData = {
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

      await updateDoc(doc(db, 'events', event.id), eventData);
      
      if (onEventUpdated) onEventUpdated();
      if (onClose) onClose();
      
      alert('Event updated successfully!');
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
            {loading ? 'Updating...' : 'Update Event'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditEvent;