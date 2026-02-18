import { useState } from 'react';
import { generateEventsIcal, generateCustodyIcal, downloadIcalFile, copyIcalToClipboard } from '../services/CalendarExportService';

function CalendarExport({ events, custodySchedule }) {
  const [showModal, setShowModal] = useState(false);
  const [exportType, setExportType] = useState('events');
  const [copied, setCopied] = useState(false);

  const handleExport = (type) => {
    let icalContent;
    let filename;

    if (type === 'events') {
      icalContent = generateEventsIcal(events, 'Family Events');
      filename = `family-events-${new Date().toISOString().split('T')[0]}.ics`;
    } else if (type === 'custody') {
      icalContent = generateCustodyIcal(custodySchedule, 12);
      filename = `custody-schedule-${new Date().toISOString().split('T')[0]}.ics`;
    } else {
      // Both
      const eventsIcal = generateEventsIcal(events, 'Family Events');
      const custodyIcal = generateCustodyIcal(custodySchedule, 12);
      icalContent = eventsIcal + '\n' + custodyIcal;
      filename = `harmonyhub-calendar-${new Date().toISOString().split('T')[0]}.ics`;
    }

    downloadIcalFile(icalContent, filename);
  };

  const handleCopyToClipboard = async (type) => {
    let icalContent;

    if (type === 'events') {
      icalContent = generateEventsIcal(events, 'Family Events');
    } else if (type === 'custody') {
      icalContent = generateCustodyIcal(custodySchedule, 12);
    }

    const success = await copyIcalToClipboard(icalContent);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '16px 32px',
          background: '#764ba2',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(118, 75, 162, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        📥 Export Calendar
      </button>

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, color: '#333' }}>Export Calendar</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
              Export your calendar in iCal (.ics) format to use with Google Calendar, Apple Calendar, Outlook, and other calendar applications.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              {/* Events Export */}
              <div style={{
                padding: '20px',
                border: '2px solid #667eea',
                borderRadius: '12px',
                background: '#f8f9ff'
              }}>
                <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
                  📅 Family Events
                </h3>
                <p style={{ color: '#666', fontSize: '14px', margin: '0 0 12px 0' }}>
                  Export all family events and activities
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handleExport('events')}
                    style={{
                      padding: '10px 20px',
                      background: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleCopyToClipboard('events')}
                    style={{
                      padding: '10px 20px',
                      background: 'white',
                      color: '#667eea',
                      border: '2px solid #667eea',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Custody Schedule Export */}
              {custodySchedule && (
                <div style={{
                  padding: '20px',
                  border: '2px solid #4facfe',
                  borderRadius: '12px',
                  background: '#f0f8ff'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
                    🏠 Custody Schedule
                  </h3>
                  <p style={{ color: '#666', fontSize: '14px', margin: '0 0 12px 0' }}>
                    Export the 12-month custody schedule
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleExport('custody')}
                      style={{
                        padding: '10px 20px',
                        background: '#4facfe',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleCopyToClipboard('custody')}
                      style={{
                        padding: '10px 20px',
                        background: 'white',
                        color: '#4facfe',
                        border: '2px solid #4facfe',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px'
                      }}
                    >
                      {copied ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Both Export */}
              {custodySchedule && (
                <div style={{
                  padding: '20px',
                  border: '2px solid #43e97b',
                  borderRadius: '12px',
                  background: '#f0fff4'
                }}>
                  <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '16px' }}>
                    ✨ Complete Calendar
                  </h3>
                  <p style={{ color: '#666', fontSize: '14px', margin: '0 0 12px 0' }}>
                    Export both events and custody schedule together
                  </p>
                  <button
                    onClick={() => handleExport('both')}
                    style={{
                      padding: '10px 20px',
                      background: '#43e97b',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}
                  >
                    Download All
                  </button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{
              padding: '16px',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '16px'
            }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '14px' }}>
                How to use:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '13px', lineHeight: '1.6' }}>
                <li>Google Calendar: Upload the file in Settings → Calendars → Import & Export</li>
                <li>Apple Calendar: Double-click the downloaded .ics file</li>
                <li>Outlook: File → Open & Export → Import</li>
                <li>Paste text: Copy to clipboard and paste in your calendar app</li>
              </ul>
            </div>

            <button
              onClick={() => setShowModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarExport;
