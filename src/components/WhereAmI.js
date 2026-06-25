import { getCustodyStatus } from '../utils/custodySchedule';

function WhereAmI({ custodySchedule, calmMode }) {
  if (!custodySchedule) return null;

  const { parent1Name } = custodySchedule;
  const { currentParent, nextParent, daysUntilTransition } = getCustodyStatus(custodySchedule);
  const houseColor = currentParent === parent1Name ? '#ff6b9d' : '#4facfe';

  const transitionText = () => {
    if (!nextParent || daysUntilTransition === null) return 'Your next house change is not scheduled yet.';
    if (daysUntilTransition === 1) return `Moving to ${nextParent}'s tomorrow`;
    return `${daysUntilTransition} days until you go to ${nextParent}'s`;
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '20px',
      padding: calmMode ? '24px' : '32px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.15)',
      border: `4px solid ${houseColor}`
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: calmMode ? '44px' : '72px', marginBottom: '16px' }}>Home</div>
        <h2 style={{
          margin: '0 0 8px 0',
          color: '#333',
          fontSize: calmMode ? '24px' : '28px',
          fontWeight: 'bold'
        }}>
          You're at {currentParent}'s house today.
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
          {transitionText()}
        </div>
      </div>
    </div>
  );
}

export default WhereAmI;
