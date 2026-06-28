import { useState } from 'react';

function ChildInvite({ familyId, onClose }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(familyId).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: 'white', borderRadius: '20px', padding: '32px',
        maxWidth: '400px', width: '100%', textAlign: 'center'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#999'
        }}>×</button>

        <div style={{ fontSize: '56px', marginBottom: '12px' }}>👧</div>
        <h2 style={{ margin: '0 0 8px 0', color: '#333' }}>Invite Your Child</h2>
        <p style={{ color: '#666', fontSize: '14px', margin: '0 0 24px 0' }}>
          Share this code with your child. They'll enter it in the app to see your family's schedule.
        </p>

        <div style={{
          background: '#f0f4ff', border: '3px solid #667eea',
          borderRadius: '16px', padding: '24px', marginBottom: '16px'
        }}>
          <div style={{ fontSize: '13px', color: '#667eea', fontWeight: '700', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Family Code
          </div>
          <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#333', letterSpacing: '4px' }}>
            {familyId}
          </div>
        </div>

        <button
          onClick={handleCopy}
          style={{
            width: '100%', padding: '14px',
            background: copied ? '#43e97b' : '#667eea',
            color: 'white', border: 'none', borderRadius: '12px',
            fontSize: '16px', fontWeight: 'bold', cursor: 'pointer',
            marginBottom: '12px', transition: 'background 0.2s'
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Code'}
        </button>

        <div style={{
          background: '#fff8e1', borderRadius: '12px', padding: '14px',
          fontSize: '13px', color: '#888', textAlign: 'left'
        }}>
          <strong style={{ color: '#555' }}>Instructions for your child:</strong>
          <ol style={{ margin: '8px 0 0 0', paddingLeft: '18px', lineHeight: '1.8' }}>
            <li>Open HarmonyHub and log in</li>
            <li>Go to the <strong>More</strong> tab</li>
            <li>Tap <strong>Join Family</strong></li>
            <li>Enter the code above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

export default ChildInvite;
