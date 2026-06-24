import { getCustodyStatus } from '../utils/custodySchedule';

function SocialStoryBuilder({ custodySchedule, calmMode, visualLabels }) {
  const status = getCustodyStatus(custodySchedule);
  const nextParent = status.nextParent || 'my other home';
  const defaultSteps = [
    { title: 'I check my plan', detail: 'I can look at my schedule before I leave.', picture: 'Schedule' },
    { title: 'I pack my comfort things', detail: 'My comfort item and sensory tools can come with me.', picture: 'Bag' },
    { title: `I go to ${nextParent}`, detail: 'A grown-up helps me get there.', picture: 'Home' },
    { title: 'Some things stay the same', detail: 'My routines and helpers are still part of my day.', picture: 'Routine' },
  ];

  const homeLabel = visualLabels?.find(label => label.type === 'Home' && nextParent.includes(label.label.split("'")[0]));

  return (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '20px',
      padding: calmMode ? '22px' : '28px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '24px' }}>My Transition Story</h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {defaultSteps.map((step, index) => (
          <div
            key={step.title}
            style={{
              display: 'grid',
              gridTemplateColumns: '72px 1fr',
              gap: '14px',
              alignItems: 'center',
              padding: '14px',
              border: '2px solid #d7dee2',
              borderRadius: '12px',
              background: calmMode ? '#f7f7f2' : '#fbfdff',
            }}
          >
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '12px',
              background: homeLabel?.color || '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              color: '#263238',
              fontWeight: 'bold',
              textAlign: 'center',
              fontSize: '12px',
            }}>
              {index === 2 && homeLabel?.imageData ? (
                <img src={homeLabel.imageData} alt={homeLabel.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                step.picture
              )}
            </div>
            <div>
              <div style={{ color: '#263238', fontWeight: 'bold', fontSize: '18px', marginBottom: '4px' }}>
                {index + 1}. {step.title}
              </div>
              <div style={{ color: '#607d8b', fontSize: '15px', lineHeight: 1.35 }}>{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SocialStoryBuilder;
