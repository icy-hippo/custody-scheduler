import { useState } from 'react';
import { addDays, getCustodyStatus, parseLocalDate } from '../utils/custodySchedule';
import { SENSORY_PACKING_ITEMS } from '../utils/spectrumSupport';

function PackList({ events, custodySchedule, calmMode }) {
  const [checkedItems, setCheckedItems] = useState({});

  if (!custodySchedule) return null;

  const { nextParent, daysUntilTransition } = getCustodyStatus(custodySchedule);

  if (daysUntilTransition === null || daysUntilTransition > 7) return null;

  const getUpcomingEventsNearTransition = () => {
    const today = parseLocalDate(new Date());
    const transitionWindow = addDays(today, Math.min(daysUntilTransition + 2, 7));

    return events.filter(event => {
      const eventDate = parseLocalDate(event.date);
      return eventDate >= today && eventDate <= transitionWindow;
    });
  };

  const upcomingEvents = getUpcomingEventsNearTransition();

  const generatePackList = () => {
    const items = [
      { id: 'clothes', name: 'Clothes for the week', icon: 'Clothes' },
      { id: 'homework', name: 'Homework and school books', icon: 'School' },
      { id: 'toiletries', name: 'Toiletries and toothbrush', icon: 'Care' },
      ...SENSORY_PACKING_ITEMS,
    ];

    upcomingEvents.forEach(event => {
      if (event.category === 'Sports') {
        items.push({
          id: `sports-${event.id}`,
          name: `Sports gear for ${event.title}`,
          icon: 'Sports',
          eventBased: true
        });
      } else if (event.category === 'School') {
        items.push({
          id: `school-${event.id}`,
          name: `Materials for ${event.title}`,
          icon: 'School',
          eventBased: true
        });
      } else if (event.category === 'Medical') {
        items.push({
          id: `medical-${event.id}`,
          name: 'Medicine or medical supplies',
          icon: 'Medical',
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
      borderRadius: calmMode ? '12px' : '20px',
      padding: calmMode ? '24px' : '32px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.15)',
      border: '4px solid #ffa500'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ fontSize: calmMode ? '28px' : '36px', fontWeight: 'bold' }}>Bag</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#333' }}>
              Pack Your Bag
            </h2>
            <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
              {daysUntilTransition === 1
                ? `Going to ${nextParent}'s tomorrow`
                : `Going to ${nextParent}'s in ${daysUntilTransition} days`}
            </p>
          </div>
        </div>

        <div style={{
          background: '#f0f0f0',
          borderRadius: '10px',
          height: '12px',
          overflow: 'hidden',
          marginTop: '12px'
        }}>
          <div style={{
            background: '#2a9d8f',
            height: '100%',
            width: `${(checkedCount / totalCount) * 100}%`,
            transition: calmMode ? 'none' : 'width 0.3s ease',
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
              transition: calmMode ? 'none' : 'all 0.2s'
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
              flexShrink: 0,
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {checkedItems[item.id] && 'ok'}
            </div>
            <div style={{
              minWidth: '68px',
              fontSize: '12px',
              fontWeight: 'bold',
              color: '#666',
              textTransform: 'uppercase'
            }}>
              {item.icon}
            </div>
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
          background: '#2a9d8f',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          All packed. Great job.
        </div>
      )}
    </div>
  );
}

export default PackList;
