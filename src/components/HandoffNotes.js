import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, orderBy, query, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { timestampToDate } from '../utils/spectrumSupport';

const emptyNote = {
  sleep: '',
  food: '',
  triggers: '',
  wins: '',
  medication: '',
  school: '',
  regulation: '',
};

function HandoffNotes({ familyId, currentUserName }) {
  const [note, setNote] = useState(emptyNote);
  const [notes, setNotes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadNotes = async () => {
    if (!familyId) return;

    try {
      const notesQuery = query(
        collection(db, 'handoffNotes'),
        where('familyId', '==', familyId),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(notesQuery);
      setNotes(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadNotes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  const saveNote = async (e) => {
    e.preventDefault();
    if (!familyId || !auth.currentUser) return;

    const hasContent = Object.values(note).some(value => value.trim());
    if (!hasContent) {
      setError('Add at least one handoff detail.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'handoffNotes'), {
        ...note,
        familyId,
        createdBy: auth.currentUser.uid,
        createdByName: currentUserName || 'A parent',
        createdAt: serverTimestamp(),
      });
      setNote(emptyNote);
      await loadNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!familyId) return null;

  const fields = [
    ['sleep', 'Sleep'],
    ['food', 'Food'],
    ['triggers', 'Triggers'],
    ['wins', 'Wins'],
    ['medication', 'Medication'],
    ['school', 'School'],
    ['regulation', 'Regulation needs'],
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 6px 0', color: '#333' }}>Parent Handoff Notes</h2>
      <p style={{ margin: '0 0 18px 0', color: '#666' }}>
        Share regulation details for the next handoff.
      </p>

      <form onSubmit={saveNote} style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {fields.map(([key, label]) => (
            <label key={key} style={{ display: 'grid', gap: '6px', color: '#555', fontWeight: '600', fontSize: '14px' }}>
              {label}
              <textarea
                value={note[key]}
                onChange={(e) => setNote(prev => ({ ...prev, [key]: e.target.value }))}
                rows="2"
                placeholder={`Add ${label.toLowerCase()} notes`}
                style={{
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontFamily: 'system-ui',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </label>
          ))}
        </div>
        {error && <div style={{ color: '#c33', background: '#fee', padding: '10px', borderRadius: '8px' }}>{error}</div>}
        <button
          type="submit"
          disabled={saving}
          style={{
            justifySelf: 'start',
            padding: '12px 18px',
            background: saving ? '#ccc' : '#455a64',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {saving ? 'Saving...' : 'Save Handoff Note'}
        </button>
      </form>

      {notes.length > 0 && (
        <div style={{ display: 'grid', gap: '10px' }}>
          {notes.slice(0, 3).map(savedNote => {
            const created = timestampToDate(savedNote.createdAt);
            return (
              <div key={savedNote.id} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '14px', background: '#fafafa' }}>
                <div style={{ color: '#666', fontSize: '13px', marginBottom: '8px' }}>
                  {savedNote.createdByName || 'A parent'}{created ? ` - ${created.toLocaleDateString()}` : ''}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
                  {fields
                    .filter(([key]) => savedNote[key])
                    .map(([key, label]) => (
                      <div key={key}>
                        <strong style={{ color: '#333' }}>{label}: </strong>
                        <span style={{ color: '#555' }}>{savedNote[key]}</span>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default HandoffNotes;
