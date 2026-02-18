# Event Search & Filtering Feature

## Overview

Added comprehensive search and filtering functionality to the Parent Dashboard, allowing parents to quickly find events using multiple filters and search options.

## Features Added

### 1. **Search by Title or Location** 🔍
- Real-time text search as you type
- Searches both event titles and locations
- Clear button appears when text is entered
- Case-insensitive search

### 2. **Category Filter** 📂
- Quick filter buttons for all 6 event categories:
  - School (📚)
  - Sports (⚽)
  - Medical (🏥)
  - Activities (🎨)
  - Family (👨‍👩‍👧)
  - Other (📌)
- "All" button to show all categories
- Click to toggle category on/off
- Visual highlight shows active filter

### 3. **Date Range Filter** 📅
- From date picker
- To date picker
- Filter events within a specific date range
- Optional (leave blank to show all dates)

### 4. **Sort Options** 📊
- Sort by Date (default, chronological)
- Sort by Title (alphabetical)
- Sort by Category (category name alphabetical)
- Dropdown selection

### 5. **Clear Filters Button** 🔄
- Resets all filters to default state
- Only appears when at least one filter is active
- Clears search, category, date range, and sort

### 6. **Results Summary** 📈
- Shows "Showing X of Y events"
- Helps users understand how many events match filters
- Updates in real-time as filters change

### 7. **No Results State** 🔍
- Special empty state when no events match filters
- Helpful message: "No events match your filters. Try adjusting your search or filters."
- Distinguishes from "no events added" state

## How to Use

### Search for an Event
1. Go to Parent Dashboard
2. In the "Search & Filter Events" section, type in the search box
3. Results update in real-time as you type
4. Click the "Clear" button next to search to remove

### Filter by Category
1. Click the category button you want (e.g., "Sports")
2. Only events in that category will show
3. Click "All" to show all categories again
4. Click the same button again to deselect it

### Filter by Date Range
1. Click the "From Date" field and select a start date
2. Click the "To Date" field and select an end date
3. Only events between those dates will show
4. Leave either field blank to not filter by that end

### Sort Events
1. Click the "Sort by" dropdown
2. Choose: Date, Title, or Category
3. Events re-order immediately
4. Default is by Date (soonest first)

### Clear All Filters
1. When any filter is active, "Clear All Filters" button appears
2. Click it to reset all search, category, date, and sort settings
3. All events appear in default order

## Technical Implementation

### Code Location
- **File Modified:** `src/pages/ParentDashboard.js`

### State Variables Added
```javascript
const [searchTerm, setSearchTerm] = useState('');
const [filterCategory, setFilterCategory] = useState('');
const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
const [sortBy, setSortBy] = useState('date');
```

### Function Added
```javascript
getFilteredAndSortedEvents()
```
- Applies all filters to events array
- Returns filtered and sorted results
- Client-side only (no Firebase queries)

### Performance Characteristics
- **Time Complexity:** O(n) per filter change (where n = number of events)
- **Space Complexity:** O(n) for filtered results array
- **No Firebase Impact:** All filtering happens client-side on already-loaded events
- **Real-time Updates:** Filters apply instantly as user types/clicks

### Data Flow
```
events (from Firebase)
    ↓
[Search Filter] → Search by title/location
    ↓
[Category Filter] → Filter by selected category
    ↓
[Date Range Filter] → Filter by start/end dates
    ↓
[Sort] → Sort by date/title/category
    ↓
filteredEvents (displayed to user)
```

## UI/UX Details

### Search Box
- Placeholder: "Search by title or location..."
- Full-width input
- Clear button appears only when text is entered
- Updates results on every keystroke

### Category Buttons
- 6 category buttons + 1 "All" button
- Active button: Blue background (#667eea) with white text
- Inactive button: White background with blue border
- Toggle behavior (click to select, click again to deselect)

### Date Inputs
- HTML5 date picker inputs
- Shows calendar picker on click (browser-native)
- Returns YYYY-MM-DD format
- Both fields optional

### Sort Dropdown
- HTML5 select element
- Options: Date, Title, Category
- Default: Date

### Results Counter
- Text: "Showing X of Y events"
- Color: #888 (light gray)
- Updates in real-time
- Helpful for understanding filter impact

### Clear Filters Button
- Only appears when at least one filter is active
- Checks: searchTerm, filterCategory, filterDateRange (start/end), sortBy !== 'date'
- Resets all four state variables to defaults

## Filtering Logic Details

### Search (Case-Insensitive)
```javascript
if (searchTerm) {
  const term = searchTerm.toLowerCase();
  filtered = filtered.filter(event =>
    event.title.toLowerCase().includes(term) ||
    (event.location && event.location.toLowerCase().includes(term))
  );
}
```
- Searches title and location fields
- Partial matches (substring search)
- Case-insensitive

### Category Filter
```javascript
if (filterCategory) {
  filtered = filtered.filter(event => event.category === filterCategory);
}
```
- Exact match to category name
- Empty string = no filter (show all)

### Date Range Filter
```javascript
if (filterDateRange.start) {
  filtered = filtered.filter(event => event.date >= filterDateRange.start);
}
if (filterDateRange.end) {
  filtered = filtered.filter(event => event.date <= filterDateRange.end);
}
```
- Inclusive on both ends (>=, <=)
- YYYY-MM-DD string comparison works correctly
- Both optional

### Sorting
```javascript
switch (sortBy) {
  case 'title':
    return a.title.localeCompare(b.title);
  case 'category':
    return a.category.localeCompare(b.category);
  case 'date':
  default:
    return new Date(a.date) - new Date(b.date);
}
```
- Date: chronological (oldest first)
- Title: alphabetical (A-Z)
- Category: alphabetical (A-Z)

## Testing Checklist

- [x] Search by event title
- [x] Search by location
- [x] Clear search with button
- [x] Filter by each category
- [x] Filter by date range
- [x] Combine multiple filters
- [x] Sort by date
- [x] Sort by title
- [x] Sort by category
- [x] Clear all filters button works
- [x] Results counter updates
- [x] No results state displays
- [x] Filters hide when no events exist
- [x] Real-time updates as user types

## Examples

### Example 1: Find Soccer Practice
1. User types "soccer" in search box
2. Only events with "soccer" in title show
3. Results instantly update
4. User can see which day soccer practice is

### Example 2: View All Medical Appointments
1. User clicks "Medical" category button
2. Only events with category "Medical" show
3. All other events are hidden
4. Results counter shows: "Showing 3 of 28 events"

### Example 3: Find Events This Month
1. User selects "From Date": March 1, 2024
2. User selects "To Date": March 31, 2024
3. Only events in March show
4. Helps plan ahead for the month

### Example 4: Find Sports Events in April
1. User clicks "Sports" category
2. User selects "From Date": April 1, 2024
3. User selects "To Date": April 30, 2024
4. Only sports events in April show
5. Results: "Showing 5 of 28 events"

### Example 5: Sort Events by Title
1. User clicks Sort dropdown
2. Selects "Title"
3. Events reorder alphabetically by name
4. Helpful for finding specific event by name

## Styling & Design

### Colors
- Primary: #667eea (blue) - active filter buttons, selected state
- Secondary: #4facfe (light blue) - borders
- Background: white for filter section
- Text: #333 (dark) for labels, #666 for descriptions

### Spacing
- Outer padding: 24px
- Gap between elements: 12-16px
- Margin bottom on sections: 16px
- Input height: 40px (12px padding + 16px font)
- Button height: 34px (8px padding + 14px font + border)

### Responsive Design
- Filter section uses grid for date inputs (2 columns on desktop)
- Wrapping layout for category buttons (flex wrap)
- Full-width search input
- Buttons stack on small screens

## Browser Compatibility
- ✅ Chrome/Edge (fully supported)
- ✅ Firefox (fully supported)
- ✅ Safari (fully supported)
- ✅ HTML5 date picker support (graceful fallback)

## Future Enhancements
- Advanced search (AND/OR logic)
- Search history
- Saved filter presets
- Recurring event templates
- Smart suggestions
- Advanced date range (weekends only, specific months, etc.)

## Known Limitations
- Filtering is case-insensitive for search (not for category names)
- No regex support in search (simple substring matching)
- Date format must be YYYY-MM-DD
- Cannot search event descriptions/notes (only title and location)
- Sort is limited to 3 options (extensible for future)

## Performance Notes
- All filtering is O(n) where n = number of events
- No impact on Firebase queries (client-side only)
- Suitable for 1000+ events without noticeable lag
- Consider virtual scrolling if 10,000+ events needed

## Accessibility
- Search input has descriptive placeholder
- All buttons have clear labels
- Date inputs use native HTML5 date picker
- Color not the only indicator (text labels used)
- Keyboard accessible (Tab, Enter, Space work)

---

**Status:** ✅ Complete and tested
**Lines of Code:** ~380 (all in ParentDashboard.js)
**Dependencies Added:** None
**Breaking Changes:** None
