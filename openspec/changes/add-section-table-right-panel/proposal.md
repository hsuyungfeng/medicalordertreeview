# Change: Add section CSV table display in right panel

## Why
Currently, when users click on a section node in the left tree, the right details panel displays document metadata (ID, level, filename) alongside content. This clutters the interface with technical information that most users don't need. Users need to quickly see which CSV items (診療項目) are associated with the current section for reference, comparison, and export purposes.

By separating concerns:
- **Left panel** shows only document content and text explanations
- **Right panel** displays related CSV items in a structured table

This improves usability and reduces cognitive load.

## What Changes
- **ADDED** Right-side panel for CSV items table display, activated when a section node is selected
- **MODIFIED** Left side details panel to show only document content (remove all technical metadata)
- **ADDED** Dynamic CSV filtering logic to show items related to the current section
- **ADDED** Column headers and sorting/filtering controls for the CSV table
- **ADDED** Responsive layout adjustments for left-right panel management

## Impact
- Affected specs: `ui` capability (layout and details panel behavior)
- Affected code: `static/js/tree-loader.js`, `static/js/app.js`, `static/css/medical-tree.css`, `static/index.html`
- No backend changes required (uses existing CSV data in memory)
- No breaking changes (enhancement to existing UI)
