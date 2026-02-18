# Calendar Export Feature

## Overview
Added iCal (.ics) calendar export functionality to the custody-scheduler. This allows users to export their family events and custody schedules to any calendar application that supports the iCal format.

## Features Added

### 1. CalendarExportService (`src/services/CalendarExportService.js`)
A utility service that handles all calendar export logic:

- **`generateEventsIcal(events, familyName)`**
  - Converts family events to iCal format
  - Supports events with/without times (all-day events)
  - Includes title, date, time, location, notes, and category
  - Generates proper iCal-compliant UUIDs and timestamps

- **`generateCustodyIcal(custodySchedule, monthsToGenerate)`**
  - Converts custody schedule to iCal format
  - Generates 12 months of custody events by default
  - Supports all custody patterns:
    - Alternating weeks
    - 2-2-3 schedule
    - Weekday/weekend split
  - Creates continuous events showing which parent has custody

- **`downloadIcalFile(icalContent, filename)`**
  - Downloads iCal content as .ics file
  - Browser-compatible file download

- **`copyIcalToClipboard(icalContent)`**
  - Copies iCal content to clipboard
  - Users can paste directly into calendar apps

### 2. CalendarExport Component (`src/components/CalendarExport.js`)
A modal dialog UI component for exporting calendars:

- **Export Options:**
  - 📅 Family Events - Export all family events
  - 🏠 Custody Schedule - Export 12-month custody schedule
  - ✨ Complete Calendar - Export both together

- **Actions:**
  - Download as .ics file
  - Copy to clipboard for pasting

- **Built-in Instructions:**
  - Google Calendar
  - Apple Calendar
  - Outlook
  - Manual paste method

### 3. ParentDashboard Integration
- Added "📥 Export Calendar" button to the action bar
- Button opens modal with export options
- Seamlessly integrates with existing UI

## Supported Calendar Applications

### Direct Import
- **Google Calendar** - Settings → Calendars → Import & Export
- **Apple Calendar** - Double-click .ics file to import
- **Microsoft Outlook** - File → Open & Export → Import
- **Microsoft Teams** - Sync with Outlook
- **Zoom** - Calendar integration with Outlook/Google
- **Slack** - Calendar syncing
- **iCloud** - Via Apple Calendar

### Paste/Manual Entry
- Any calendar app that accepts iCal text
- Copy to clipboard and paste into online calendar apps

## Implementation Details

### iCal Format Compliance
- RFC 5545 compliant iCal format
- Proper timezone handling (UTC)
- Special character escaping
- Unique UIDs for each event
- Timestamps for reliability

### Features
- **All-day Events**: Properly formatted for events without specific times
- **Event Properties**: Title, date, time, location, description, categories
- **Custody Patterns**: Intelligently generates continuous custody events
- **Export Flexibility**: Download individual exports or combined calendar

### File Naming Convention
- Events: `family-events-YYYY-MM-DD.ics`
- Custody: `custody-schedule-YYYY-MM-DD.ics`
- Combined: `harmonyhub-calendar-YYYY-MM-DD.ics`

## Code Structure

```
src/
├── services/
│   └── CalendarExportService.js (NEW)
│       ├── generateEventsIcal()
│       ├── generateCustodyIcal()
│       ├── downloadIcalFile()
│       └── copyIcalToClipboard()
│
├── components/
│   └── CalendarExport.js (NEW)
│       └── Modal export UI with options
│
└── pages/
    └── ParentDashboard.js (UPDATED)
        └── Added export button and component import
```

## Usage

### For Users

1. **Export Family Events:**
   - Click "📥 Export Calendar" button
   - Select "📅 Family Events"
   - Choose "Download" or "Copy"
   - Import into preferred calendar app

2. **Export Custody Schedule:**
   - Click "📥 Export Calendar" button
   - Select "🏠 Custody Schedule"
   - Choose "Download" or "Copy"
   - Follow app-specific import instructions

3. **Export Everything:**
   - Click "📥 Export Calendar" button
   - Select "✨ Complete Calendar"
   - Download both events and schedule at once

### For Developers

```javascript
// Import the service
import { generateEventsIcal, downloadIcalFile } from '../services/CalendarExportService';

// Generate iCal content
const icalContent = generateEventsIcal(eventsArray, 'My Family');

// Download file
downloadIcalFile(icalContent, 'my-calendar.ics');

// Or copy to clipboard
import { copyIcalToClipboard } from '../services/CalendarExportService';
copyIcalToClipboard(icalContent);
```

## Testing Recommendations

1. **Event Export:**
   - Create events with different categories
   - Test all-day events (no time)
   - Test timed events
   - Test with special characters in titles/notes
   - Export and verify in Google Calendar, Outlook, Apple Calendar

2. **Custody Schedule Export:**
   - Test each custody pattern (alternating-weeks, 2-2-3, weekday-weekend)
   - Verify generated events span 12 months
   - Check custody transitions happen on correct dates
   - Import and verify visual in calendar app

3. **Edge Cases:**
   - Large number of events
   - Very long event notes/descriptions
   - Special characters and emojis in titles
   - Different timezone configurations
   - Mobile browser file downloads

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (may open file dialog instead of downloading)
- Mobile: May vary by browser and OS

## Future Enhancements
- Custom export date ranges
- Recurring event templates
- Color coding in calendar apps
- Subscription URLs (auto-updating calendars)
- Email digest option
- Integration with specific calendar services
- Export to other formats (Google Calendar .ics, ICS with alarms)

## Notes
- iCal format is universally supported by calendar applications
- Files are generated client-side (no server needed)
- No user data is sent to external services
- Timestamp is set to UTC for consistency across timezones
- Custody schedule generates placeholder events with day-level granularity
