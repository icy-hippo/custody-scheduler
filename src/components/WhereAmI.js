function WhereAmI({ custodySchedule }) {
  if (!custodySchedule) return null;

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;

  const getCurrentParent = () => {
    const start = new Date(startDate);
    const today = new Date();
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const weekNumber = Math.floor(daysDiff / 7);
      return weekNumber % 2 === 0 ? parent1Name : parent2Name;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
      if (cycle < 2) return parent1Name;
      if (cycle < 4) return parent2Name;
      return parent1Name;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = today.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? parent2Name : parent1Name;
    }

    return parent1Name;
  };

  const getDaysUntilTransition = () => {
    const start = new Date(startDate);
    const today = new Date();
    const daysDiff = Math.floor((today - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const daysInCurrentWeek = daysDiff % 7;
      return 7 - daysInCurrentWeek;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
      if (cycle < 2) return 2 - cycle;
      if (cycle < 4) return 4 - cycle;
      return 7 - cycle;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = today.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        return dayOfWeek === 6 ? 1 : 5;
      }
      return 6 - dayOfWeek;
    }

    return 7;
  };

  const currentParent = getCurrentParent();
  const daysUntil = getDaysUntilTransition();
  const nextParent = currentParent === parent1Name ? parent2Name : parent1Name;

  const houseColor = currentParent === parent1Name ? '#ff6b9d' : '#4facfe';

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '32px',
      marginBottom: '24px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      border: `4px solid ${houseColor}`
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '80px', marginBottom: '16px' }}>🏠</div>
        <h2 style={{ 
          margin: '0 0 8px 0', 
          color: '#333', 
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          You're at {currentParent}'s house today!
        </h2>
        <div style={{
          background: `${houseColor}20`,
          color: houseColor,
          padding: '12px 24px',
          borderRadius: '20px',
          display: 'inline-block',
          fontWeight: 'bold',
          fontSize: '18px',
          marginTop: '8px'
        }}>
          {daysUntil === 1 
            ? `Moving to ${nextParent}'s tomorrow` 
            : `${daysUntil} days until you go to ${nextParent}'s`
          }
        </div>
      </div>
    </div>
  );
}

export default WhereAmI;