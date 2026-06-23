import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const TIME_GROUPS = [
  { key: 'morning', label: 'Morning', emoji: '🌅', bg: '#fff9e6', border: '#ffd54f' },
  { key: 'evening', label: 'Evening', emoji: '🌙', bg: '#e8eaf6', border: '#7986cb' },
  { key: 'anytime', label: 'Anytime', emoji: '⭐', bg: '#e8f5e9', border: '#66bb6a' },
];

function RoutineCards({ familyId }) {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const q = query(collection(db, 'routines'), where('familyId', '==', familyId));
        const snap = await getDocs(q);
        setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Error loading routines:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [familyId]);

  if (loading) return null;

  if (routines.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        marginTop: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        textAlign: 'center',
        color: '#888'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🌟</div>
        <div style={{ fontSize: '15px' }}>No routines set up yet 🌟</div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '16px' }}>
      {TIME_GROUPS.map(group => {
        const items = routines.filter(r => r.timeOfDay === group.key);
        if (items.length === 0) return null;
        return (
          <div key={group.key} style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#555', marginBottom: '8px' }}>
              {group.emoji} {group.label}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map(routine => (
                <div key={routine.id} style={{
                  background: group.bg,
                  border: `2px solid ${group.border}`,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}>
                  <div style={{ fontSize: '28px', flexShrink: 0 }}>{routine.icon || '⭐'}</div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#333' }}>{routine.title}</div>
                    {routine.description && (
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '2px' }}>{routine.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RoutineCards;
