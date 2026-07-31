function pad(n) { return String(n).padStart(2, '0'); }

function toICSDate(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (timeStr) {
    const [h, min] = timeStr.split(':').map(Number);
    return `${y}${pad(m)}${pad(d)}T${pad(h)}${pad(min)}00`;
  }
  return `${y}${pad(m)}${pad(d)}`;
}

function escapeICS(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function exportToICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kinnect//Family Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach(event => {
    const uid = `${event.id}@kinnect`;
    const dtstart = toICSDate(event.date, event.time);
    const isAllDay = !event.time;

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`SUMMARY:${escapeICS(event.title)}`);

    if (isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${dtstart}`);
      // All day end = next day
      const [y, m, d] = event.date.split('-').map(Number);
      const next = new Date(y, m - 1, d + 1);
      lines.push(`DTEND;VALUE=DATE:${next.getFullYear()}${pad(next.getMonth()+1)}${pad(next.getDate())}`);
    } else {
      lines.push(`DTSTART:${dtstart}`);
      // Default 1 hour duration
      const [y, m, d] = event.date.split('-').map(Number);
      const [h, min] = event.time.split(':').map(Number);
      const end = new Date(y, m - 1, d, h + 1, min);
      lines.push(`DTEND:${end.getFullYear()}${pad(end.getMonth()+1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`);
    }

    if (event.location) lines.push(`LOCATION:${escapeICS(event.location)}`);
    if (event.notes) lines.push(`DESCRIPTION:${escapeICS(event.notes)}`);
    lines.push(`CATEGORIES:${escapeICS(event.category)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kinnect-schedule.ics';
  a.click();
  URL.revokeObjectURL(url);
}
