import { getUpcomingDays } from '../utils/custodySchedule';

function CustodyPatternPreview({ custodySchedule, calmMode }) {
  if (!custodySchedule) return null;

  const { parent1Name, parent2Name } = custodySchedule;
  const days = getUpcomingDays(custodySchedule, [], 14);

  return (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '16px',
      padding: calmMode ? '20px' : '24px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '24px' }}>Custody Pattern Preview</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))', gap: '8px' }}>
        {days.map((day, index) => {
          const isParent1 = day.parent === parent1Name;
          const color = isParent1 ? '#667eea' : '#2a9d8f';
          return (
            <div
              key={day.dateKey}
              style={{
                border: `2px solid ${color}`,
                background: index === 0 ? color : `${color}12`,
                color: index === 0 ? 'white' : '#263238',
                borderRadius: '10px',
                padding: '10px 6px',
                textAlign: 'center',
                minHeight: '96px',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', opacity: 0.8 }}>
                {index === 0 ? 'Today' : day.date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '12px', margin: '4px 0 8px 0' }}>
                {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>Home</div>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '4px' }}>{day.parent}</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '14px', color: '#555', fontSize: '13px' }}>
        <span>{parent1Name}: blue</span>
        <span>{parent2Name}: green</span>
      </div>
    </div>
  );
}

export default CustodyPatternPreview;
