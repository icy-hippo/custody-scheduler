import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';

const CATEGORIES = [
  { key: 'doctor', label: 'Doctor', icon: '🏥' },
  { key: 'dentist', label: 'Dentist', icon: '🦷' },
  { key: 'school', label: 'School', icon: '🏫' },
  { key: 'babysitter', label: 'Babysitter', icon: '👶' },
  { key: 'other', label: 'Other', icon: '📞' },
];

const EMPTY_CONTACT = { name: '', phone: '', notes: '' };

export default function EmergencyContacts({ familyId, editable = false }) {
  const [contacts, setContacts] = useState({});
  const [editing, setEditing] = useState(null); // category key being edited
  const [form, setForm] = useState(EMPTY_CONTACT);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!familyId) return;
    const unsub = onSnapshot(doc(db, 'emergencyContacts', familyId), snap => {
      if (snap.exists()) setContacts(snap.data());
    });
    return unsub;
  }, [familyId]);

  const startEdit = (key) => {
    setForm(contacts[key] || EMPTY_CONTACT);
    setEditing(key);
  };

  const save = async () => {
    if (!familyId) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'emergencyContacts', familyId), {
        ...contacts,
        [editing]: form
      }, { merge: true });
      setEditing(null);
    } catch (e) {
      console.error('Failed to save contact:', e);
    }
    setSaving(false);
  };

  const remove = async (key) => {
    if (!familyId) return;
    const updated = { ...contacts };
    delete updated[key];
    await setDoc(doc(db, 'emergencyContacts', familyId), updated);
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
        Emergency Contacts
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {CATEGORIES.map(cat => {
          const contact = contacts[cat.key];
          return (
            <div key={cat.key} style={{
              background: '#f8f9fa', borderRadius: '10px', padding: '12px',
              border: '1px solid #eee'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#444', fontSize: '14px', marginBottom: '2px' }}>
                    {cat.icon} {cat.label}
                  </div>
                  {contact?.name ? (
                    <div>
                      <div style={{ color: '#333', fontSize: '14px' }}>{contact.name}</div>
                      {contact.phone && (
                        <a href={`tel:${contact.phone}`} style={{
                          color: '#667eea', fontSize: '13px', textDecoration: 'none', fontWeight: '600'
                        }}>
                          📲 {contact.phone}
                        </a>
                      )}
                      {contact.notes && (
                        <div style={{ color: '#888', fontSize: '12px', marginTop: '2px' }}>{contact.notes}</div>
                      )}
                    </div>
                  ) : (
                    <div style={{ color: '#aaa', fontSize: '13px' }}>Not set</div>
                  )}
                </div>
                {editable && (
                  <div style={{ display: 'flex', gap: '6px', marginLeft: '8px' }}>
                    <button onClick={() => startEdit(cat.key)} style={{
                      padding: '4px 10px', background: 'white', border: '1px solid #ddd',
                      borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#667eea'
                    }}>
                      {contact?.name ? 'Edit' : '+ Add'}
                    </button>
                    {contact?.name && (
                      <button onClick={() => remove(cat.key)} style={{
                        padding: '4px 8px', background: 'white', border: '1px solid #ffcccc',
                        borderRadius: '6px', fontSize: '12px', cursor: 'pointer', color: '#ff4444'
                      }}>✕</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'flex-end', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px 20px 0 0',
            padding: '24px', width: '100%', boxSizing: 'border-box'
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#333' }}>
              {CATEGORIES.find(c => c.key === editing)?.icon} {CATEGORIES.find(c => c.key === editing)?.label}
            </h3>

            {[
              { field: 'name', label: 'Name', placeholder: 'Dr. Smith / Mrs. Johnson' },
              { field: 'phone', label: 'Phone', placeholder: '(555) 123-4567', type: 'tel' },
              { field: 'notes', label: 'Notes', placeholder: 'Office hours, address, etc.' },
            ].map(({ field, label, placeholder, type }) => (
              <div key={field} style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                  {label}
                </label>
                <input
                  type={type || 'text'}
                  value={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  placeholder={placeholder}
                  style={{
                    width: '100%', padding: '10px 12px', border: '1px solid #ddd',
                    borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={() => setEditing(null)} style={{
                flex: 1, padding: '12px', background: 'white', border: '2px solid #ddd',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: '#666'
              }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{
                flex: 2, padding: '12px', background: '#667eea', border: 'none',
                borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', color: 'white',
                opacity: saving ? 0.7 : 1
              }}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
