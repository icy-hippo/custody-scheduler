export const DAY_MS = 24 * 60 * 60 * 1000;

export function parseLocalDate(value) {
  if (!value) return null;
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === 'string') {
    const [year, month, day] = value.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }

  const fallback = new Date(value);
  if (Number.isNaN(fallback.getTime())) return null;
  return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
}

export function formatDateKey(value) {
  const date = parseLocalDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(value, amount) {
  const date = parseLocalDate(value);
  if (!date) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function getDayDiff(fromValue, toValue) {
  const from = parseLocalDate(fromValue);
  const to = parseLocalDate(toValue);
  if (!from || !to) return 0;
  return Math.floor((to - from) / DAY_MS);
}

function normalizedModulo(value, divisor) {
  return ((value % divisor) + divisor) % divisor;
}

export function getParentForDate(custodySchedule, value = new Date()) {
  if (!custodySchedule) return null;

  const { pattern, startDate, parent1Name, parent2Name } = custodySchedule;
  const date = parseLocalDate(value);
  const start = parseLocalDate(startDate);
  if (!date || !start) return null;

  const firstParent = parent1Name || 'Parent 1';
  const secondParent = parent2Name || 'Parent 2';
  const daysDiff = getDayDiff(start, date);

  if (pattern === 'alternating-weeks') {
    const weekNumber = Math.floor(daysDiff / 7);
    return weekNumber % 2 === 0 ? firstParent : secondParent;
  }

  if (pattern === '2-2-3') {
    const cycle = normalizedModulo(daysDiff, 7);
    if (cycle < 2) return firstParent;
    if (cycle < 4) return secondParent;
    return firstParent;
  }

  if (pattern === 'weekday-weekend') {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? secondParent : firstParent;
  }

  return firstParent;
}

export function getCustodyStatus(custodySchedule, value = new Date()) {
  if (!custodySchedule) {
    return {
      currentParent: null,
      nextParent: null,
      daysUntilTransition: null,
      transitionDate: null,
      transitionDateKey: '',
    };
  }

  const today = parseLocalDate(value);
  const currentParent = getParentForDate(custodySchedule, today);
  let transitionDate = null;
  let nextParent = null;

  for (let offset = 1; offset <= 60; offset += 1) {
    const checkDate = addDays(today, offset);
    const checkParent = getParentForDate(custodySchedule, checkDate);
    if (checkParent && checkParent !== currentParent) {
      transitionDate = checkDate;
      nextParent = checkParent;
      break;
    }
  }

  return {
    currentParent,
    nextParent,
    daysUntilTransition: transitionDate ? getDayDiff(today, transitionDate) : null,
    transitionDate,
    transitionDateKey: transitionDate ? formatDateKey(transitionDate) : '',
  };
}

export function isEventUpcoming(event, nowValue = new Date()) {
  if (!event?.date) return false;

  const now = nowValue instanceof Date ? nowValue : new Date(nowValue);
  const eventDate = parseLocalDate(event.date);
  if (!eventDate) return false;

  if (!event.time) {
    return eventDate >= parseLocalDate(now);
  }

  const [hours, minutes] = event.time.split(':').map(Number);
  const eventDateTime = new Date(eventDate);
  eventDateTime.setHours(hours || 0, minutes || 0, 0, 0);
  return eventDateTime >= now;
}

export function getTodayEvents(events = [], todayValue = new Date()) {
  const todayKey = formatDateKey(todayValue);
  return events.filter(event => event.date === todayKey);
}

export function getNextEvent(events = [], nowValue = new Date()) {
  return [...events]
    .filter(event => isEventUpcoming(event, nowValue))
    .sort((a, b) => {
      const aTime = `${a.date}T${a.time || '23:59'}`;
      const bTime = `${b.date}T${b.time || '23:59'}`;
      return aTime.localeCompare(bTime);
    })[0] || null;
}

export function getEventsForDate(events = [], value) {
  const dateKey = formatDateKey(value);
  return events.filter(event => event.date === dateKey);
}

export function getUpcomingDays(custodySchedule, events = [], dayCount = 7, startValue = new Date()) {
  const start = parseLocalDate(startValue);

  return Array.from({ length: dayCount }, (_, index) => {
    const date = addDays(start, index);
    return {
      date,
      dateKey: formatDateKey(date),
      parent: getParentForDate(custodySchedule, date),
      events: getEventsForDate(events, date),
      isToday: index === 0,
    };
  });
}

export function formatFriendlyDate(value, todayValue = new Date()) {
  const date = parseLocalDate(value);
  if (!date) return '';

  const today = parseLocalDate(todayValue);
  const tomorrow = addDays(today, 1);

  if (formatDateKey(date) === formatDateKey(today)) return 'Today';
  if (formatDateKey(date) === formatDateKey(tomorrow)) return 'Tomorrow';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatFriendlyTime(timeString) {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  const hour = Number(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
