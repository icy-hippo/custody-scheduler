import { DEFAULT_VISUAL_LABELS } from '../utils/spectrumSupport';

function VisualLabelGrid({ labels, calmMode }) {
  const displayLabels = labels?.length ? labels : DEFAULT_VISUAL_LABELS;

  return (
    <div style={{
      background: 'white',
      borderRadius: calmMode ? '12px' : '20px',
      padding: calmMode ? '22px' : '28px',
      marginBottom: '24px',
      boxShadow: calmMode ? 'none' : '0 8px 24px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '24px' }}>Picture Labels</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
        {displayLabels.map(label => (
          <div
            key={label.id}
            style={{
              border: '2px solid #d7dee2',
              borderRadius: '12px',
              padding: '10px',
              background: calmMode ? '#f7f7f2' : '#fbfdff',
              textAlign: 'center',
              minHeight: '130px',
            }}
          >
            <div style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '10px',
              background: label.color || '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              color: '#263238',
              fontWeight: 'bold',
              fontSize: '13px',
              marginBottom: '8px',
            }}>
              {label.imageData ? (
                <img src={label.imageData} alt={label.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                label.symbol || label.type
              )}
            </div>
            <div style={{ color: '#263238', fontWeight: 'bold', fontSize: '14px' }}>{label.label}</div>
            <div style={{ color: '#607d8b', fontSize: '12px', marginTop: '2px' }}>{label.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VisualLabelGrid;
