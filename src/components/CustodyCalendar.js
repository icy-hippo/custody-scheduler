import { useState } from 'react';
import { getParentForDate as getParentUtil } from '../utils/custodySchedule';

function CustodyCalendar({ custodySchedule, events = [] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(today);

  if (!custodySchedule) {
    return (
      <div style={{ background: 'white', borderRadius: '16px', padding: '24px', textAlign: 'center', color: '#666' }}>
        <p style={{ fontSize: '16px', margin: 0 }}>Set up a custody schedule to see the calendar</p>
      </div>
    );
  }

  const { parent1Name, parent2Name } = custodySchedule;
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

  const calendarDays = (() => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  })();

  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Selected day details
  const selDateStr = selectedDate.toISOString().split('T')[0];
  const selParent = getParentForDate(selectedDate);
  const selColor = selParent === parent1Name ? parent1Color : parent2Color;
  const selEvents = events.filter(e => e.date === selDateStr);
  const selLabel = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const isSelToday = selectedDate.getTime() === today.getTime();

  return (
    <div style={{ background: 'white', borderRadius: '16px', padding: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>

      {/* Month navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <button onClick={goToPreviousMonth} style={navBtnStyle}>‹</button>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>{monthName}</div>
          {!isCurrentMonth && (
            <button
              onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date(today)); }}
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
          if (day === null) return <div key={`empty-${index}`} style={{ aspectRatio: '1' }} />;

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const dateStr = date.toISOString().split('T')[0];
          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = dateStr === selDateStr;
          const parent = getParentForDate(date);
          const color = parent === parent1Name ? parent1Color : parent2Color;
          const dayEvents = events.filter(e => e.date === dateStr);

          return (
            <div
              key={day}
              onClick={() => setSelectedDate(new Date(date))}
              style={{
                aspectRatio: '1',
                background: isToday ? color : isSelected ? `${color}44` : `${color}22`,
                border: `2px solid ${isSelected || isToday ? color : `${color}66`}`,
                borderRadius: '8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', boxSizing: 'border-box',
                gap: '2px', cursor: 'pointer',
                outline: isSelected && !isToday ? `2px solid ${color}` : 'none',
                outlineOffset: '1px',
              }}
            >
              <span style={{
                fontWeight: isToday || isSelected ? 'bold' : '600',
                color: isToday ? 'white' : color,
                fontSize: '13px'
              }}>
                {day}
              </span>
              {dayEvents.length > 0 && (
                <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
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

      {/* Selected day panel */}
      <div style={{
        marginTop: '16px', borderRadius: '12px', overflow: 'hidden',
        border: `2px solid ${selColor}33`
      }}>
        <div style={{
          background: selColor, padding: '10px 14px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <div>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>
              {isSelToday ? 'Today — ' : ''}{selLabel}
            </div>
            {selParent && (
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', marginTop: '2px' }}>
                🏠 {selParent}'s house
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '12px 14px', background: `${selColor}08` }}>
          {selEvents.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: '13px' }}>No events this day</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selEvents.map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{ev.icon}</span>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>{ev.title}</div>
                    {ev.time && <div style={{ fontSize: '12px', color: '#888' }}>🕐 {ev.time}</div>}
                    {ev.location && <div style={{ fontSize: '12px', color: '#888' }}>📍 {ev.location}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: '#f0f0f0', border: 'none', borderRadius: '8px',
  width: '36px', height: '36px', fontSize: '20px', cursor: 'pointer',
  color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
};

export default CustodyCalendar;
