import { useState } from 'react';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

function FamilySetup({ onClose, onFamilyJoined }) {
  const [mode, setMode] = useState(''); // 'create' or 'join'
  const [familyCode, setFamilyCode] = useState('');
  const [familyName, setFamilyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Generate random 6-digit code
  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const createFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      const code = generateCode();
      
      // Create family document
      const familyData = {
        familyId: code,
        name: familyName,
        createdBy: user.uid,
        createdAt: new Date(),
        members: [user.uid]
      };

      await setDoc(doc(db, 'families', code), familyData);

      // Update user document with familyId
      await updateDoc(doc(db, 'users', user.uid), {
        familyId: code
      });

      setGeneratedCode(code);
      if (onFamilyJoined) onFamilyJoined(code);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const joinFamily = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;

      // Check if family exists
      const familyDoc = await getDoc(doc(db, 'families', familyCode));
      
      if (!familyDoc.exists()) {
        setError('Family code not found. Please check and try again.');
        setLoading(false);
        return;
      }

      const familyData = familyDoc.data();

      // Add user to family members
      if (!familyData.members.includes(user.uid)) {
        await updateDoc(doc(db, 'families', familyCode), {
          members: [...familyData.members, user.uid]
        });
      }

      // Update user document with familyId
      await updateDoc(doc(db, 'users', user.uid), {
        familyId: familyCode
      });

      alert('Successfully joined family!');
      if (onFamilyJoined) onFamilyJoined(familyCode);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>Family Setup</h2>
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
              Create a new family or join an existing one using a family code.
            </p>
            
            <button
              onClick={() => setMode('create')}
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
              👨‍👩‍👧 Create New Family
            </button>

            <button
              onClick={() => setMode('join')}
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
              🔗 Join Existing Family
            </button>
          </div>
        )}

        {mode === 'create' && !generatedCode && (
          <form onSubmit={createFamily}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                Family Name
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g., The Smith Family"
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

            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
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
              {loading ? 'Creating...' : 'Create Family'}
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
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>Family Created!</h3>
            <p style={{ color: '#666', marginBottom: '24px' }}>
              Share this code with family members so they can join:
            </p>
            <div style={{
              background: '#f0f4ff',
              border: '3px solid #667eea',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <div style={{ fontSize: '48px', fontWeight: 'bold', color: '#667eea', letterSpacing: '4px' }}>
                {generatedCode}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '24px' }}>
              Save this code! Family members will need it to join.
            </p>
            <button
              onClick={onClose}
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

        {mode === 'join' && (
          <form onSubmit={joinFamily}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
                Enter Family Code
              </label>
              <input
                type="text"
                value={familyCode}
                onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength="6"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '24px',
                  textAlign: 'center',
                  letterSpacing: '4px',
                  boxSizing: 'border-box',
                  fontWeight: 'bold'
                }}
              />
            </div>

            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
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
              {loading ? 'Joining...' : 'Join Family'}
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

export default FamilySetup;