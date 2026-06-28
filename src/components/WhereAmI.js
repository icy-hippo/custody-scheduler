import { getParentForDate } from '../utils/custodySchedule';

function WhereAmI({ custodySchedule }) {
  if (!custodySchedule) return null;

  const { parent1Name, parent2Name } = custodySchedule;
  const currentParent = getParentForDate(custodySchedule, new Date());
  if (!currentParent) return null;

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
