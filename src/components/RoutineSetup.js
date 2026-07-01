import { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const ICON_OPTIONS = ['🛁', '🦷', '📚', '💊', '🧸', '🎮', '🍎', '😴'];

function RoutineSetup({ familyId, onClose }) {
  const [icon, setIcon] = useState('⭐');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'routines'), {
        familyId,
        icon,
        title: title.trim(),
        description: description.trim(),
        timeOfDay,
        createdBy: auth.currentUser?.uid || '',
        createdAt: new Date()
      });
      onClose();
    } catch (err) {
      setError('Failed to save routine: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
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
        maxWidth: '480px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>🏠 Add Routine</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999' }}>×</button>
        </div>

        {/* Icon Picker */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>Icon</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {ICON_OPTIONS.map(em => (
              <div
                key={em}
                onClick={() => setIcon(em)}
                style={{
                  fontSize: '28px',
                  padding: '8px',
                  borderRadius: '10px',
                  border: icon === em ? '3px solid #667eea' : '2px solid #ddd',
                  background: icon === em ? '#667eea15' : 'white',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {em}
              </div>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>Title *</label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g., Brush teeth"
            style={{
              width: '100%', padding: '12px', border: '1px solid #ddd',
              borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>Description</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Optional details..."
            style={{
              width: '100%', padding: '12px', border: '1px solid #ddd',
              borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Time of Day */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>Time of Day</label>
          <select
            value={timeOfDay}
            onChange={e => setTimeOfDay(e.target.value)}
            style={{
              width: '100%', padding: '12px', border: '1px solid #ddd',
              borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
            }}
          >
            <option value="morning">🌅 Morning</option>
            <option value="evening">🌙 Evening</option>
            <option value="anytime">⭐ Anytime</option>
          </select>
        </div>

        {error && (
          <div style={{ background: '#fee', color: '#c33', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1, padding: '14px',
              background: saving ? '#ccc' : '#667eea',
              color: 'white', border: 'none',
              borderRadius: '8px', fontSize: '16px',
              fontWeight: 'bold', cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Saving...' : 'Save Routine'}
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '14px',
              background: 'white', color: '#667eea',
              border: '2px solid #667eea',
              borderRadius: '8px', fontSize: '16px',
              fontWeight: 'bold', cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoutineSetup;
