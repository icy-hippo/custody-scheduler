import { getUpcomingDays } from '../utils/custodySchedule';

function VisualSchedule({ custodySchedule, events, calmMode }) {
  const { parent1Name, parent2Name } = custodySchedule || {};
  const days = getUpcomingDays(custodySchedule, events, 7).map((day, index) => {
    let label;
    if (index === 0) label = 'Today';
    else if (index === 1) label = 'Tomorrow';
    else label = day.date.toLocaleDateString('en-US', { weekday: 'short' });

    const dayNum = day.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const isParent1 = day.parent === parent1Name;
    const parentColor = day.parent ? (isParent1 ? '#667eea' : '#f093fb') : '#667eea';
    const parentBg = day.parent ? (isParent1 ? 'rgba(102, 126, 234, 0.12)' : 'rgba(240, 147, 251, 0.12)') : 'rgba(102, 126, 234, 0.08)';

    return {
      ...day,
      label,
      dayNum,
      parentColor,
      parentBg,
      houseLabel: day.parent ? (isParent1 ? 'Home 1' : 'Home 2') : null,
    };
  });

  return (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '20px',
      padding: calmMode ? '22px' : '28px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>
        My Week Ahead
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(104px, 1fr))',
        gap: '8px'
      }}>
        {days.map((day) => (
          <div
            key={day.dateKey}
            style={{
              background: day.isToday ? day.parentColor : day.parentBg,
              border: `2px solid ${day.parentColor}`,
              borderRadius: '14px',
              padding: '12px 8px',
              textAlign: 'center',
              color: day.isToday ? 'white' : '#333',
              transition: calmMode ? 'none' : 'transform 0.1s',
              cursor: 'default',
              minHeight: '132px'
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              opacity: day.isToday ? 0.9 : 0.7,
              marginBottom: '4px'
            }}>
              {day.label}
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              marginBottom: '8px',
              opacity: day.isToday ? 0.9 : 0.6
            }}>
              {day.dayNum}
            </div>

            {day.houseLabel && (
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                {day.houseLabel}
              </div>
            )}
            {day.parent && (
              <div style={{
                fontSize: '11px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: day.isToday ? 'white' : day.parentColor
              }}>
                {day.parent}
              </div>
            )}

            {day.events.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '2px',
                marginTop: '4px'
              }}>
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    title={event.title}
                    style={{
                      fontSize: '13px',
                      lineHeight: 1.2,
                      fontWeight: 'bold'
                    }}
                  >
                    {event.icon || event.category}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: day.isToday ? 'white' : day.parentColor
                  }}>
                    +{day.events.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {custodySchedule && (
        <div style={{
          display: 'flex',
          gap: '24px',
          marginTop: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <span style={{
              width: '12px', height: '12px', borderRadius: '3px',
              background: '#667eea', display: 'inline-block'
            }} />
            {parent1Name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <span style={{
              width: '12px', height: '12px', borderRadius: '3px',
              background: '#f093fb', display: 'inline-block'
            }} />
            {parent2Name}
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualSchedule;
