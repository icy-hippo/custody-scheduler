import { useState } from 'react';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';

function ParentLinking({ onClose, onParentLinked, familyId }) {
  const [mode, setMode] = useState(''); // 'invite' or 'accept'
  const [coParentEmail, setCoParentEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Generate a unique invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substr(2, 9).toUpperCase();
  };

  // Send invite to co-parent
  const sendInvite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      const code = generateInviteCode();

      // Create invite document
      await setDoc(doc(db, 'parentInvites', code), {
        invitedBy: user.uid,
        invitedEmail: coParentEmail,
        familyId: familyId || user.uid,
        createdAt: new Date(),
        status: 'pending',
        inviterName: user.email
      });

      setGeneratedCode(code);
      setCoParentEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept invite
  const acceptInvite = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;

      // Get the invite
      const inviteDoc = await getDoc(doc(db, 'parentInvites', inviteCode));

      if (!inviteDoc.exists()) {
        setError('Invite code not found. Please check and try again.');
        setLoading(false);
        return;
      }

      const inviteData = inviteDoc.data();

      // Verify email matches
      if (inviteData.invitedEmail !== user.email) {
        setError(
          `This invite was sent to ${inviteData.invitedEmail}, but you're logged in as ${user.email}. Please log in with the correct account.`
        );
        setLoading(false);
        return;
      }

      if (inviteData.status !== 'pending') {
        setError('This invite has already been used or is no longer valid.');
        setLoading(false);
        return;
      }

      // Link the parents together
      const familyId = inviteData.familyId;

      // Update current user
      await updateDoc(doc(db, 'users', user.uid), {
        linkedParentId: inviteData.invitedBy,
        familyId: familyId
      });

      // Update inviting parent
      await updateDoc(doc(db, 'users', inviteData.invitedBy), {
        linkedParentId: user.uid,
        familyId: familyId
      });

      // Mark invite as accepted
      await updateDoc(doc(db, 'parentInvites', inviteCode), {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedBy: user.uid
      });

      alert('Successfully linked with co-parent!');
      if (onParentLinked) onParentLinked(familyId);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '500px',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}
        >
          <h2 style={{ margin: 0, color: '#333' }}>Link Co-Parent</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#999'
            }}
          >
            ×
          </button>
        </div>

        {!mode && !generatedCode && (
          <div>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Link with your co-parent so you can both see and manage the same
              events and schedule.
            </p>

            <button
              onClick={() => setMode('invite')}
              style={{
                width: '100%',
                padding: '16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '12px'
              }}
            >
              📧 Send Invite to Co-Parent
            </button>

            <button
              onClick={() => setMode('accept')}
              style={{
                width: '100%',
                padding: '16px',
                background: 'white',
                color: '#667eea',
                border: '2px solid #667eea',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              🔗 Accept Invite Code
            </button>
          </div>
        )}

        {mode === 'invite' && !generatedCode && (
          <form onSubmit={sendInvite}>
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#666',
                  fontWeight: '500'
                }}
              >
                Co-Parent's Email Address
              </label>
              <input
                type="email"
                value={coParentEmail}
                onChange={(e) => setCoParentEmail(e.target.value)}
                placeholder="mom@example.com or dad@example.com"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <p style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>
              We'll generate an invite code that you can share with your
              co-parent. They'll need to use this code to link their account.
            </p>

            {error && (
              <div
                style={{
                  background: '#fee',
                  color: '#c33',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {loading ? 'Generating...' : 'Generate Invite Code'}
            </button>

            <button
              type="button"
              onClick={() => setMode('')}
              style={{
                width: '100%',
                padding: '10px',
                background: 'none',
                color: '#666',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </form>
        )}

        {generatedCode && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
              Invite Code Generated!
            </h3>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Share this code with your co-parent so they can link their
              account:
            </p>
            <div
              style={{
                background: '#f0f4ff',
                border: '3px solid #667eea',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '24px',
                position: 'relative'
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#667eea',
                  letterSpacing: '4px',
                  fontFamily: 'monospace'
                }}
              >
                {generatedCode}
              </div>
              <button
                onClick={copyToClipboard}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {copySuccess ? '✓ Copied!' : 'Copy Code'}
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>
              This code will expire in 7 days if not used.
            </p>
            <button
              onClick={() => {
                setGeneratedCode('');
                setMode('');
              }}
              style={{
                width: '100%',
                padding: '14px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Done
            </button>
          </div>
        )}

        {mode === 'accept' && (
          <form onSubmit={acceptInvite}>
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  color: '#666',
                  fontWeight: '500'
                }}
              >
                Enter Invite Code
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter 9-digit code"
                maxLength="9"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '20px',
                  textAlign: 'center',
                  letterSpacing: '2px',
                  boxSizing: 'border-box',
                  fontWeight: 'bold',
                  fontFamily: 'monospace'
                }}
              />
            </div>

            <p style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>
              Your co-parent should have received this code from you. Make sure
              you're logged in with the email address they sent the invite to.
            </p>

            {error && (
              <div
                style={{
                  background: '#fee',
                  color: '#c33',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#ccc' : '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px'
              }}
            >
              {loading ? 'Linking...' : 'Link Account'}
            </button>

            <button
              type="button"
              onClick={() => setMode('')}
              style={{
                width: '100%',
                padding: '10px',
                background: 'none',
                color: '#666',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Back
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ParentLinking;