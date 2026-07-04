import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const MOOD_MAP = {
  'Great':     { emoji: '😄', color: '#43e97b' },
  'Good':      { emoji: '🙂', color: '#4facfe' },
  'Okay':      { emoji: '😐', color: '#ffa500' },
  'Not great': { emoji: '😔', color: '#f093fb' },
  'Sad':       { emoji: '😢', color: '#ff6b9d' },
};

function FamilyMoodSummary({ familyId }) {
  const [childMoods, setChildMoods] = useState([]);

  useEffect(() => {
    if (!familyId) return;

    const load = async () => {
      const d = new Date();
      const todayKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

      try {
        // Query today's moods for this family directly
        const moodsSnap = await getDocs(
          query(collection(db, 'moods'), where('familyId', '==', familyId), where('date', '==', todayKey))
        );

        if (moodsSnap.empty) {
          // Fall back: check members array for children
          const familyDoc = await getDoc(doc(db, 'families', familyId));
          if (!familyDoc.exists()) return;
          const members = familyDoc.data().members || [];
          const results = [];
          for (const uid of members) {
            const userDoc = await getDoc(doc(db, 'users', uid));
            if (!userDoc.exists()) continue;
            const userData = userDoc.data();
            if (userData.role !== 'child') continue;
            results.push({
              uid,
              name: userData.displayName || userData.name || 'Child',
              mood: null,
            });
          }
          setChildMoods(results);
          return;
        }

        // Resolve names for each mood entry
        const results = [];
        for (const moodDoc of moodsSnap.docs) {
          const data = moodDoc.data();
          const userDoc = await getDoc(doc(db, 'users', data.userId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          if (userData.role === 'parent') continue; // skip parent moods
          results.push({
            uid: data.userId,
            name: userData.displayName || userData.name || 'Child',
            mood: data.mood,
          });
        }
        setChildMoods(results);
      } catch (e) {}
    };

    load();
  }, [familyId]);

  if (childMoods.length === 0) return null;

  return (
    <div style={{
      background: 'white', borderRadius: '16px', padding: '16px',
      marginBottom: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      border: '2px solid #f0f0f0'
    }}>
      <div style={{ fontSize: '13px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
        Today's Mood
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {childMoods.map(child => {
          const mood = child.mood ? MOOD_MAP[child.mood] : null;
          return (
            <div key={child.uid} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
                background: mood ? `${mood.color}20` : '#f5f5f5',
                border: `2px solid ${mood ? mood.color : '#eee'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px'
              }}>
                {mood ? mood.emoji : '?'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>{child.name}</div>
                <div style={{ fontSize: '12px', color: mood ? mood.color : '#aaa', marginTop: '1px' }}>
                  {child.mood || 'No check-in yet today'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FamilyMoodSummary;
