import { useState } from 'react';

const BRING_SUGGESTIONS = {
  Sports: ['Sports uniform', 'Water bottle', 'Cleats / gear', 'Snack'],
  Medical: ['Insurance card', 'Medications list', 'Referral paperwork'],
  School: ['Homework', 'Permission slips', 'School ID'],
  Activities: ['Supplies / costume', 'Water bottle', 'Permission form'],
  Family: [],
  Other: [],
};

function formatTime(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, mo, d] = dateStr.split('-').map(Number);
  return new Date(y, mo - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
}

function EventDetail({ event, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!event) return null;

  const suggestions = BRING_SUGGESTIONS[event.category] || [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
        zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: '24px 24px 0 0',
          width: '100%', maxWidth: '480px', padding: '24px',
          maxHeight: '85vh', overflowY: 'auto',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.2)'
        }}
      >
        {/* Drag handle */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: '#ddd', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
            background: `${event.color}20`, border: `2px solid ${event.color}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px'
          }}>
            {event.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{
              display: 'inline-block', background: `${event.color}20`,
              color: event.color, borderRadius: '20px', padding: '2px 10px',
              fontSize: '12px', fontWeight: '600', marginBottom: '4px'
            }}>
              {event.category}
            </div>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#333', lineHeight: 1.3 }}>{event.title}</h2>
          </div>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          <DetailRow icon="📅" label="Date" value={formatDate(event.date)} />
          {event.time && <DetailRow icon="🕐" label="Time" value={formatTime(event.time)} />}
          {event.location && <DetailRow icon="📍" label="Location" value={event.location} />}
          {event.notes && <DetailRow icon="📝" label="Notes" value={event.notes} />}
          {event.isRecurring && <DetailRow icon="🔁" label="Recurring" value="This is a recurring event" />}
        </div>

        {/* What to bring */}
        {suggestions.length > 0 && (
          <div style={{
            background: '#f8f9ff', borderRadius: '16px', padding: '16px', marginBottom: '24px',
            border: `1px solid ${event.color}33`
          }}>
            <div style={{ fontWeight: '700', color: '#333', marginBottom: '10px', fontSize: '15px' }}>
              🎒 What to bring
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suggestions.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#555' }}>
                  <span style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: event.color, flexShrink: 0
                  }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {(onEdit || onDelete) && !confirmDelete && (
          <div style={{ display: 'flex', gap: '10px' }}>
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(event.id); }}
                style={{
                  flex: 1, padding: '14px', borderRadius: '12px', fontWeight: '700',
                  background: event.color, color: 'white', border: 'none',
                  fontSize: '15px', cursor: 'pointer'
                }}
              >
                Edit Event
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setConfirmDelete(true)}
                style={{
                  padding: '14px 18px', borderRadius: '12px', fontWeight: '700',
                  background: 'white', color: '#ff4444', border: '2px solid #ff4444',
                  fontSize: '15px', cursor: 'pointer'
                }}
              >
                Delete
              </button>
            )}
          </div>
        )}

        {confirmDelete && (
          <div style={{ background: '#fff5f5', borderRadius: '12px', padding: '16px', border: '2px solid #ff4444' }}>
            <p style={{ margin: '0 0 12px', color: '#333', fontWeight: '600' }}>Delete this event?</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => { onDelete(event.id); onClose(); }}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: '#ff4444', color: 'white', border: 'none',
                  fontWeight: '700', cursor: 'pointer'
                }}
              >Yes, delete</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  background: '#f0f0f0', color: '#555', border: 'none',
                  fontWeight: '700', cursor: 'pointer'
                }}
              >Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
      <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
      <div>
        <div style={{ fontSize: '11px', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: '15px', color: '#333', marginTop: '2px' }}>{value}</div>
      </div>
    </div>
  );
}

export default EventDetail;
