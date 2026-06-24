import { useEffect, useState } from 'react';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { DEFAULT_VISUAL_LABELS } from '../utils/spectrumSupport';

function VisualLabelsManager({ familyId }) {
  const [labels, setLabels] = useState([]);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('Home');
  const [symbol, setSymbol] = useState('');
  const [imageData, setImageData] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadLabels = async () => {
    if (!familyId) return;
    const labelsQuery = query(collection(db, 'visualLabels'), where('familyId', '==', familyId));
    const snap = await getDocs(labelsQuery);
    setLabels(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => {
    loadLabels();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId]);

  const handleImage = (file) => {
    if (!file) return;
    if (file.size > 500000) {
      setError('Please choose an image under 500 KB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result);
    reader.readAsDataURL(file);
  };

  const saveLabel = async (e) => {
    e.preventDefault();
    if (!familyId || !auth.currentUser) return;
    if (!label.trim()) {
      setError('Add a label name.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'visualLabels'), {
        familyId,
        label: label.trim(),
        type,
        symbol: symbol.trim() || type,
        imageData,
        color: '#e3f2fd',
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
      setLabel('');
      setSymbol('');
      setImageData('');
      await loadLabels();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!familyId) return null;

  const displayLabels = labels.length ? labels : DEFAULT_VISUAL_LABELS;

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }}>
      <h2 style={{ margin: '0 0 6px 0', color: '#333' }}>Picture Labels</h2>
      <p style={{ margin: '0 0 18px 0', color: '#666' }}>
        Add AAC-friendly labels for homes, school, care, activities, and comfort items.
      </p>

      <form onSubmit={saveLabel} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', marginBottom: '18px' }}>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Label name"
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
        >
          {['Home', 'School', 'Care', 'Activity', 'Comfort', 'Food', 'Routine'].map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <input
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Short icon text"
          style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
        />
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImage(e.target.files[0])}
          style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' }}
        />
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 14px',
            background: saving ? '#ccc' : '#2a9d8f',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
          }}
        >
          {saving ? 'Saving...' : 'Add Label'}
        </button>
      </form>

      {error && <div style={{ color: '#c33', background: '#fee', padding: '10px', borderRadius: '8px', marginBottom: '12px' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
        {displayLabels.map(item => (
          <div key={item.id} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '10px', textAlign: 'center', background: '#fafafa' }}>
            <div style={{
              width: '100%',
              aspectRatio: '1',
              borderRadius: '8px',
              background: item.color || '#e3f2fd',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              color: '#333',
              fontSize: '12px',
              marginBottom: '8px',
            }}>
              {item.imageData ? (
                <img src={item.imageData} alt={item.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                item.symbol || item.type
              )}
            </div>
            <div style={{ fontWeight: 'bold', color: '#333', fontSize: '13px' }}>{item.label}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>{item.type}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VisualLabelsManager;
