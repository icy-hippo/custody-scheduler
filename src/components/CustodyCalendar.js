import { useState } from 'react';

function CustodyCalendar({ custodySchedule }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!custodySchedule) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        textAlign: 'center',
        color: '#666'
      }}>
        <p style={{ fontSize: '18px', margin: 0 }}>Set up a custody schedule to see the calendar</p>
      </div>
    );
  }

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

  // Color scheme for parents
  const parent1Color = '#ff6b9d';
  const parent2Color = '#4facfe';

  // Determine which parent has custody on a given date
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

  const getColorForDate = (date) => {
    const parent = getParentForDate(date);
    return parent === parent1Name ? parent1Color : parent2Color;
  };

  // Get all days in current month
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate calendar grid
  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear();

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '32px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 24px 0', color: '#333', fontSize: '28px' }}>
          📅 Custody Schedule
        </h2>

        {/* Month Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          padding: '16px',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <button
            onClick={goToPreviousMonth}
            style={{
              background: 'white',
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
            }}
          >
            ← Previous
          </button>

          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: 0, color: '#333', fontSize: '24px', fontWeight: 'bold' }}>
              {monthName}
            </h3>
          </div>

          <button
            onClick={goToNextMonth}
            style={{
              background: 'white',
              border: '2px solid #ddd',
              borderRadius: '8px',
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '14px'
            }}
          >
            Next →
          </button>
        </div>

        {isCurrentMonth && (
          <button
            onClick={goToToday}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '14px',
              marginBottom: '16px'
            }}
          >
            Today
          </button>
        )}

        {/* Legend */}
        <div style={{
          display: 'flex',
          gap: '24px',
          justifyContent: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: parent1Color,
              borderRadius: '6px'
            }} />
            <span style={{ color: '#333', fontWeight: '500' }}>{parent1Name}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: parent2Color,
              borderRadius: '6px'
            }} />
            <span style={{ color: '#333', fontWeight: '500' }}>{parent2Name}</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '8px'
      }}>
        {/* Week day headers */}
        {weekDays.map(day => (
          <div
            key={day}
            style={{
              textAlign: 'center',
              fontWeight: 'bold',
              color: '#666',
              padding: '12px 8px',
              fontSize: '14px',
              borderBottom: '2px solid #eee'
            }}
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                style={{
                  aspectRatio: '1',
                  background: '#f8f9fa',
                  borderRadius: '8px'
                }}
              />
            );
          }

          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
          const isToday = isCurrentMonth && day === today.getDate();
          const color = getColorForDate(date);
          const parent = getParentForDate(date);

          return (
            <div
              key={day}
              style={{
                aspectRatio: '1',
                background: `${color}15`,
                border: isToday ? `3px solid ${color}` : `2px solid ${color}`,
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s',
                padding: '4px',
                boxSizing: 'border-box',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div
                style={{
                  fontWeight: isToday ? 'bold' : '600',
                  color: color,
                  fontSize: isToday ? '18px' : '16px'
                }}
              >
                {day}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  color: color,
                  fontWeight: 'bold',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%'
                }}
              >
                {parent === parent1Name ? '👤 1' : '👤 2'}
              </div>
              {isToday && (
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '2px',
                    width: '8px',
                    height: '8px',
                    background: color,
                    borderRadius: '50%'
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Schedule Info */}
      <div style={{
        marginTop: '32px',
        padding: '24px',
        background: '#f8f9fa',
        borderRadius: '12px',
        borderLeft: `4px solid #667eea`
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: '#333' }}>Schedule Pattern</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>
              Pattern
            </div>
            <div style={{ color: '#333', fontWeight: 'bold', fontSize: '16px' }}>
              {pattern === 'alternating-weeks' && '📅 Alternating Weeks'}
              {pattern === '2-2-3' && '🔄 2-2-3 Schedule'}
              {pattern === 'weekday-weekend' && '📆 Weekday/Weekend Split'}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>
              Start Date
            </div>
            <div style={{ color: '#333', fontWeight: 'bold', fontSize: '16px' }}>
              {new Date(startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustodyCalendar;