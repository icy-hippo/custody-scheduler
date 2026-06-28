import { getParentForDate as getParentUtil } from '../utils/custodySchedule';

function VisualSchedule({ custodySchedule, events }) {
  const { parent1Name, parent2Name } = custodySchedule || {};

  const getParentForDate = (date) => getParentUtil(custodySchedule, date);

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
      <h2 style={{ margin: '0 0 4px 0', color: '#333', fontSize: '22px' }}>🗓️ My Week Ahead</h2>

      {days.map((day, idx) => (
        <div
          key={idx}
          style={{
            background: day.isToday ? day.parentColor : 'white',
            border: `2px solid ${day.parentColor}`,
            borderRadius: '16px',
            padding: '16px',
            color: day.isToday ? 'white' : '#333',
            boxShadow: day.isToday ? `0 4px 16px ${day.parentColor}55` : '0 2px 8px rgba(0,0,0,0.06)'
          }}
        >
          {/* Row 1: day label + date + house */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: day.dayEvents.length > 0 ? '10px' : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{
                  fontSize: '16px', fontWeight: 'bold',
                  color: day.isToday ? 'white' : '#333'
                }}>
                  {day.label}
                </div>
                <div style={{
                  fontSize: '13px',
                  opacity: day.isToday ? 0.85 : 0.55,
                  marginTop: '1px'
                }}>
                  {day.dayNum}
                </div>
              </div>
            </div>

            {day.parent && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '22px' }}>{day.houseIcon}</span>
                <span style={{
                  fontSize: '13px', fontWeight: 'bold',
                  color: day.isToday ? 'white' : day.parentColor
                }}>
                  {day.parent}'s
                </span>
              </div>
            )}
          </div>

          {/* Row 2: events for this day */}
          {day.dayEvents.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {day.dayEvents.slice(0, 3).map((ev, ei) => (
                <div key={ei} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: day.isToday ? 'rgba(255,255,255,0.2)' : `${ev.color}18`,
                  border: day.isToday ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${ev.color}55`,
                  borderRadius: '10px', padding: '8px 10px'
                }}>
                  <span style={{ fontSize: '18px' }}>{ev.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: day.isToday ? 'white' : '#333' }}>
                      {ev.title}
                    </div>
                    {ev.time && (
                      <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '1px', color: day.isToday ? 'white' : '#666' }}>
                        {ev.time}{ev.location ? ` • ${ev.location}` : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {day.dayEvents.length > 3 && (
                <div style={{
                  fontSize: '12px', fontWeight: 'bold', textAlign: 'center',
                  color: day.isToday ? 'white' : day.parentColor, opacity: 0.8
                }}>
                  +{day.dayEvents.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Legend */}
      {custodySchedule && (
        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#667eea', display: 'inline-block' }} />
            🏠 {parent1Name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#666' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f093fb', display: 'inline-block' }} />
            🏡 {parent2Name}
          </div>
        </div>
      )}
    </div>
  );
}

export default VisualSchedule;
