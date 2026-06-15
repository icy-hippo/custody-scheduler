function BottomTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'white',
      borderTop: '1px solid #eee',
      display: 'flex',
      zIndex: 100,
      boxShadow: '0 -2px 12px rgba(0,0,0,0.08)'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === tab.id ? '#667eea' : '#aaa',
            padding: '8px 4px',
            position: 'relative'
          }}
        >
          {tab.badge > 0 && (
            <div style={{
              position: 'absolute',
              top: '6px',
              right: 'calc(50% - 18px)',
              background: '#ff4444',
              color: 'white',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: 'bold',
              minWidth: '16px',
              height: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px'
            }}>
              {tab.badge}
            </div>
          )}
          <span style={{ fontSize: '22px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{
            fontSize: '10px',
            fontWeight: activeTab === tab.id ? '700' : '500',
            letterSpacing: '0.2px'
          }}>
            {tab.label}
          </span>
          {activeTab === tab.id && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: '20%',
              right: '20%',
              height: '3px',
              background: '#667eea',
              borderRadius: '0 0 3px 3px'
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

export default BottomTabBar;
