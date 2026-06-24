import {
  formatFriendlyDate,
  formatFriendlyTime,
  getCustodyStatus,
  getNextEvent,
  getUpcomingDays,
} from '../utils/custodySchedule';

function NowNextLaterHome({ custodySchedule, events, currentTime, calmMode }) {
  const status = getCustodyStatus(custodySchedule, currentTime);
  const nextEvent = getNextEvent(events, currentTime);
  const laterDay = getUpcomingDays(custodySchedule, events, 7, currentTime)
    .find(day => !day.isToday && (day.events.length > 0 || day.parent !== status.currentParent));

  const leaveTime = custodySchedule?.transitionTime || '4:30 PM';
  const sleeps = status.daysUntilTransition;
  const transitionLine = (() => {
    if (!custodySchedule || !status.nextParent) return 'A grown-up can add your house plan.';
    if (sleeps === 0) return `Today you go to ${status.nextParent}'s house.`;
    if (sleeps === 1) return `1 sleep until ${status.nextParent}'s house. Pack today.`;
    return `${sleeps} sleeps until ${status.nextParent}'s house. Pack tomorrow.`;
  })();

  const choices = [
    {
      label: 'Now',
      eyebrow: 'Current home',
      title: status.currentParent ? `${status.currentParent}'s house` : 'Home plan',
      detail: transitionLine,
      color: '#5b8def',
    },
    {
      label: 'Next',
      eyebrow: nextEvent?.category || 'Next plan',
      title: nextEvent ? nextEvent.title : 'Nothing next',
      detail: nextEvent
        ? `${formatFriendlyDate(nextEvent.date, currentTime)}${nextEvent.time ? ` at ${formatFriendlyTime(nextEvent.time)}` : ''}`
        : 'Your schedule is clear right now.',
      color: '#2a9d8f',
    },
    {
      label: 'Later',
      eyebrow: 'Coming later',
      title: laterDay ? (laterDay.parent ? `${laterDay.parent}'s house` : 'Later plan') : 'Same plan',
      detail: laterDay
        ? `${formatFriendlyDate(laterDay.date, currentTime)}${laterDay.events[0] ? `: ${laterDay.events[0].title}` : `, leave at ${leaveTime}`}`
        : 'No changes are coming up this week.',
      color: '#8d6e63',
    },
  ];

  return (
    <div style={{
      background: calmMode ? '#fbfbf7' : 'white',
      borderRadius: calmMode ? '12px' : '18px',
      padding: calmMode ? '18px' : '24px',
      marginBottom: '20px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(38,50,56,0.08)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        {choices.map(choice => (
          <div
            key={choice.label}
            style={{
              border: `2px solid ${choice.color}`,
              background: calmMode ? '#f4f5ef' : `${choice.color}12`,
              borderRadius: '12px',
              padding: '18px',
              minHeight: '132px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ color: choice.color, fontWeight: 'bold', fontSize: '15px' }}>
                  {choice.label}
                </div>
                <div style={{
                  color: choice.color,
                  background: calmMode ? '#fff' : 'rgba(255,255,255,0.72)',
                  border: `1px solid ${choice.color}`,
                  borderRadius: '999px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                }}>
                  {choice.eyebrow}
                </div>
              </div>
              <div style={{ color: '#263238', fontSize: calmMode ? '22px' : '26px', fontWeight: '800', lineHeight: 1.1 }}>
                {choice.title}
              </div>
              <div style={{ color: '#546e7a', fontSize: '16px', marginTop: '10px', lineHeight: 1.35 }}>
                {choice.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NowNextLaterHome;
