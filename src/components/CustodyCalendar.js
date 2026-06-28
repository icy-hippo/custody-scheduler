import { useState } from 'react';
import { getParentForDate as getParentUtil } from '../utils/custodySchedule';

function CustodyCalendar({ custodySchedule, events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });

  if (!custodySchedule) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        textAlign: 'center',
        color: '#666'
      }}>
        <p style={{ fontSize: '16px', margin: 0 }}>Set up a custody schedule to see the calendar</p>
      </div>
    );
  }

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

  const parent1Color = '#ff6b9d';
  const parent2Color = '#4facfe';

  const getParentForDate = (date) => getParentUtil(custodySchedule, date);

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));

  const goToNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={goToPreviousMonth} style={navBtnStyle}>‹</button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{monthName}</div>
          {isCurrentMonth && (
            <button
              onClick={() => setCurrentDate(new Date())}
              style={{ background: 'none', border: 'none', color: '#667eea', fontSize: '12px', cursor: 'pointer', padding: '2px 0', fontWeight: '600' }}
            >
              Today
            </button>
          )}
        </div>
        <button onClick={goToNextMonth} style={navBtnStyle}>›</button>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555' }}>
          <div style={{ width: '12px', height: '12px', background: parent1Color, borderRadius: '3px' }} />
          {parent1Name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#555' }}>
          <div style={{ width: '12px', height: '12px', background: parent2Color, borderRadius: '3px' }} />
          {parent2Name}
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '3px' }}>
        {weekDays.map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontWeight: '700', color: '#999', fontSize: '11px', paddingBottom: '6px' }}>
            {d}
          </div>
        ))}

        {calendarDays.map((day, index) => {
          if (day === null) {
            return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const isToday = isCurrentMonth && day === today.getDate();
          const parent = getParentForDate(date);
          const color = parent === parent1Name ? parent1Color : parent2Color;
          const dateStr = date.toISOString().split('T')[0];
          const dayEvents = events.filter(e => e.date === dateStr);

          return (
            <div
              key={day}
              style={{
                aspectRatio: '1',
                background: isToday ? color : `${color}22`,
                border: `2px solid ${color}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                position: 'relative',
                gap: '2px',
                cursor: dayEvents.length > 0 ? 'pointer' : 'default'
              }}
              onClick={(e) => {
                if (dayEvents.length === 0) return;
                if (selectedDayEvents && selectedDayEvents.dateStr === dateStr) {
                  setSelectedDayEvents(null);
                  return;
                }
                const rect = e.currentTarget.getBoundingClientRect();
                setPopupPos({ x: rect.left, y: rect.bottom + 6 });
                setSelectedDayEvents({ dateStr, events: dayEvents });
              }}
            >
              <span style={{
                fontWeight: isToday ? 'bold' : '600',
                color: isToday ? 'white' : color,
                fontSize: '13px'
              }}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {dayEvents.slice(0, 3).map((ev, i) => (
                    <div key={i} style={{
                      width: '5px', height: '5px', borderRadius: '50%',
                      background: isToday ? 'white' : ev.color || '#333'
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event popup */}
      {selectedDayEvents && (
        <>
          <div
            onClick={() => setSelectedDayEvents(null)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 }}
          />
          <div style={{
            position: 'fixed',
            top: Math.min(popupPos.y, window.innerHeight - 200),
            left: Math.max(8, Math.min(popupPos.x, window.innerWidth - 220)),
            width: '210px',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 201,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '10px 12px 6px 12px', borderBottom: '1px solid #eee', fontSize: '12px', fontWeight: '700', color: '#666' }}>
              {new Date(selectedDayEvents.dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
            {selectedDayEvents.events.map((ev, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 12px',
                borderBottom: i < selectedDayEvents.events.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <span style={{ fontSize: '18px' }}>{ev.icon}</span>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '13px', color: '#333' }}>{ev.title}</div>
                  {ev.time && <div style={{ fontSize: '11px', color: '#888' }}>{ev.time}</div>}
                  {ev.location && <div style={{ fontSize: '11px', color: '#888' }}>📍 {ev.location}</div>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Schedule info */}
      <div style={{ marginTop: '16px', padding: '12px', background: '#f8f9fa', borderRadius: '10px', borderLeft: '3px solid #667eea' }}>
        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Pattern</div>
        <div style={{ color: '#333', fontWeight: 'bold', fontSize: '14px' }}>
          {pattern === 'alternating-weeks' && '📅 Alternating Weeks'}
          {pattern === '2-2-3' && '🔄 2-2-3 Schedule'}
          {pattern === 'weekday-weekend' && '📆 Weekday/Weekend Split'}
        </div>
        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', fontWeight: 'bold', marginTop: '8px', marginBottom: '4px' }}>Start Date</div>
        <div style={{ color: '#333', fontWeight: 'bold', fontSize: '14px' }}>
          {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: '#f0f0f0',
  border: 'none',
  borderRadius: '8px',
  width: '36px',
  height: '36px',
  fontSize: '20px',
  cursor: 'pointer',
  color: '#333',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 'bold'
};

export default CustodyCalendar;
