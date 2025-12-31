## ADDED Requirements

### Requirement: Section Content Display (Left Panel)
When a user selects a section node, the left details panel SHALL display only the document content and text explanation, without any technical metadata (ID, level, filename, etc.).

#### Scenario: User views section content
- **WHEN** user clicks on a section node (e.g., "第二部第二章第十節麻醉費")
- **THEN** the left panel displays the section's document content in a clean, readable format
- **AND** no metadata fields (節點 ID, 層級, 文件ID, etc.) are shown

#### Scenario: User views subsection content
- **WHEN** user expands a section and clicks a subsection
- **THEN** the left panel displays the subsection content without metadata

### Requirement: CSV Items Table Display (Right Panel)
When a user selects a section node, the right panel SHALL display a table of related CSV items (診療項目) that belong to the current section.

#### Scenario: CSV table appears for section
- **WHEN** user clicks on a section node
- **THEN** the right panel displays a table with the following columns:
  - 診療項目代碼 (Code)
  - 中文項目名稱 (Name)
  - 健保支付點數 (Points)
  - 生效起日 (Effective From)
  - 生效迄日 (Effective To)
- **AND** the table is populated with all CSV items matching the current section context
- **AND** the table is sortable by each column
- **AND** rows are displayed with alternating background colors for readability

#### Scenario: CSV table updates on node change
- **WHEN** user switches from one section to another
- **THEN** the CSV table is updated to show items relevant to the newly selected section
- **AND** the table scroll position resets to the top

#### Scenario: CSV table empty state
- **WHEN** a section node has no associated CSV items
- **THEN** the right panel displays a message indicating "No items found for this section"

### Requirement: Layout Adjustment
The main container SHALL be organized as a two-panel layout when a section is selected, with the left panel for content and the right panel for CSV items.

#### Scenario: Two-panel layout on section selection
- **WHEN** user selects a section or subsection
- **THEN** the layout SHALL show:
  - Left panel: Document content (40-50% width)
  - Right panel: CSV items table (50-60% width)
- **AND** both panels are scrollable independently
- **AND** the layout is responsive on smaller screens (stacked vertically on mobile)

#### Scenario: Full-width layout without selection
- **WHEN** no section is selected or user navigates away from tree
- **THEN** the right panel is hidden
- **AND** the left panel takes full width

## MODIFIED Requirements

### Requirement: Node Details Panel
When a user selects a section node, the left details panel SHALL display only document content and title, with all technical metadata fields (ID, level, filename, etc.) hidden.

#### Scenario: Section details without metadata
- **WHEN** user clicks on a section node
- **THEN** the details panel SHALL show:
  - Title (section label)
  - Content (document text)
- **AND** the details panel SHALL NOT display metadata fields (節點 ID, 層級, 文件ID, etc.)
- **AND** a close button MUST remain for dismissing the panel

#### Scenario: Details panel consistency across node types
- **WHEN** user switches between different section nodes
- **THEN** the left panel layout SHALL remain consistent (no metadata fields)
- **AND** only the title and content SHALL change
