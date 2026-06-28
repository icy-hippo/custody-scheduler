import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase';

const PARENT_STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to HarmonyHub!',
    body: 'HarmonyHub helps your family stay coordinated — schedules, events, and transitions all in one place.',
    color: '#667eea',
    bg: '#f0f4ff',
  },
  {
    emoji: '📅',
    title: 'Set Up Your Custody Schedule',
    body: 'Go to the Calendar tab and tap "Set Up Custody Schedule" to define your pattern — alternating weeks, 2-2-3, or weekday/weekend.',
    color: '#764ba2',
    bg: '#f5f0ff',
    tip: 'Tip: Both parents will see the same color-coded calendar.',
  },
  {
    emoji: '📝',
    title: 'Add Family Events',
    body: 'Tap the + button on the Events tab to add school events, sports, medical appointments, and more. Your co-parent sees them too.',
    color: '#f093fb',
    bg: '#fdf0ff',
    tip: 'Tip: Events can repeat weekly, monthly, or yearly.',
  },
  {
    emoji: '👧',
    title: 'Invite Your Child',
    body: 'Go to the More tab and tap "Invite Child" to get a family code. Share it with your child so they can see their schedule.',
    color: '#43a047',
    bg: '#f0faf0',
    tip: 'Tip: Your child sees a simpler, kid-friendly version of the app.',
  },
  {
    emoji: '🎉',
    title: "You're All Set!",
    body: "HarmonyHub is ready to use. Link your co-parent from the More tab to start sharing updates in real time.",
    color: '#ff6b35',
    bg: '#fff5f0',
  },
];

const CHILD_STEPS = [
  {
    emoji: '👋',
    title: 'Hi! Welcome to HarmonyHub!',
    body: 'HarmonyHub is your personal schedule helper. It shows where you are today, what\'s coming up, and when you move between homes.',
    color: '#667eea',
    bg: '#f0f4ff',
  },
  {
    emoji: '🏠',
    title: 'Know Where You Are',
    body: 'The Today tab always shows which home you\'re at and when you\'re moving next. No more confusion!',
    color: '#4facfe',
    bg: '#f0f8ff',
    tip: 'The transition card changes color as moving day gets closer.',
  },
  {
    emoji: '🗓️',
    title: 'See Your Week',
    body: 'The Week tab shows every day of your week — color-coded by which parent\'s house you\'ll be at, with all your events.',
    color: '#f093fb',
    bg: '#fdf0ff',
  },
  {
    emoji: '🎒',
    title: 'Pack Your Bag',
    body: 'The Pack tab reminds you what to bring before you move homes. Check things off as you pack!',
    color: '#ffa500',
    bg: '#fff8f0',
    tip: 'Tip: You can add your own items to the pack list.',
  },
  {
    emoji: '🌟',
    title: "You're Ready!",
    body: 'Go to the More tab and tap "Join Family" to enter the code your parent gave you. Then your schedule will appear!',
    color: '#43a047',
    bg: '#f0faf0',
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = location.state?.role || 'parent';
  const destination = role === 'parent' ? '/parent-dashboard' : '/child-dashboard';

  const steps = role === 'parent' ? PARENT_STEPS : CHILD_STEPS;
  const [step, setStep] = useState(0);

  const current = steps[step];
  const isLast = step === steps.length - 1;

  const finish = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), { onboardingDone: true });
      }
    } catch (e) {}
    navigate(destination);
  };

  const next = () => {
    if (isLast) finish();
    else setStep(s => s + 1);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: current.bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '48px 24px 40px 24px',
      fontFamily: 'system-ui',
      transition: 'background 0.4s ease'
    }}>

      {/* Skip */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={finish} style={{
          background: 'none', border: 'none', color: '#999',
          fontSize: '15px', cursor: 'pointer', fontWeight: '500'
        }}>Skip</button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', maxWidth: '360px' }}>

        {/* Emoji bubble */}
        <div style={{
          width: '120px', height: '120px', borderRadius: '36px',
          background: 'white',
          boxShadow: `0 12px 40px ${current.color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '60px', marginBottom: '36px',
          border: `3px solid ${current.color}22`
        }}>
          {current.emoji}
        </div>

        <h1 style={{
          fontSize: '26px', fontWeight: '800', color: '#222',
          margin: '0 0 16px 0', lineHeight: 1.3
        }}>
          {current.title}
        </h1>

        <p style={{
          fontSize: '16px', color: '#555', lineHeight: 1.7,
          margin: '0 0 20px 0'
        }}>
          {current.body}
        </p>

        {current.tip && (
          <div style={{
            background: 'white', borderRadius: '14px', padding: '12px 16px',
            fontSize: '13px', color: current.color, fontWeight: '600',
            border: `2px solid ${current.color}33`,
            boxShadow: `0 2px 12px ${current.color}18`
          }}>
            {current.tip}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div style={{ width: '100%', maxWidth: '360px' }}>

        {/* Dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '28px' }}>
          {steps.map((_, i) => (
            <div key={i} onClick={() => setStep(i)} style={{
              width: i === step ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === step ? current.color : '#ddd',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }} />
          ))}
        </div>

        {/* Next button */}
        <button onClick={next} style={{
          width: '100%', padding: '18px',
          background: current.color,
          color: 'white', border: 'none', borderRadius: '16px',
          fontSize: '17px', fontWeight: '700', cursor: 'pointer',
          boxShadow: `0 6px 20px ${current.color}44`,
          transition: 'background 0.3s ease'
        }}>
          {isLast ? "Let's Go! 🚀" : 'Next →'}
        </button>

        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} style={{
            width: '100%', marginTop: '12px', padding: '12px',
            background: 'none', border: 'none',
            color: '#999', fontSize: '15px', cursor: 'pointer'
          }}>
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
