export const ROUTINE_CARDS = [
  {
    id: 'morning',
    title: 'Morning',
    icon: 'Sun',
    steps: ['Get dressed', 'Eat breakfast', 'Brush teeth', 'Grab backpack'],
  },
  {
    id: 'school',
    title: 'School',
    icon: 'School',
    steps: ['Arrive', 'Class time', 'Lunch', 'Go home'],
  },
  {
    id: 'transition',
    title: 'Transition',
    icon: 'Bag',
    steps: ['Check schedule', 'Pack comfort items', 'Say goodbye', 'Ride to next home'],
  },
  {
    id: 'bedtime',
    title: 'Bedtime',
    icon: 'Moon',
    steps: ['Pajamas', 'Brush teeth', 'Quiet time', 'Sleep'],
  },
  {
    id: 'appointment',
    title: 'Appointment',
    icon: 'Care',
    steps: ['Arrive', 'Wait', 'Meet helper', 'Go back to routine'],
  },
];

export const SENSORY_PACKING_ITEMS = [
  { id: 'headphones', name: 'Headphones or ear defenders', icon: 'Quiet' },
  { id: 'comfort-item', name: 'Comfort item', icon: 'Comfort' },
  { id: 'charger', name: 'Device charger', icon: 'Power' },
  { id: 'meds', name: 'Medicine or care items', icon: 'Meds' },
  { id: 'favorite-clothing', name: 'Favorite clothing', icon: 'Clothes' },
  { id: 'weighted-item', name: 'Weighted item', icon: 'Heavy' },
  { id: 'safe-food', name: 'Safe snack or food reminder', icon: 'Snack' },
  { id: 'visual-card', name: 'Visual card or AAC tool', icon: 'AAC' },
];

export const DEFAULT_VISUAL_LABELS = [
  { id: 'mom-house', label: "Mom's house", type: 'Home', color: '#f7b2bd', symbol: 'Home 1' },
  { id: 'dad-house', label: "Dad's house", type: 'Home', color: '#9bbcf9', symbol: 'Home 2' },
  { id: 'school', label: 'School', type: 'School', color: '#a8d5ba', symbol: 'School' },
  { id: 'doctor', label: 'Doctor', type: 'Care', color: '#b8d8f8', symbol: 'Doctor' },
  { id: 'therapist', label: 'Therapist', type: 'Care', color: '#d4c2fc', symbol: 'Helper' },
  { id: 'activity', label: 'Activity', type: 'Activity', color: '#ffd6a5', symbol: 'Activity' },
  { id: 'comfort', label: 'Comfort item', type: 'Comfort', color: '#cde7be', symbol: 'Comfort' },
];

export function timestampToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
