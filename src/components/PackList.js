import { useState, useEffect } from 'react';

function PackList({ events, custodySchedule }) {
  const [checkedItems, setCheckedItems] = useState({});

  if (!custodySchedule) return null;

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

  // Calculate which parent has custody today
  const getCurrentParent = () => {
    const start = new Date(startDate);
    const today = new Date();
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const weekNumber = Math.floor(daysDiff / 7);
      return weekNumber % 2 === 0 ? parent1Name : parent2Name;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
      if (cycle < 2) return parent1Name;
      if (cycle < 4) return parent2Name;
      return parent1Name;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = today.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? parent2Name : parent1Name;
    }

    return parent1Name;
  };

  // Calculate days until next transition
  const getDaysUntilTransition = () => {
    const start = new Date(startDate);
    const today = new Date();
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const daysInCurrentWeek = daysDiff % 7;
      return 7 - daysInCurrentWeek;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
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

  // Only show pack list if transition is within 2 days
  if (daysUntil > 7) return null;

  // Get events happening in the next few days at the other parent's house
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

  // Generate pack list based on events
  const generatePackList = () => {
    const items = [
      { id: 'clothes', name: '👕 Clothes for the week', icon: '👕' },
      { id: 'phone-charger', name: '🔌 Phone charger', icon: '🔌' },
      { id: 'homework', name: '📚 Homework and school books', icon: '📚' },
      { id: 'toiletries', name: '🧴 Toiletries (toothbrush, etc.)', icon: '🧴' },
    ];

    // Add items based on upcoming events
    upcomingEvents.forEach(event => {
      if (event.category === 'Sports') {
        items.push({ 
          id: `sports-${event.id}`, 
          name: `⚽ Sports gear for ${event.title}`, 
          icon: '⚽',
          eventBased: true 
        });
      } else if (event.category === 'School') {
        items.push({ 
          id: `school-${event.id}`, 
          name: `📖 Materials for ${event.title}`, 
          icon: '📖',
          eventBased: true 
        });
      } else if (event.category === 'Medical') {
        items.push({ 
          id: `medical-${event.id}`, 
          name: `💊 Medications/medical supplies`, 
          icon: '💊',
          eventBased: true 
        });
      }
    });

    return items;
  };

  const packList = generatePackList();

  const toggleItem = (itemId) => {
    setCheckedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const totalCount = packList.length;

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      border: '4px solid #ffa500'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: '36px' }}>🎒</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
              Pack Your Bag!
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              {daysUntil === 1 
                ? `Going to ${nextParent}'s tomorrow` 
                : `Going to ${nextParent}'s in ${daysUntil} days`
              }
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ 
          background: '#f0f0f0', 
          borderRadius: '10px', 
          height: '12px',
          overflow: 'hidden',
          marginTop: '12px'
        }}>
          <div style={{
            background: 'linear-gradient(90deg, #ffa500, #ff6b35)',
            height: '100%',
            width: `${(checkedCount / totalCount) * 100}%`,
            transition: 'width 0.3s ease',
            borderRadius: '10px'
          }} />
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: '#888', 
          margin: '4px 0 0 0',
          textAlign: 'right'
        }}>
          {checkedCount} of {totalCount} packed
        </p>
      </div>

      {/* Pack list items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {packList.map(item => (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            style={{
              padding: '16px',
              background: checkedItems[item.id] ? '#f0f9f0' : '#fef9f3',
              border: checkedItems[item.id] ? '2px solid #4caf50' : '2px solid #ffa500',
              borderRadius: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              transition: 'all 0.2s'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: checkedItems[item.id] ? '2px solid #4caf50' : '2px solid #ffa500',
              background: checkedItems[item.id] ? '#4caf50' : 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {checkedItems[item.id] && (
                <span style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>✓</span>
              )}
            </div>
            <div style={{ fontSize: '24px' }}>{item.icon}</div>
            <div style={{ 
              flex: 1,
              color: checkedItems[item.id] ? '#666' : '#333',
              textDecoration: checkedItems[item.id] ? 'line-through' : 'none',
              fontWeight: item.eventBased ? 'bold' : 'normal'
            }}>
              {item.name}
            </div>
          </div>
        ))}
      </div>

      {checkedCount === totalCount && (
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, #4caf50, #8bc34a)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          🎉 All packed! Great job!
        </div>
      )}
    </div>
  );
}

export default PackList;