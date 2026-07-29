import { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters!');
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(user);
      setVerificationSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown) return;
    try {
      await sendEmailVerification(auth.currentUser);
      setResendCooldown(true);
      setTimeout(() => setResendCooldown(false), 30000);
    } catch (err) {
      setError(err.message);
    }
  };

  if (verificationSent) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
      }}>
        <div style={{
          background: 'white', padding: '40px', borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)', width: '100%',
          maxWidth: '400px', textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📧</div>
          <h2 style={{ margin: '0 0 12px 0', color: '#333' }}>Check your email</h2>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6', margin: '0 0 8px 0' }}>
            We sent a verification link to
          </p>
          <p style={{ color: '#667eea', fontWeight: 'bold', fontSize: '15px', margin: '0 0 24px 0' }}>
            {email}
          </p>
          <p style={{ color: '#888', fontSize: '13px', margin: '0 0 16px 0', lineHeight: '1.6' }}>
            Click the link in the email to verify your account, then come back and continue setting up your profile.
          </p>
          <div style={{
            background: '#fff8e1', border: '2px solid #ffe082', borderRadius: '10px',
            padding: '10px 14px', fontSize: '13px', color: '#7c5c00',
            fontWeight: '600', marginBottom: '20px', lineHeight: '1.6'
          }}>
            📂 Can't find it? Check your <strong>spam or junk folder</strong> — verification emails sometimes land there.
          </div>

          <button
            onClick={() => navigate('/profile-setup')}
            style={{
              width: '100%', padding: '14px', background: '#667eea',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '12px'
            }}
          >
            Continue to Profile Setup →
          </button>

          <button
            onClick={handleResend}
            disabled={resendCooldown}
            style={{
              width: '100%', padding: '12px', background: 'white',
              color: resendCooldown ? '#bbb' : '#667eea',
              border: `2px solid ${resendCooldown ? '#ddd' : '#667eea'}`,
              borderRadius: '8px', fontSize: '14px', fontWeight: 'bold',
              cursor: resendCooldown ? 'default' : 'pointer', marginBottom: '8px'
            }}
          >
            {resendCooldown ? 'Email sent! Check your inbox' : 'Resend verification email'}
          </button>

          {error && (
            <div style={{ background: '#fee', color: '#c33', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

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
        maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '24px', color: '#333', textAlign: 'center' }}>
          Sign Up
        </h2>

        <form onSubmit={handleSignup}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', border: '1px solid #ddd',
                borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', border: '1px solid #ddd',
                borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#666' }}>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '12px', border: '1px solid #ddd',
                borderRadius: '8px', fontSize: '16px', boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fee', color: '#c33', padding: '12px',
              borderRadius: '8px', marginBottom: '16px', fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? '#aaa' : '#667eea',
              color: 'white', border: 'none', borderRadius: '8px',
              fontSize: '16px', fontWeight: 'bold',
              cursor: loading ? 'default' : 'pointer'
            }}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '16px', color: '#666' }}>
          Already have an account? <a href="/login" style={{ color: '#667eea' }}>Login</a>
        </p>
      </div>
    </div>
  );
}

export default Signup;
