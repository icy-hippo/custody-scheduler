import { useState, useEffect } from 'react';
import { subscribeToNotifications, markNotificationAsRead, deleteNotification, markAllNotificationsAsRead } from '../services/NotificationService';
import { useDarkMode } from '../context/DarkModeContext';

function NotificationCenter({ userId }) {
  const [notifications, setNotifications] = useState([]);
  const [showPanel, setShowPanel] = useState(false);
  const { darkMode } = useDarkMode();

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToNotifications(userId, (notifs) => {
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, [userId]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_created':
        return '📅';
      case 'event_updated':
        return '✏️';
      case 'event_deleted':
        return '🗑️';
      case 'custody_transition':
        return '🏠';
      case 'parent_linked':
        return '👥';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'event_created':
        return '#667eea';
      case 'event_updated':
        return '#4facfe';
      case 'event_deleted':
        return '#ff6b9d';
      case 'custody_transition':
        return '#ffa500';
      case 'parent_linked':
        return '#34a853';
      default:
        return '#667eea';
    }
  };

  const handleNotificationClick = async (notificationId) => {
    await markNotificationAsRead(notificationId);
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead(userId);
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              background: '#ff4444',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {unreadCount}
          </div>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div
          style={{
            position: 'fixed',
            top: '60px',
            right: '20px',
            width: '100%',
            maxWidth: '400px',
            maxHeight: '500px',
            background: darkMode ? '#0f3460' : 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: `1px solid ${darkMode ? '#1a3a52' : '#eee'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: darkMode ? '#1a1a2e' : '#f8f9fa'
            }}
          >
            <h3 style={{ margin: 0, color: darkMode ? '#fff' : '#333', fontSize: '18px' }}>
              Notifications
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: darkMode ? '#ccc' : '#999'
              }}
            >
              ✕
            </button>
          </div>

          {/* Notifications List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: darkMode ? '#999' : '#666'
                }}
              >
                <p style={{ margin: 0, fontSize: '14px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif.id)}
                  style={{
                    padding: '16px',
                    borderBottom: `1px solid ${darkMode ? '#1a3a52' : '#eee'}`,
                    cursor: 'pointer',
                    background: notif.read
                      ? 'transparent'
                      : darkMode
                      ? 'rgba(102, 126, 234, 0.1)'
                      : 'rgba(102, 126, 234, 0.05)',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = darkMode
                      ? 'rgba(102, 126, 234, 0.15)'
                      : 'rgba(102, 126, 234, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = notif.read
                      ? 'transparent'
                      : darkMode
                      ? 'rgba(102, 126, 234, 0.1)'
                      : 'rgba(102, 126, 234, 0.05)';
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '24px' }}>
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: notif.read ? '500' : 'bold',
                          color: darkMode ? '#fff' : '#333',
                          marginBottom: '4px'
                        }}
                      >
                        {notif.title}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: darkMode ? '#aaa' : '#666',
                          marginBottom: '4px'
                        }}
                      >
                        {notif.message}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          color: darkMode ? '#888' : '#999'
                        }}
                      >
                        {new Date(notif.createdAt.toDate ? notif.createdAt.toDate() : notif.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    {!notif.read && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          background: getNotificationColor(notif.type),
                          borderRadius: '50%',
                          marginTop: '6px'
                        }}
                      />
                    )}
                  </div>
                  <button
                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: darkMode ? '#888' : '#ccc',
                      cursor: 'pointer',
                      fontSize: '12px',
                      marginTop: '8px',
                      padding: '4px 8px',
                      borderRadius: '4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = darkMode ? '#1a3a52' : '#f0f0f0';
                      e.currentTarget.style.color = darkMode ? '#ff6b9d' : '#ff4444';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = darkMode ? '#888' : '#ccc';
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {unreadCount > 0 && (
            <div
              style={{
                padding: '12px',
                borderTop: `1px solid ${darkMode ? '#1a3a52' : '#eee'}`,
                textAlign: 'center'
              }}
            >
              <button
                onClick={handleMarkAllAsRead}
                style={{
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '12px'
                }}
              >
                Mark All as Read
              </button>
            </div>
          )}
        </div>
      )}

      {/* Overlay to close panel */}
      {showPanel && (
        <div
          onClick={() => setShowPanel(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
      )}
    </div>
  );
}

export default NotificationCenter;