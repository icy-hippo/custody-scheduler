import {
  formatDateKey,
  getCustodyStatus,
  getNextEvent,
  getParentForDate,
} from './utils/custodySchedule';

const schedule = {
  pattern: '2-2-3',
  startDate: '2026-06-22',
  parent1Name: 'Mom',
  parent2Name: 'Dad',
};

test('calculates 2-2-3 custody days consistently', () => {
  expect(getParentForDate(schedule, '2026-06-22')).toBe('Mom');
  expect(getParentForDate(schedule, '2026-06-23')).toBe('Mom');
  expect(getParentForDate(schedule, '2026-06-24')).toBe('Dad');
  expect(getParentForDate(schedule, '2026-06-26')).toBe('Mom');
});

test('finds the next transition for a child-friendly countdown', () => {
  const status = getCustodyStatus(schedule, '2026-06-24');

  expect(status.currentParent).toBe('Dad');
  expect(status.nextParent).toBe('Mom');
  expect(status.daysUntilTransition).toBe(2);
  expect(formatDateKey(status.transitionDate)).toBe('2026-06-26');
});

test('ignores past timed events when finding what is next', () => {
  const next = getNextEvent([
    { title: 'Breakfast', date: '2026-06-24', time: '07:30' },
    { title: 'Therapy', date: '2026-06-24', time: '15:00' },
    { title: 'School', date: '2026-06-25', time: '08:00' },
  ], new Date(2026, 5, 24, 12, 0));

  expect(next.title).toBe('Therapy');
});
