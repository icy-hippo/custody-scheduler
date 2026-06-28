import { formatFriendlyDate } from '../utils/custodySchedule';
import { timestampToDate } from '../utils/spectrumSupport';

function ChangeExplanation({ events, currentTime, calmMode }) {
  const changedEvent = [...events]
    .filter(event => event.updatedAt || event.changeReason || event.whatChanged)
    .sort((a, b) => {
      const aDate = timestampToDate(a.updatedAt)?.getTime() || 0;
      const bDate = timestampToDate(b.updatedAt)?.getTime() || 0;
      return bDate - aDate;
    })[0];

  if (!changedEvent) return null;

  return (
    <div style={{
      background: calmMode ? '#fbfbf7' : '#fffaf0',
      border: '3px solid #d4a017',
      borderRadius: calmMode ? '12px' : '18px',
      padding: calmMode ? '20px' : '24px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '22px' }}>Plan Change</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
        <Info label="What changed" value={changedEvent.whatChanged || `${changedEvent.title} is now ${formatFriendlyDate(changedEvent.date, currentTime)}.`} />
        <Info label="Who changed it" value={changedEvent.changedByName || 'A grown-up'} />
        <Info label="What stays the same" value={changedEvent.whatStaysSame || 'Your grown-ups know the plan and your routine can continue.'} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ background: 'white', borderRadius: '10px', padding: '14px', border: '1px solid #eadca6' }}>
      <div style={{ color: '#8d6e63', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>{label}</div>
      <div style={{ color: '#263238', fontSize: '16px', lineHeight: 1.35 }}>{value}</div>
    </div>
  );
}

export default ChangeExplanation;
