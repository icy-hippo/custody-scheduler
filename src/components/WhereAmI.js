function WhereAmI({ custodySchedule }) {
  if (!custodySchedule) return null;

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

  let currentParent;
  if (pattern === 'alternating-weeks') {
    currentParent = Math.floor(daysDiff / 7) % 2 === 0 ? parent1Name : parent2Name;
  } else if (pattern === '2-2-3') {
    const cycle = ((daysDiff % 7) + 7) % 7;
    currentParent = cycle < 2 ? parent1Name : cycle < 4 ? parent2Name : parent1Name;
  } else if (pattern === 'weekday-weekend') {
    const dow = today.getDay();
    currentParent = (dow === 0 || dow === 6) ? parent2Name : parent1Name;
  } else {
    currentParent = parent1Name;
  }

  const isParent1 = currentParent === parent1Name;
  const houseColor = isParent1 ? '#ff6b9d' : '#4facfe';
  const houseEmoji = isParent1 ? '🏠' : '🏡';

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '20px 24px',
      marginBottom: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      border: `3px solid ${houseColor}`,
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{ fontSize: '48px' }}>{houseEmoji}</div>
      <div>
        <div style={{ fontSize: '13px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          You are here today
        </div>
        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginTop: '2px' }}>
          {currentParent}'s house
        </div>
      </div>
    </div>
  );
}

export default WhereAmI;
