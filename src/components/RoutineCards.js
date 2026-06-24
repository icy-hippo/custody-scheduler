import { ROUTINE_CARDS } from '../utils/spectrumSupport';

function RoutineCards({ calmMode }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '20px',
      padding: calmMode ? '22px' : '28px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '24px' }}>My Routines</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
        {ROUTINE_CARDS.map(routine => (
          <div
            key={routine.id}
            style={{
              border: '2px solid #cfd8dc',
              borderRadius: '12px',
              padding: '16px',
              background: calmMode ? '#f7f7f2' : '#f9fbff',
              minHeight: '190px',
            }}
          >
            <div style={{ fontSize: calmMode ? '24px' : '30px', fontWeight: 'bold', marginBottom: '8px' }}>
              {routine.icon}
            </div>
            <div style={{ fontWeight: 'bold', color: '#263238', fontSize: '18px', marginBottom: '10px' }}>
              {routine.title}
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              {routine.steps.map((step, index) => (
                <div key={step} style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#455a64', fontSize: '14px' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#e0f2f1',
                    color: '#00695c',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }}>
                    {index + 1}
                  </span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RoutineCards;
