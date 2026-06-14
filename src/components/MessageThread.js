import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase';
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp
} from 'firebase/firestore';

function MessageThread({ familyId, currentUserName, linkedParentId }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(false);
  const bottomRef = useRef(null);
  const user = auth.currentUser;

  useEffect(() => {
    if (!familyId) return;

    const q = query(
      collection(db, 'messages'),
      where('familyId', '==', familyId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => unsubscribe();
  }, [familyId]);

  // Scroll to bottom when new messages arrive and panel is open
  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const unreadCount = messages.filter(
    m => m.senderId !== user?.uid && !m.readBy?.includes(user?.uid)
  ).length;

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !familyId) return;

    setSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        familyId,
        text: text.trim(),
        senderId: user.uid,
        senderName: currentUserName || 'A parent',
        createdAt: serverTimestamp(),
        readBy: [user.uid],
      });
      setText('');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Group consecutive messages by same sender
  const grouped = messages.reduce((acc, msg, i) => {
    const prev = messages[i - 1];
    const sameUser = prev && prev.senderId === msg.senderId;
    acc.push({ ...msg, firstInGroup: !sameUser });
    return acc;
  }, []);

  if (!linkedParentId) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
        color: '#999'
      }}>
        <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Link a co-parent to enable messaging
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      marginBottom: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {/* Header / Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 24px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>💬</span>
          <span style={{ fontWeight: '700', fontSize: '16px', color: '#333' }}>
            Co-Parent Messages
          </span>
          {unreadCount > 0 && (
            <span style={{
              background: '#ff4444',
              color: 'white',
              borderRadius: '12px',
              padding: '2px 8px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {unreadCount} new
            </span>
          )}
        </div>
        <span style={{ color: '#999', fontSize: '18px' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <>
          {/* Message list */}
          <div style={{
            height: '320px',
            overflowY: 'auto',
            padding: '16px 20px',
            background: '#f8f9fa',
            borderTop: '1px solid #eee',
            borderBottom: '1px solid #eee',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            {messages.length === 0 ? (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#bbb'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>💬</div>
                <p style={{ margin: 0, fontSize: '14px' }}>No messages yet. Say hello!</p>
              </div>
            ) : (
              grouped.map(msg => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start',
                      marginTop: msg.firstInGroup ? '12px' : '2px'
                    }}
                  >
                    {msg.firstInGroup && (
                      <div style={{
                        fontSize: '11px',
                        color: '#aaa',
                        marginBottom: '4px',
                        paddingLeft: isMe ? 0 : '4px',
                        paddingRight: isMe ? '4px' : 0
                      }}>
                        {isMe ? 'You' : msg.senderName} · {formatTime(msg.createdAt)}
                      </div>
                    )}
                    <div style={{
                      maxWidth: '72%',
                      padding: '10px 14px',
                      borderRadius: isMe
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px',
                      background: isMe ? '#667eea' : 'white',
                      color: isMe ? 'white' : '#333',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      wordBreak: 'break-word'
                    }}>
                      {msg.text}
                    </div>
                    {!msg.firstInGroup && (
                      <div style={{ fontSize: '10px', color: '#ccc', marginTop: '1px' }}>
                        {formatTime(msg.createdAt)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={send}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '12px 16px'
            }}
          >
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Type a message..."
              maxLength={1000}
              style={{
                flex: 1,
                padding: '10px 14px',
                border: '1px solid #ddd',
                borderRadius: '24px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              style={{
                padding: '10px 20px',
                background: text.trim() ? '#667eea' : '#ddd',
                color: 'white',
                border: 'none',
                borderRadius: '24px',
                cursor: text.trim() ? 'pointer' : 'default',
                fontWeight: 'bold',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default MessageThread;
