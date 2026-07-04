import { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MOODS = [
  { emoji: '😄', label: 'Great', color: '#43e97b' },
  { emoji: '🙂', label: 'Good', color: '#4facfe' },
  { emoji: '😐', label: 'Okay', color: '#ffa500' },
  { emoji: '😔', label: 'Not great', color: '#f093fb' },
  { emoji: '😢', label: 'Sad', color: '#ff6b9d' },
];

function MoodCheckIn({ userId, familyId }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [savedToday, setSavedToday] = useState(false);
  const [saving, setSaving] = useState(false);

  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  })();

  useEffect(() => {
    const load = async () => {
      if (!userId) return;
      try {
        const snap = await getDoc(doc(db, 'moods', `${userId}_${todayKey}`));
        if (snap.exists()) {
          setSelectedMood(snap.data().mood);
          setSavedToday(true);
        }
      } catch (e) {}
    };
    load();
  }, [userId, todayKey]);

  const saveMood = async (mood) => {
    setSaving(true);
    setSelectedMood(mood);
    try {
      await setDoc(doc(db, 'moods', `${userId}_${todayKey}`), {
        userId,
        familyId,
        mood,
        date: todayKey,
        createdAt: new Date(),
      });
      setSavedToday(true);
    } catch (e) {}
    setSaving(false);
  };

  const selected = MOODS.find(m => m.label === selectedMood);

  return (
    <div style={{
      background: 'white', borderRadius: '20px', padding: '20px',
      marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      border: `3px solid ${selected ? selected.color : '#e0e0e0'}`
    }}>
      <div style={{ fontSize: '13px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        How are you feeling today?
      </div>

      {savedToday && selected ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '40px' }}>{selected.emoji}</span>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#333' }}>{selected.label}</div>
            <button
              onClick={() => { setSavedToday(false); setSelectedMood(null); }}
              style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '12px', cursor: 'pointer', padding: 0, marginTop: '2px' }}
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {MOODS.map(mood => (
            <button
              key={mood.label}
              onClick={() => !saving && saveMood(mood.label)}
              style={{
                background: selectedMood === mood.label ? `${mood.color}20` : 'white',
                border: `2px solid ${selectedMood === mood.label ? mood.color : '#eee'}`,
                borderRadius: '12px', padding: '10px 6px', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                flex: 1, margin: '0 3px', transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '28px' }}>{mood.emoji}</span>
              <span style={{ fontSize: '10px', color: '#666', fontWeight: '600' }}>{mood.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default MoodCheckIn;
