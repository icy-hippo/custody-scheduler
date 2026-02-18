# Calendar Export API Reference

## Overview
The Calendar Export Service provides utilities for converting events and custody schedules to iCal (.ics) format, allowing integration with any calendar application.

## Installation

No additional dependencies required. Uses only native JavaScript APIs.

```javascript
import {
  generateEventsIcal,
  generateCustodyIcal,
  downloadIcalFile,
  copyIcalToClipboard
} from '../services/CalendarExportService';
```

## API Reference

### `generateEventsIcal(events, familyName?)`

Converts event objects to iCal format.

**Parameters:**
- `events` (Array) - Array of event objects
- `familyName` (String, optional) - Calendar name. Default: "Family Schedule"

**Event Object Structure:**
```javascript
{
  id: string,                // Unique identifier
  title: string,             // Event title (required)
  date: string,              // ISO date format: "YYYY-MM-DD" (required)
  time: string,              // Time in 24h format: "HH:MM" (optional)
  location: string,          // Event location (optional)
  notes: string,             // Additional notes/description (optional)
  category: string,          // Category name (optional)
  color: string,             // Hex color code (optional, for reference only)
  icon: string,              // Emoji or icon (optional, for reference only)
  createdBy: string,         // User ID (optional)
  createdAt: Date,           // Creation timestamp (optional)
  familyId: string           // Family identifier (optional)
}
```

**Returns:**
- (String) - iCal formatted string

**Example:**
```javascript
const events = [
  {
    id: '1',
    title: 'Soccer Practice',
    date: '2024-03-15',
    time: '15:30',
    location: 'Central Park',
    notes: 'Bring water bottle',
    category: 'Sports'
  },
  {
    id: '2',
    title: 'School Pickup',
    date: '2024-03-16',
    category: 'School'
  }
];

const ical = generateEventsIcal(events, 'Family Events');
```

### `generateCustodyIcal(custodySchedule, monthsToGenerate?)`

Converts custody schedule to iCal format with daily custody assignments.

**Parameters:**
- `custodySchedule` (Object) - Custody schedule configuration
- `monthsToGenerate` (Number, optional) - Number of months to generate. Default: 12

**Custody Schedule Object Structure:**
```javascript
{
  pattern: string,       // 'alternating-weeks' | '2-2-3' | 'weekday-weekend'
  startDate: string,     // ISO date: "YYYY-MM-DD" (when pattern begins)
  parent1Name: string,   // Name of first parent
  parent2Name: string    // Name of second parent
}
```

**Supported Patterns:**
- `alternating-weeks` - Each parent gets 1 week at a time
- `2-2-3` - Pattern: 2 days parent1, 2 days parent2, 3 days parent1 (7-day cycle)
- `weekday-weekend` - Parent1 has weekdays, Parent2 has weekends

**Returns:**
- (String) - iCal formatted string with custody periods as all-day events

**Example:**
```javascript
const custody = {
  pattern: 'alternating-weeks',
  startDate: '2024-01-01',
  parent1Name: 'Mom',
  parent2Name: 'Dad'
};

const ical = generateCustodyIcal(custody, 12);
```

**Generated Event Format:**
```
Title: 📅 With Mom
Description: Custody with Mom
Start: 2024-01-01
End: 2024-01-07
```

### `downloadIcalFile(icalContent, filename?)`

Triggers a browser download of iCal file.

**Parameters:**
- `icalContent` (String) - iCal formatted string
- `filename` (String, optional) - Download filename. Default: "calendar.ics"

**Returns:**
- (void)

**Example:**
```javascript
const ical = generateEventsIcal(events, 'Family Events');
downloadIcalFile(ical, 'family-events.ics');
// File downloads to Downloads folder
```

**File MIME Type:**
- `text/calendar;charset=utf-8`

### `copyIcalToClipboard(icalContent)`

Copies iCal content to system clipboard for pasting.

**Parameters:**
- `icalContent` (String) - iCal formatted string

**Returns:**
- (Promise<Boolean>) - true if successful, false if failed

**Example:**
```javascript
const ical = generateEventsIcal(events);
const success = await copyIcalToClipboard(ical);

if (success) {
  console.log('Calendar copied! Paste it in your calendar app.');
} else {
  console.log('Failed to copy. Try downloading instead.');
}
```

**Note:** Clipboard access requires user permission and may be denied on some browsers.

## iCal Format Details

### Generated iCal Properties

#### Calendar Properties
```
VERSION: 2.0
PRODID: -//HarmonyHub//Custody Scheduler//EN
CALSCALE: GREGORIAN
METHOD: PUBLISH
X-WR-CALNAME: [Calendar Name]
X-WR-TIMEZONE: UTC
DESCRIPTION: [Calendar Description]
```

#### Event Properties
```
BEGIN:VEVENT
UID: [Unique ID]
DTSTAMP: [Timestamp]
DTSTART: [Start DateTime or Date]
SUMMARY: [Event Title]
LOCATION: [Location] (optional)
DESCRIPTION: [Notes] (optional)
CATEGORIES: [Category] (optional)
TRANSP: OPAQUE (events block calendar time)
END:VEVENT
```

### Date/Time Formats

**Timed Events:**
- Format: `YYYYMMDDTHHMMSS`
- Example: `20240315T153000` = March 15, 2024 at 3:30 PM
- Property: `DTSTART:20240315T153000`

**All-Day Events:**
- Format: `YYYYMMDD`
- Example: `20240315` = March 15, 2024
- Property: `DTSTART;VALUE=DATE:20240315`

## Advanced Usage

### Combine Multiple Calendars

```javascript
const eventsIcal = generateEventsIcal(events, 'Family Events');
const custodyIcal = generateCustodyIcal(custody, 12);

// Combine by concatenating and merging VCALENDAR blocks
const combined = eventsIcal.slice(0, -15) + // Remove END:VCALENDAR
                 custodyIcal.slice(80); // Skip BEGIN:VCALENDAR through X headers
```

### Generate Dynamic Filenames

```javascript
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const filename = `family-calendar-${today}.ics`;
downloadIcalFile(icalContent, filename);
// Creates: family-calendar-2024-03-15.ics
```

### Error Handling

```javascript
try {
  const ical = generateEventsIcal(events);
  const success = await copyIcalToClipboard(ical);

  if (!success) {
    // Fallback to download
    downloadIcalFile(ical, 'backup.ics');
  }
} catch (error) {
  console.error('Export failed:', error);
  alert('Failed to export calendar. Please try again.');
}
```

### Stream Large Calendars

```javascript
// For very large event sets, generate progressively
const chunk1 = generateEventsIcal(events.slice(0, 500));
const chunk2 = generateEventsIcal(events.slice(500, 1000));

// Merge chunks
downloadIcalFile(chunk1 + chunk2, 'large-calendar.ics');
```

## Validation & Constraints

### Supported Event Fields
- ✅ Title (required)
- ✅ Date (required)
- ✅ Time (optional, 24-hour format)
- ✅ Location
- ✅ Notes/Description
- ✅ Category
- ⚠️ Recurrence (not currently supported)
- ⚠️ Reminders/Alarms (not currently supported)
- ⚠️ Attendees (not currently supported)

### Data Limitations
- Max title length: 1000 characters (no hard limit, but recommended)
- Special characters: Automatically escaped
- Date range: Past and future dates supported
- Timezone: All events use UTC

### File Size Limits
- Typical event: 300-500 bytes
- 1000 events: ~500 KB
- Browser download limit: Usually 2GB+ (browser dependent)

## Integration Examples

### React Component

```javascript
import { useState } from 'react';
import { generateEventsIcal, downloadIcalFile } from './services/CalendarExportService';

function ExportButton({ events }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const ical = generateEventsIcal(events);
      downloadIcalFile(ical, 'events.ics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? 'Exporting...' : 'Export to Calendar'}
    </button>
  );
}
```

### Standalone Usage

```javascript
// Node.js / React Native
const { generateEventsIcal } = require('./services/CalendarExportService');

const events = [...];
const ical = generateEventsIcal(events);

// Write to file
const fs = require('fs');
fs.writeFileSync('calendar.ics', ical);
```

## Testing

### Unit Test Example

```javascript
import { generateEventsIcal } from './services/CalendarExportService';

describe('Calendar Export Service', () => {
  it('should generate valid iCal from events', () => {
    const events = [{
      id: '1',
      title: 'Test Event',
      date: '2024-03-15',
      time: '14:00'
    }];

    const ical = generateEventsIcal(events);

    expect(ical).toContain('BEGIN:VCALENDAR');
    expect(ical).toContain('END:VCALENDAR');
    expect(ical).toContain('Test Event');
    expect(ical).toContain('20240315T140000');
  });

  it('should handle special characters', () => {
    const events = [{
      id: '1',
      title: 'Event with "quotes" & symbols',
      date: '2024-03-15',
      notes: 'Notes with, semicolons; and\nnewlines'
    }];

    const ical = generateEventsIcal(events);

    expect(ical).toContain('Event with \\"quotes\\"');
    expect(ical).toContain('\\n'); // Escaped newline
  });
});
```

## Compatibility

### Calendar Applications
- ✅ Google Calendar
- ✅ Apple Calendar / iCal
- ✅ Microsoft Outlook
- ✅ Mozilla Thunderbird
- ✅ Evolution (GNOME)
- ✅ Nextcloud Calendar
- ✅ Rocket.Chat
- ✅ Slack
- ✅ Zoom

### Browsers
- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

### Constraints
- Clipboard API may require HTTPS
- File download may be blocked in sandboxed contexts
- Some mobile browsers may not support direct downloads

## Troubleshooting

### Empty Calendar Exports
```javascript
// Ensure events array is not empty
if (events.length === 0) {
  console.warn('No events to export');
  return;
}
```

### Special Characters Not Displaying
```javascript
// Verify encoding in downloaded file
// Should be UTF-8 with proper escaping
// Check calendar app's import settings
```

### Custody Schedule Not Generating
```javascript
// Verify custodySchedule object has required fields
const isValid = custody.pattern &&
                custody.startDate &&
                custody.parent1Name &&
                custody.parent2Name;
```

## License
These utilities are part of HarmonyHub and follow the same license as the main project.

## Support
For issues or feature requests related to calendar export, please refer to the main project documentation or contact support.
