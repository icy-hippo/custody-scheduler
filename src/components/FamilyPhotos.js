import { useState, useEffect, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage, auth } from '../firebase';

export default function FamilyPhotos({ familyId }) {
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!familyId) return;
    const q = query(
      collection(db, 'familyPhotos'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setPhotos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [familyId]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !familyId) return;

    setUploading(true);
    try {
      const user = auth.currentUser;
      const storageRef = ref(storage, `familyPhotos/${familyId}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'familyPhotos'), {
        familyId,
        url,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || 'Family member',
        fileName: file.name,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Upload error:', err);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this photo?')) return;
    setDeleting(true);
    try {
      // Delete from Storage
      try {
        const storageRef = ref(storage, selectedPhoto.url);
        await deleteObject(storageRef);
      } catch (err) {
        // Storage delete can fail if URL format differs; continue to delete Firestore doc
      }
      await deleteDoc(doc(db, 'familyPhotos', selectedPhoto.id));
      setSelectedPhoto(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete photo.');
    }
    setDeleting(false);
  };

  if (!familyId) return null;

  const currentUser = auth.currentUser;

  return (
    <div style={{ marginTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📸 Family Photos</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '8px 16px', borderRadius: '10px', border: 'none',
            background: uploading ? '#ccc' : 'linear-gradient(135deg, #667EEA, #764BA2)',
            color: 'white', fontSize: '14px', fontWeight: '600',
            cursor: uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {uploading ? 'Uploading...' : '+ Add Photo'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      {photos.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '32px', background: '#f8f9ff',
          borderRadius: '16px', color: '#999',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📷</div>
          <div>No photos yet. Add the first one!</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {photos.map(photo => (
            <div
              key={photo.id}
              onClick={() => setSelectedPhoto(photo)}
              style={{
                aspectRatio: '1', borderRadius: '12px', overflow: 'hidden',
                cursor: 'pointer', background: '#f0f0f0',
              }}
            >
              <img
                src={photo.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          ))}
        </div>
      )}

      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', zIndex: 2000, padding: '20px',
          }}
        >
          <img
            src={selectedPhoto.url}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '75vh', borderRadius: '12px', objectFit: 'contain' }}
          />
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginTop: '12px' }}>
            Shared by {selectedPhoto.uploadedByName}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '4px' }}>
            Tap anywhere to close
          </div>

          {/* Delete button — shown to the uploader */}
          {currentUser && selectedPhoto.uploadedBy === currentUser.uid && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              style={{
                marginTop: '20px', padding: '10px 24px',
                background: deleting ? '#888' : '#ff4444',
                color: 'white', border: 'none', borderRadius: '10px',
                fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
              }}
            >
              {deleting ? 'Deleting...' : '🗑 Delete Photo'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
