function BottomTabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      background: 'white',
      borderTop: '1px solid #f0f0f0',
      display: 'flex',
      zIndex: 100,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.06)'
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px 4px',
              position: 'relative',
              transition: 'opacity 0.15s'
            }}
          >
            {tab.badge > 0 && (
              <div style={{
                position: 'absolute',
                top: '6px',
                right: 'calc(50% - 22px)',
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
                padding: '0 4px',
                zIndex: 1
              }}>
                {tab.badge}
              </div>
            )}

            {/* Icon with pill background when active */}
            <div style={{
              width: '52px',
              height: '32px',
              borderRadius: '16px',
              background: isActive ? '#667eea18' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              fontSize: isActive ? '28px' : '24px',
            }}>
              {tab.icon}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default BottomTabBar;
