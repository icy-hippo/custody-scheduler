/**
 * Calendar Export Service
 * Generates iCal (.ics) format files for events and custody schedules
 */

// Generate a unique UID for each event
const generateUID = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@harmonyhub.local`;
};

// Format date/time for iCal format (YYYYMMDDTHHMMSS)
const formatDateTimeForIcal = (dateString, timeString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (timeString) {
    const [hours, minutes] = timeString.split(':');
    return `${year}${month}${day}T${hours}${minutes}00`;
  }

  // All-day event format
  return `${year}${month}${day}`;
};

// Format date for iCal (YYYYMMDD) - all-day format
const formatDateForIcal = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

// Escape special characters in iCal text
const escapeIcalText = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
};

/**
 * Export events to iCal format
 * @param {Array} events - Array of event objects
 * @param {String} familyName - Name of the family
 * @returns {String} iCal formatted string
 */
export const generateEventsIcal = (events, familyName = 'Family Schedule') => {
  const now = new Date();
  const dtstamp = formatDateTimeForIcal(now.toISOString().split('T')[0], `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HarmonyHub//Custody Scheduler//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeIcalText(familyName)}
X-WR-TIMEZONE:UTC
DESCRIPTION:Custody and Family Schedule
`;

  events.forEach(event => {
    const eventStart = formatDateTimeForIcal(event.date, event.time);

    // For all-day events or events without time
    const dateTypeValue = event.time ? eventStart : formatDateForIcal(event.date);
    const dateTypeName = event.time ? 'DTSTART' : 'DTSTART;VALUE=DATE';

    ical += `BEGIN:VEVENT
UID:${generateUID()}
DTSTAMP:${dtstamp}
DTSTART${event.time ? '' : ';VALUE=DATE'}:${dateTypeValue}
SUMMARY:${escapeIcalText(event.title)}`;

    if (event.location) {
      ical += `\nLOCATION:${escapeIcalText(event.location)}`;
    }

    if (event.notes) {
      ical += `\nDESCRIPTION:${escapeIcalText(event.notes)}`;
    }

    if (event.category) {
      ical += `\nCATEGORIES:${escapeIcalText(event.category)}`;
    }

    ical += `\nEND:VEVENT\n`;
  });

  ical += `END:VCALENDAR`;

  return ical;
};

/**
 * Export custody schedule to iCal format
 * @param {Object} custodySchedule - Custody schedule object with pattern, startDate, parent1Name, parent2Name
 * @param {Number} monthsToGenerate - How many months to generate (default: 12)
 * @returns {String} iCal formatted string
 */
export const generateCustodyIcal = (custodySchedule, monthsToGenerate = 12) => {
  if (!custodySchedule) return '';

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;
  const now = new Date();
  const dtstamp = formatDateTimeForIcal(now.toISOString().split('T')[0], `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);

  let ical = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//HarmonyHub//Custody Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Custody Schedule
X-WR-TIMEZONE:UTC
DESCRIPTION:Custody Schedule
`;

  // Generate events for custody schedule
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setMonth(endDateObj.getMonth() + monthsToGenerate);

  // Helper to determine parent for date
  const getParentForDate = (date) => {
    const start = new Date(startDate);
    const daysDiff = Math.floor((date - start) / (1000 * 60 * 60 * 24));

    if (pattern === 'alternating-weeks') {
      const weekNumber = Math.floor(daysDiff / 7);
      return weekNumber % 2 === 0 ? parent1Name : parent2Name;
    } else if (pattern === '2-2-3') {
      const cycle = daysDiff % 7;
      if (cycle < 2) return parent1Name;
      if (cycle < 4) return parent2Name;
      return parent1Name;
    } else if (pattern === 'weekday-weekend') {
      const dayOfWeek = date.getDay();
      return (dayOfWeek === 0 || dayOfWeek === 6) ? parent2Name : parent1Name;
    }
    return parent1Name;
  };

  // Generate custody events (one per day)
  let currentDate = new Date(startDateObj);
  let lastParent = null;
  let eventStartDate = null;

  while (currentDate < endDateObj) {
    const currentParent = getParentForDate(currentDate);

    if (currentParent !== lastParent) {
      // Parent changed, create event for the previous period
      if (lastParent && eventStartDate) {
        const eventDateStr = formatDateForIcal(eventStartDate.toISOString().split('T')[0]);
        const daysUntilNow = Math.floor((currentDate - eventStartDate) / (1000 * 60 * 60 * 24));

        ical += `BEGIN:VEVENT
UID:${generateUID()}
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${eventDateStr}
DTEND;VALUE=DATE:${formatDateForIcal(new Date(currentDate.getTime() - 86400000).toISOString().split('T')[0])}
SUMMARY:${escapeIcalText(`📅 With ${lastParent}`)}
DESCRIPTION:Custody with ${lastParent}
TRANSP:TRANSPARENT
END:VEVENT\n`;
      }

      lastParent = currentParent;
      eventStartDate = new Date(currentDate);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Add final event
  if (lastParent && eventStartDate) {
    const eventDateStr = formatDateForIcal(eventStartDate.toISOString().split('T')[0]);
    const lastDayStr = formatDateForIcal(new Date(currentDate.getTime() - 86400000).toISOString().split('T')[0]);

    ical += `BEGIN:VEVENT
UID:${generateUID()}
DTSTAMP:${dtstamp}
DTSTART;VALUE=DATE:${eventDateStr}
DTEND;VALUE=DATE:${lastDayStr}
SUMMARY:${escapeIcalText(`📅 With ${lastParent}`)}
DESCRIPTION:Custody with ${lastParent}
TRANSP:TRANSPARENT
END:VEVENT\n`;
  }

  ical += `END:VCALENDAR`;

  return ical;
};

/**
 * Download iCal file
 * @param {String} icalContent - The iCal formatted string
 * @param {String} filename - Name of the file to download
 */
export const downloadIcalFile = (icalContent, filename = 'calendar.ics') => {
  const element = document.createElement('a');
  const file = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
};

/**
 * Copy iCal content to clipboard
 * @param {String} icalContent - The iCal formatted string
 */
export const copyIcalToClipboard = async (icalContent) => {
  try {
    await navigator.clipboard.writeText(icalContent);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
};
