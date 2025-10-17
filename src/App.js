import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ProfileSetup from './pages/ProfileSetup';
import ParentDashboard from './pages/ParentDashboard';
import ChildDashboard from './pages/ChildDashboard';

function Home() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '40px',
      fontFamily: 'system-ui'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', color: 'white', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>
            HarmonyHub
          </h1>
          <p style={{ fontSize: '20px', opacity: 0.9 }}>
            A Shared Scheduler for Divorced Families
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '40px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
              🎒 For Children
            </h2>
            <ul style={{ color: '#666', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
              <li>✓ Visual, autism-friendly schedule</li>
              <li>✓ Know where you are today</li>
              <li>✓ See what's coming next</li>
              <li>✓ Gentle transition reminders</li>
            </ul>
          </div>

          <div style={{ 
            background: 'white', 
            padding: '32px', 
            borderRadius: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
              👨‍👩‍👧 For Parents
            </h2>
            <ul style={{ color: '#666', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
              <li>✓ Coordinate with co-parent in real-time</li>
              <li>✓ Set up custody schedules</li>
              <li>✓ Share updates and notes</li>
              <li>✓ Reduce miscommunication</li>
            </ul>
          </div>
        </div>

        <div style={{ textAlign: 'center', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <button style={{
              background: 'white',
              color: '#667eea',
              padding: '16px 48px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              Login
            </button>
          </Link>
          <Link to="/signup" style={{ textDecoration: 'none' }}>
            <button style={{
              background: '#764ba2',
              color: 'white',
              padding: '16px 48px',
              fontSize: '18px',
              border: 'none',
              borderRadius: '50px',
              cursor: 'pointer',
              fontWeight: 'bold',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              Sign Up
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile-setup" element={<ProfileSetup />} />
        <Route path="/parent-dashboard" element={<ParentDashboard />} />
        <Route path="/child-dashboard" element={<ChildDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;