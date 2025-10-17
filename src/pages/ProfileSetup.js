import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function ProfileSetup() {
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!role) {
      setError('Please select if you are a parent or child');
      return;
    }

    try {
      const user = auth.currentUser;
      
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        role: role,
        email: user.email,
        createdAt: new Date()
      });

      if (role === 'parent') {
        navigate('/parent-dashboard');
      } else {
        navigate('/child-dashboard');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '500px'
      }}>
        <h2 style={{ marginBottom: '16px', color: '#333', textAlign: 'center' }}>
          Welcome to HarmonyHub!
        </h2>
        <p style={{ marginBottom: '32px', color: '#666', textAlign: 'center' }}>
          Let's set up your profile
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666', fontWeight: '500' }}>
              What's your name?
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your name"
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '12px', color: '#666', fontWeight: '500' }}>
              I am a...
            </label>
            
            <div 
              onClick={() => setRole('parent')}
              style={{
                padding: '20px',
                border: role === 'parent' ? '3px solid #667eea' : '2px solid #ddd',
                borderRadius: '12px',
                marginBottom: '12px',
                cursor: 'pointer',
                background: role === 'parent' ? '#f0f4ff' : 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #667eea',
                  marginRight: '12px',
                  background: role === 'parent' ? '#667eea' : 'white'
                }} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '18px' }}>Parent</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>I want to coordinate schedules</div>
                </div>
              </div>
            </div>

            <div 
              onClick={() => setRole('child')}
              style={{
                padding: '20px',
                border: role === 'child' ? '3px solid #667eea' : '2px solid #ddd',
                borderRadius: '12px',
                cursor: 'pointer',
                background: role === 'child' ? '#f0f4ff' : 'white'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: '2px solid #667eea',
                  marginRight: '12px',
                  background: role === 'child' ? '#667eea' : 'white'
                }} />
                <div>
                  <div style={{ fontWeight: 'bold', color: '#333', fontSize: '18px' }}>Child</div>
                  <div style={{ color: '#666', fontSize: '14px' }}>I want to see my schedule</div>
                </div>
              </div>
            </div>
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
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfileSetup;