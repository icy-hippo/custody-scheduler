import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function PackList({ events, custodySchedule, familyId, userId }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [customItems, setCustomItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [adding, setAdding] = useState(false);

  const storageKey = familyId || userId || 'default';

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'packLists', storageKey));
        if (snap.exists()) setCustomItems(snap.data().items || []);
      } catch (e) {}
    };
    load();
  }, [storageKey]);

  if (!custodySchedule) return null;

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

  const getCurrentParent = () => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      return Math.floor(daysDiff / 7) % 2 === 0 ? parent1Name : parent2Name;
    } else if (pattern === '2-2-3') {
      const cycle = ((daysDiff % 7) + 7) % 7;
      if (cycle < 2) return parent1Name;
      if (cycle < 4) return parent2Name;
      return parent1Name;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = today.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? parent2Name : parent1Name;
    }
    return parent1Name;
  };

  const getDaysUntilTransition = () => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      return 7 - (daysDiff % 7);
    } else if (pattern === '2-2-3') {
      const cycle = ((daysDiff % 7) + 7) % 7;
      if (cycle < 2) return 2 - cycle;
      if (cycle < 4) return 4 - cycle;
      return 7 - cycle;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return dayOfWeek === 6 ? 1 : 5;
      }
      return 6 - dayOfWeek;
    }
    return 7;
  };

  const currentParent = getCurrentParent();
  const daysUntil = getDaysUntilTransition();
  const nextParent = currentParent === parent1Name ? parent2Name : parent1Name;

  if (daysUntil > 7) return null;

  const saveCustomItems = async (items) => {
    if (!storageKey) return;
    try {
      await setDoc(doc(db, 'packLists', storageKey), { items });
    } catch (e) {}
  };

  const getUpcomingEventsAtNextHouse = () => {
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= today && eventDate <= threeDaysFromNow;
    });
  };

  const upcomingEvents = getUpcomingEventsAtNextHouse();

  const generatePackList = () => {
    const items = [
      { id: 'clothes', name: 'Clothes for the week', icon: '👕' },
      { id: 'phone-charger', name: 'Phone charger', icon: '🔌' },
      { id: 'homework', name: 'Homework and school books', icon: '📚' },
      { id: 'toiletries', name: 'Toiletries (toothbrush, etc.)', icon: '🧴' },
    ];

    upcomingEvents.forEach(event => {
      if (event.category === 'Sports') {
        items.push({ id: `sports-${event.id}`, name: `Sports gear for ${event.title}`, icon: '⚽', eventBased: true });
      } else if (event.category === 'School') {
        items.push({ id: `school-${event.id}`, name: `Materials for ${event.title}`, icon: '📖', eventBased: true });
      } else if (event.category === 'Medical') {
        items.push({ id: `medical-${event.id}`, name: 'Medications/medical supplies', icon: '💊', eventBased: true });
      }
    });

    return items;
  };

  const defaultItems = generatePackList();
  const allItems = [...defaultItems, ...customItems];

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const addItem = async () => {
    const text = newItemText.trim();
    if (!text) return;
    const newItem = { id: `custom-${Date.now()}`, name: text, icon: '📦', custom: true };
    const updated = [...customItems, newItem];
    setCustomItems(updated);
    await saveCustomItems(updated);
    setNewItemText('');
    setAdding(false);
  };

  const removeItem = async (itemId) => {
    const updated = customItems.filter(i => i.id !== itemId);
    setCustomItems(updated);
    await saveCustomItems(updated);
    setCheckedItems(prev => { const next = { ...prev }; delete next[itemId]; return next; });
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = allItems.length;

  return (
    <div style={{
      background: 'white', borderRadius: '20px', padding: '24px',
      marginBottom: '24px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      border: '4px solid #ffa500'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <div style={{ fontSize: '36px' }}>🎒</div>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', color: '#333' }}>Pack Your Bag!</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            {daysUntil === 1 ? `Going to ${nextParent}'s tomorrow` : `Going to ${nextParent}'s in ${daysUntil} days`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#f0f0f0', borderRadius: '10px', height: '12px', overflow: 'hidden', margin: '12px 0 4px 0' }}>
        <div style={{
          background: 'linear-gradient(90deg, #ffa500, #ff6b35)',
          height: '100%', width: `${totalCount ? (checkedCount / totalCount) * 100 : 0}%`,
          transition: 'width 0.3s ease', borderRadius: '10px'
        }} />
      </div>
      <p style={{ fontSize: '12px', color: '#888', margin: '0 0 16px 0', textAlign: 'right' }}>
        {checkedCount} of {totalCount} packed
      </p>

      {/* Items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {allItems.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              onClick={() => toggleItem(item.id)}
              style={{
                flex: 1, padding: '14px', cursor: 'pointer',
                background: checkedItems[item.id] ? '#f0f9f0' : '#fef9f3',
                border: checkedItems[item.id] ? '2px solid #4caf50' : '2px solid #ffa500',
                borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{
                width: '22px', height: '22px', borderRadius: '6px', flexShrink: 0,
                border: checkedItems[item.id] ? '2px solid #4caf50' : '2px solid #ffa500',
                background: checkedItems[item.id] ? '#4caf50' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {checkedItems[item.id] && <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>}
              </div>
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <span style={{
                flex: 1, fontSize: '14px',
                color: checkedItems[item.id] ? '#666' : '#333',
                textDecoration: checkedItems[item.id] ? 'line-through' : 'none',
                fontWeight: item.eventBased ? 'bold' : 'normal'
              }}>{item.name}</span>
            </div>
            {item.custom && (
              <button
                onClick={() => removeItem(item.id)}
                style={{
                  background: 'none', border: '2px solid #ff4444', borderRadius: '8px',
                  color: '#ff4444', width: '32px', height: '32px', cursor: 'pointer',
                  fontSize: '16px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >×</button>
            )}
          </div>
        ))}
      </div>

      {/* Add item */}
      {adding ? (
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <input
            autoFocus
            value={newItemText}
            onChange={e => setNewItemText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addItem(); if (e.key === 'Escape') setAdding(false); }}
            placeholder="What do you need to pack?"
            style={{
              flex: 1, padding: '12px', border: '2px solid #ffa500', borderRadius: '10px',
              fontSize: '14px', outline: 'none'
            }}
          />
          <button onClick={addItem} style={{
            padding: '12px 16px', background: '#ffa500', color: 'white',
            border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px'
          }}>Add</button>
          <button onClick={() => setAdding(false)} style={{
            padding: '12px', background: '#f0f0f0', color: '#666',
            border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '14px'
          }}>Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            width: '100%', marginTop: '12px', padding: '12px',
            background: 'white', border: '2px dashed #ffa500',
            borderRadius: '12px', color: '#ffa500', fontWeight: 'bold',
            fontSize: '14px', cursor: 'pointer'
          }}
        >+ Add item</button>
      )}

      {checkedCount === totalCount && totalCount > 0 && (
        <div style={{
          marginTop: '16px', padding: '16px',
          background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
          borderRadius: '12px', textAlign: 'center', color: 'white',
          fontWeight: 'bold', fontSize: '18px'
        }}>
          🎉 All packed! Great job!
        </div>
      )}
    </div>
  );
}

export default PackList;
