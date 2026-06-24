import {
  formatFriendlyDate,
  formatFriendlyTime,
  getCustodyStatus,
  getNextEvent,
} from '../utils/custodySchedule';

function TransitionPreview({ custodySchedule, events, currentTime, calmMode }) {
  const status = getCustodyStatus(custodySchedule, currentTime);
  const nextEvent = getNextEvent(events, currentTime);
  const transitionSoon =
    typeof status.daysUntilTransition === 'number' && status.daysUntilTransition <= 2;

  const cardBackground = calmMode ? '#fbfbf7' : 'white';
  const borderColor = transitionSoon ? '#f4a261' : '#5b8def';
  const textColor = '#263238';
  const mutedColor = '#607d8b';
  const panelBackground = calmMode ? '#f3f4ed' : '#eef5ff';

  const transitionText = () => {
    if (!custodySchedule) return 'A grown-up can add your house schedule here.';
    if (!status.nextParent) return 'Your house plan is set.';
    if (status.daysUntilTransition === 0) return `You go to ${status.nextParent}'s house today.`;
    if (status.daysUntilTransition === 1) return `Tomorrow you go to ${status.nextParent}'s house.`;
    return `In ${status.daysUntilTransition} days, you go to ${status.nextParent}'s house.`;
  };

  const nextEventText = () => {
    if (!nextEvent) return 'There is nothing else on the schedule right now.';
    const when = `${formatFriendlyDate(nextEvent.date, currentTime)}${
      nextEvent.time ? ` at ${formatFriendlyTime(nextEvent.time)}` : ''
    }`;
    return `${nextEvent.title} is ${when}.`;
  };

  const anchorSteps = [
    'Your grown-ups know the plan.',
    'Your comfort items can come with you.',
    'You can ask to see this screen again.',
  ];

  return (
    <div
      style={{
        background: cardBackground,
        borderRadius: calmMode ? '12px' : '20px',
        padding: calmMode ? '24px' : '32px',
        marginBottom: '24px',
        boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.12)',
        border: `4px solid ${borderColor}`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            background: panelBackground,
            borderRadius: '12px',
            padding: '20px',
            minHeight: '150px',
          }}
        >
          <div style={{ fontSize: calmMode ? '14px' : '16px', color: mutedColor, fontWeight: 'bold' }}>
            Now
          </div>
          <div style={{ fontSize: calmMode ? '36px' : '52px', margin: '10px 0' }}>Home</div>
          <div style={{ color: textColor, fontSize: calmMode ? '20px' : '24px', fontWeight: 'bold' }}>
            {status.currentParent ? `${status.currentParent}'s house` : 'Schedule not set'}
          </div>
        </div>

        <div
          style={{
            background: panelBackground,
            borderRadius: '12px',
            padding: '20px',
            minHeight: '150px',
          }}
        >
          <div style={{ fontSize: calmMode ? '14px' : '16px', color: mutedColor, fontWeight: 'bold' }}>
            Next
          </div>
          <div style={{ fontSize: calmMode ? '36px' : '52px', margin: '10px 0' }}>
            {nextEvent?.icon || 'Plan'}
          </div>
          <div style={{ color: textColor, fontSize: calmMode ? '18px' : '22px', fontWeight: 'bold' }}>
            {nextEventText()}
          </div>
        </div>

        <div
          style={{
            background: transitionSoon ? '#fff5e6' : panelBackground,
            borderRadius: '12px',
            padding: '20px',
            minHeight: '150px',
          }}
        >
          <div style={{ fontSize: calmMode ? '14px' : '16px', color: mutedColor, fontWeight: 'bold' }}>
            Transition
          </div>
          <div style={{ fontSize: calmMode ? '36px' : '52px', margin: '10px 0' }}>Bag</div>
          <div style={{ color: textColor, fontSize: calmMode ? '18px' : '22px', fontWeight: 'bold' }}>
            {transitionText()}
          </div>
        </div>
      </div>

      {transitionSoon && (
        <div
          style={{
            marginTop: '18px',
            padding: '18px',
            background: calmMode ? '#f7f1e7' : '#fff7ed',
            borderRadius: '12px',
            border: '2px solid #f4a261',
          }}
        >
          <div style={{ color: textColor, fontWeight: 'bold', marginBottom: '10px', fontSize: '18px' }}>
            What stays the same
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            {anchorSteps.map(step => (
              <div
                key={step}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  color: textColor,
                  fontSize: '16px',
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#2a9d8f',
                    color: 'white',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}
                >
                  ok
                </span>
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default TransitionPreview;
