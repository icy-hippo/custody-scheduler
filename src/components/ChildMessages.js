import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, serverTimestamp, updateDoc, doc, arrayUnion } from 'firebase/firestore';

function ChildMessages({ familyId, userId, userName, onUnreadChange }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!familyId) return;

    const q = query(
      collection(db, 'familyMessages'),
      where('familyId', '==', familyId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      msgs.sort((a, b) => {
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return aTime - bTime;
      });
      setMessages(msgs);

      const unread = msgs.filter(m => m.senderId !== userId && !(m.readBy || []).includes(userId)).length;
      onUnreadChange?.(unread);
    });

    return () => unsubscribe();
  }, [familyId, userId, onUnreadChange]);

  // Mark messages as read when tab is open
  useEffect(() => {
    messages.forEach(async (m) => {
      if (m.senderId !== userId && !(m.readBy || []).includes(userId)) {
        try {
          await updateDoc(doc(db, 'familyMessages', m.id), {
            readBy: arrayUnion(userId)
          });
        } catch (e) {}
      }
    });
  }, [messages, userId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !familyId) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'familyMessages'), {
        familyId,
        text: text.trim(),
        senderId: userId,
        senderName: userName || 'Me',
        createdAt: serverTimestamp(),
        readBy: [userId],
      });
      setText('');
    } catch (e) {
      console.error('Send error:', e);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!familyId) {
    return (
      <div style={{
        background: 'white', borderRadius: '20px', padding: '40px',
        textAlign: 'center', boxShadow: '0 4px 16px rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
        <p style={{ color: '#666', fontSize: '16px', margin: 0 }}>
          Join your family first to see messages from your parents.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white', borderRadius: '20px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - 180px)', overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', gap: '10px'
      }}>
        <div style={{ fontSize: '28px' }}>💬</div>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '17px', color: '#333' }}>Family Chat</div>
          <div style={{ fontSize: '12px', color: '#999' }}>Messages from your parents</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#bbb' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👋</div>
            <div style={{ fontSize: '15px' }}>No messages yet. Say hi!</div>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === userId;
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start',
            }}>
              {!isMe && (
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px', paddingLeft: '4px' }}>
                  {msg.senderName}
                </div>
              )}
              <div style={{
                maxWidth: '78%',
                padding: '10px 14px',
                borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                background: isMe ? '#667eea' : '#f2f2f7',
                color: isMe ? 'white' : '#333',
                fontSize: '15px',
                lineHeight: 1.5,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
              }}>
                {msg.text}
              </div>
              <div style={{ fontSize: '10px', color: '#bbb', marginTop: '3px', paddingLeft: '4px', paddingRight: '4px' }}>
                {formatTime(msg.createdAt)}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid #f0f0f0',
        display: 'flex', gap: '8px', alignItems: 'flex-end'
      }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Send a message..."
          style={{
            flex: 1, padding: '10px 14px', border: '2px solid #e0e0e0',
            borderRadius: '20px', fontSize: '15px', outline: 'none',
            background: '#f9f9f9'
          }}
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          style={{
            width: '42px', height: '42px', borderRadius: '50%',
            background: text.trim() ? '#667eea' : '#e0e0e0',
            border: 'none', cursor: text.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', transition: 'background 0.2s', flexShrink: 0
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
}

export default ChildMessages;
