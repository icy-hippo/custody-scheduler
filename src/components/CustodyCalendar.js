import { useState } from 'react';

function CustodyCalendar({ custodySchedule }) {
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const getParentForDate = (date) => {
    const start = new Date(startDate);
    const daysDiff = Math.floor((date - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const weekNumber = Math.floor(daysDiff / 7);
      return weekNumber % 2 === 0 ? parent1Name : parent2Name;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
      if (cycle < 2) return parent1Name;
      if (cycle < 4) return parent2Name;
      return parent1Name;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = date.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? parent2Name : parent1Name;
    }
    return parent1Name;
  };

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

          return (
            <div
              key={day}
              style={{
                aspectRatio: '1',
                background: isToday ? color : `${color}22`,
                border: `2px solid ${color}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box',
                position: 'relative'
              }}
            >
              <span style={{
                fontWeight: isToday ? 'bold' : '600',
                color: isToday ? 'white' : color,
                fontSize: '13px'
              }}>
                {day}
              </span>
            </div>
          );
        })}
      </div>

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
