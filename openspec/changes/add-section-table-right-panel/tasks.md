# Tasks: Add Section CSV Table Right Panel

## Phase 1: UI Structure & Layout

### 1.1 Update HTML structure
- [ ] Add right panel container (`<div class="csv-panel">`) to `static/index.html` next to details panel
- [ ] Add table header with column names in the right panel
- [ ] Add empty state message for when no items found
- [ ] Add loading indicator for table data

### 1.2 Update CSS for two-panel layout
- [ ] Modify `.main-container` to use flexbox with `flex-direction: row`
- [ ] Style `.details-panel` to take 40-50% width when section selected
- [ ] Style `.csv-panel` to take 50-60% width when section selected
- [ ] Add CSS for table styling (alternating row colors, borders, hover states)
- [ ] Add responsive media queries for mobile (stack vertically on < 768px)
- [ ] Hide `.csv-panel` by default, show when section selected

### 1.3 Test layout on different screen sizes
- [ ] Verify layout on desktop (1920px)
- [ ] Verify layout on tablet (768px)
- [ ] Verify layout on mobile (375px)
- [ ] Verify scroll behavior is independent for each panel

---

## Phase 2: Details Panel Cleanup

### 2.1 Modify left details panel to hide metadata
- [ ] Edit `static/js/tree-loader.js:showNodeDetails()` method
- [ ] Remove metadata display fields (ID, level, filename, doc_id)
- [ ] Keep title and content HTML only
- [ ] Maintain close button functionality

### 2.2 Simplify details panel CSS
- [ ] Remove styles for metadata list items
- [ ] Ensure content text is centered and readable
- [ ] Verify font sizes and line spacing

### 2.3 Test content display
- [ ] Click section node → verify content displays without metadata
- [ ] Click subsection → verify content displays cleanly
- [ ] Click terminal node → verify behavior unchanged

---

## Phase 3: CSV Table Implementation

### 3.1 Create CSV table renderer module
- [ ] Create `static/js/csv-table-renderer.js` with `CSVTableRenderer` class
- [ ] Implement `constructor(containerId, csvData)`
- [ ] Implement `renderTable(items)` method to build HTML table
- [ ] Implement `getSortedItems(columnName, direction)` for column sorting
- [ ] Implement `setEmptyState()` for no-results message
- [ ] Implement `setLoadingState()` for loading indicator

### 3.2 Add CSV filtering logic
- [ ] In `CSVTableRenderer`, add `filterBySectionId(sectionId)` method
- [ ] Extract section-related codes/keywords from section ID
- [ ] Filter CSV items by matching codes in the CSV data
- [ ] Handle edge cases (no matches, all sections, etc.)
- [ ] Document filtering logic in code comments

### 3.3 Integrate table into tree-loader
- [ ] Import `CSVTableRenderer` in `static/js/tree-loader.js`
- [ ] Instantiate table renderer during init
- [ ] Modify `showNodeDetails(node)` to:
  - Hide metadata in left panel (done in Phase 2)
  - Call `csvTableRenderer.renderTable(...)` for right panel
  - Pass filtered CSV items based on current section

### 3.4 Add table interactivity
- [ ] Implement column sorting (click header to sort A-Z or Z-A)
- [ ] Add sort indicator (▲/▼) in table headers
- [ ] Implement row highlighting on hover
- [ ] Handle click events for future expand/detail features

### 3.5 Test CSV table functionality
- [ ] Click section → verify CSV table appears with related items
- [ ] Switch sections → verify table updates correctly
- [ ] Empty section → verify "no items" message displays
- [ ] Click column header → verify sorting works
- [ ] Verify table scrolls independently from left panel

---

## Phase 4: Data Loading & Performance

### 4.1 Ensure CSV data is available
- [ ] Verify `csv-handler.js` loads CSV data during app init
- [ ] Check that CSV data is stored in global or module-level state
- [ ] Add logging to confirm data load success

### 4.2 Handle lazy-loaded CSV chunks
- [ ] If CSV uses pagination, load all relevant chunks before displaying table
- [ ] Show loading state while chunks are fetched
- [ ] Cache loaded chunks in memory

### 4.3 Performance testing
- [ ] Measure table render time for 100, 500, 1000+ items
- [ ] Test with full 42k CSV dataset if needed
- [ ] Optimize if render time exceeds 500ms (consider pagination)

### 4.4 Memory usage check
- [ ] Verify CSV data doesn't duplicate in memory
- [ ] Check for memory leaks on repeated section clicks

---

## Phase 5: Edge Cases & Polish

### 5.1 Handle missing or null data
- [ ] Gracefully handle sections with no CSV items
- [ ] Handle sections with no ID (root, CSV node itself)
- [ ] Handle missing CSV columns (use default values)

### 5.2 Accessibility & UX Polish
- [ ] Ensure table is keyboard navigable (Tab through rows)
- [ ] Add aria-labels to table headers for screen readers
- [ ] Verify text contrast meets WCAG standards
- [ ] Add tooltip on hover for column headers (explain what each column means)

### 5.3 User feedback
- [ ] Add count badge next to "CSV Items" header (e.g., "CSV Items (23)")
- [ ] Show brief help text explaining the section-to-CSV relationship
- [ ] Add visual indicator when switching sections (fade-in animation)

### 5.4 Final testing
- [ ] Functional test: click 5-10 different sections, verify tables are correct
- [ ] Regression test: verify existing tree navigation still works
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile testing on real devices if possible

---

## Phase 6: Documentation & Cleanup

### 6.1 Code documentation
- [ ] Add JSDoc comments to `CSVTableRenderer` class
- [ ] Document filtering algorithm and assumptions
- [ ] Add inline comments for complex logic

### 6.2 Update project documentation
- [ ] Add section to README explaining new two-panel layout
- [ ] Document CSV filtering rules and limitations
- [ ] Add screenshot of feature in action

### 6.3 Git cleanup
- [ ] Review all changes for console.log statements (remove debug logs)
- [ ] Ensure no commented-out code left behind
- [ ] Format code with project standards (ESLint if applicable)

---

## Validation Checklist

Before marking complete, verify:
- [ ] All HTML structure added without breaking existing markup
- [ ] Layout responsive on all screen sizes
- [ ] Left panel shows only content (no metadata)
- [ ] Right panel shows CSV table with correct columns
- [ ] Table sorts correctly on column click
- [ ] Switching sections updates both panels
- [ ] Empty states display appropriately
- [ ] No console errors in DevTools
- [ ] Page performance acceptable (<2s load time)
- [ ] Works in all supported browsers
