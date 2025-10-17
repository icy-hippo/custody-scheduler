import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

function CustodySetup({ onClose, onScheduleSet }) {
  const [pattern, setPattern] = useState('');
  const [startDate, setStartDate] = useState('');
  const [parent1Name, setParent1Name] = useState('Mom');
  const [parent2Name, setParent2Name] = useState('Dad');
  const [error, setError] = useState('');

  const patterns = [
    {
      id: 'alternating-weeks',
      name: 'Alternating Weeks',
      description: 'One week with each parent',
      icon: '📅'
    },
    {
      id: '2-2-3',
      name: '2-2-3 Schedule',
      description: '2 days, 2 days, 3 days rotating',
      icon: '🔄'
    },
    {
      id: 'weekday-weekend',
      name: 'Weekday/Weekend Split',
      description: 'Weekdays with one parent, weekends with other',
      icon: '📆'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pattern || !startDate) {
      setError('Please select a pattern and start date');
      return;
    }

    try {
      const user = auth.currentUser;
      
      const custodyData = {
        pattern,
        startDate,
        parent1Name,
        parent2Name,
        createdAt: new Date(),
        userId: user.uid
      };

      await setDoc(doc(db, 'custody', user.uid), custodyData);
      
      if (onScheduleSet) onScheduleSet();
      if (onClose) onClose();
      
      alert('Custody schedule set successfully!');
    } catch (err) {
      setError(err.message);
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
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Set Up Custody Schedule</h2>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                Parent 1 Name
              </label>
              <input
                type="text"
                value={parent1Name}
                onChange={(e) => setParent1Name(e.target.value)}
                placeholder="e.g., Mom, Dad, Parent A"
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
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                Parent 2 Name
              </label>
              <input
                type="text"
                value={parent2Name}
                onChange={(e) => setParent2Name(e.target.value)}
                placeholder="e.g., Mom, Dad, Parent B"
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: '#666', fontWeight: '500' }}>
              Custody Pattern *
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {patterns.map(p => (
                <div
                  key={p.id}
                  onClick={() => setPattern(p.id)}
                  style={{
                    padding: '16px',
                    border: pattern === p.id ? '3px solid #667eea' : '2px solid #ddd',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: pattern === p.id ? '#f0f4ff' : 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '32px' }}>{p.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', color: '#333', fontSize: '16px' }}>{p.name}</div>
                      <div style={{ color: '#666', fontSize: '14px', marginTop: '2px' }}>{p.description}</div>
                    </div>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid #667eea',
                      background: pattern === p.id ? '#667eea' : 'white'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              Start Date (Which parent has custody first?) *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
            <p style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Select a date when {parent1Name} has custody
            </p>
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
            style={{
              width: '100%',
              padding: '14px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Save Custody Schedule
          </button>
        </form>
      </div>
    </div>
  );
}

export default CustodySetup;