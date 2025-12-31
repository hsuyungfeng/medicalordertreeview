## ADDED Requirements

### Requirement: Interactive Tree Viewer
The system SHALL provide an interactive tree view UI for browsing and exploring service items.

#### Scenario: Search for node
- **WHEN** a user enters a search term in the tree search box
- **THEN** the UI SHALL show matching nodes and highlight path(s) to those nodes

#### Scenario: Filter by payment standard
- **WHEN** a user selects a payment standard filter
- **THEN** the UI SHALL display only nodes matching the filter

#### Scenario: Export selected subtree as CSV
- **WHEN** a user selects one or more nodes and requests export
- **THEN** the system SHALL provide a CSV file containing selected nodes and their metadata

### Requirement: Backend support for export and search
The backend SHALL provide endpoints for searching nodes and exporting filtered datasets.

#### Scenario: Backend search
- **WHEN** the frontend calls the search endpoint with a query
- **THEN** the backend SHALL return a paginated list of matching nodes with path and metadata

#### Scenario: Export endpoint
- **WHEN** the frontend calls the export endpoint with filters
- **THEN** the backend SHALL return a downloadable CSV with UTF-8 encoding
