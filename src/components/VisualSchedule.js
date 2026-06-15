function VisualSchedule({ custodySchedule, events }) {
  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule || {};

  const getParentForDate = (date) => {
    if (!custodySchedule) return null;
    const start = new Date(startDate);
    const daysDiff = Math.floor((date - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const weekNumber = Math.floor(daysDiff / 7);
      return weekNumber % 2 === 0 ? parent1Name : parent2Name;
    } else if (pattern === '2-2-3') {
      const cycle = ((daysDiff % 7) + 7) % 7;
      if (cycle < 2) return parent1Name;
      if (cycle < 4) return parent2Name;
      return parent1Name;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = date.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? parent2Name : parent1Name;
    }
    return parent1Name;
  };

  const getEventsForDate = (dateStr) => {
    return (events || []).filter(e => e.date === dateStr);
  };

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const parent = getParentForDate(date);
    const dayEvents = getEventsForDate(dateStr);

    let label;
    if (i === 0) label = 'Today';
    else if (i === 1) label = 'Tomorrow';
    else label = date.toLocaleDateString('en-US', { weekday: 'short' });

    const dayNum = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const isToday = i === 0;

    const isParent1 = parent === parent1Name;
    const parentColor = parent ? (isParent1 ? '#667eea' : '#f093fb') : '#667eea';
    const parentBg = parent ? (isParent1 ? 'rgba(102, 126, 234, 0.12)' : 'rgba(240, 147, 251, 0.12)') : 'rgba(102, 126, 234, 0.08)';
    const houseIcon = parent ? (isParent1 ? '🏠' : '🏡') : null;

    days.push({ label, dayNum, parent, houseIcon, parentColor, parentBg, dayEvents, isToday });
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '28px',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginTop: 0, color: '#333', fontSize: '24px' }}>
        🗓️ My Week Ahead
      </h2>

      <div style={{
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '4px',
        WebkitOverflowScrolling: 'touch'
      }}>
        {days.map((day, idx) => (
          <div
            key={idx}
            style={{
              background: day.isToday ? day.parentColor : day.parentBg,
              border: `2px solid ${day.parentColor}`,
              borderRadius: '14px',
              padding: '12px 8px',
              textAlign: 'center',
              color: day.isToday ? 'white' : '#333',
              cursor: 'default',
              minWidth: '80px',
              flexShrink: 0
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

            {/* House icon showing which parent */}
            {day.houseIcon && (
              <div style={{ fontSize: '28px', marginBottom: '6px' }}>
                {day.houseIcon}
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

            {/* Event icons for this day */}
            {day.dayEvents.length > 0 && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '2px',
                marginTop: '4px'
              }}>
                {day.dayEvents.slice(0, 3).map((ev, ei) => (
                  <div
                    key={ei}
                    title={ev.title}
                    style={{
                      fontSize: '16px',
                      lineHeight: 1
                    }}
                  >
                    {ev.icon}
                  </div>
                ))}
                {day.dayEvents.length > 3 && (
                  <div style={{
                    fontSize: '10px',
                    fontWeight: 'bold',
                    color: day.isToday ? 'white' : day.parentColor
                  }}>
                    +{day.dayEvents.length - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      {custodySchedule && <div style={{
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
          🏠 {parent1Name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '3px',
            background: '#f093fb', display: 'inline-block'
          }} />
          🏡 {parent2Name}
        </div>
      </div>}
    </div>
  );
}

export default VisualSchedule;
