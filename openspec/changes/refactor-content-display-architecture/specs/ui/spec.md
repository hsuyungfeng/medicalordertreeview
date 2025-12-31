## MODIFIED Requirements

### Requirement: Left Panel Documentation Display
當用戶點擊左側樹的節點時，左側面板SHALL只顯示文檔的核心說明部分，而SHALL NOT顯示完整的文檔內容。該變更將文檔拆分為「說明部分」和「數據部分」，其中說明部分在左側展示，數據部分對應的表格在右側展示。

#### Scenario: Section document display - simplified
- **WHEN** 用戶點擊左側樹的 section 節點
- **THEN** 左側面板SHALL顯示該節點對應文檔的「說明文本」（核心說明段落，通常為前3段或前500字符）
- **AND** 左側面板SHALL NOT顯示所有細節數據（如通則、限制條款等詳細條文）
- **AND** 面板頂部SHALL仍然顯示節點標題和關閉按鈕

#### Scenario: Content extraction heuristic
- **WHEN** 文檔內容被加載
- **THEN** 系統SHALL嘗試識別文檔中的「核心說明」段落（通常是文檔開頭或標題之後的段落）
- **AND** 如果無法識別，系統SHALL顯示前500字符或前3段作為預設摘要

---

## ADDED Requirements

### Requirement: Multi-Type Table Display System
右側面板MUST支持顯示多種類型的表格，而不僅僅是 CSV 診療項目表。根據節點 ID，系統MUST動態決定並載入相對應的表格類型。

#### Scenario: Dynamic table type selection
- **WHEN** 用戶點擊左側樹的 section 節點
- **THEN** 系統SHALL根據 section ID（如 `section-2-2-1`）查詢節點-表單映射
- **AND** 系統SHALL決定該節點應顯示哪種類型的表格（CSV、支付標準、規則表等）
- **AND** 系統SHALL加載並渲染對應的表格

#### Scenario: CSV table display (existing functionality)
- **WHEN** section 節點映射的表格類型為「CSV 診療項目」
- **THEN** 右側應顯示該 section 相關的診療項目表
- **AND** 包含代碼、名稱、支付點數、生效日期等列
- **AND** 支持排序和關鍵字篩選

#### Scenario: Payment standard table display
- **WHEN** section 節點映射的表格類型為「支付標準」
- **THEN** 右側應顯示該 section 的支付標準表
- **AND** 包含項目代碼、項目名稱、支付點數、支付規則等列
- **AND** 格式和排序功能與 CSV 表一致

#### Scenario: Rules and regulations table
- **WHEN** section 節點映射的表格類型為「規則表」
- **THEN** 右側應顯示該 section 對應的規則和規章表
- **AND** 包含規則名稱、適用條件、備註等列

#### Scenario: Table not found
- **WHEN** 節點無對應的表格映射
- **THEN** 右側面板應顯示「此節點無相關表格」提示
- **AND** 或者顯示備選的通用 CSV 表

### Requirement: Node-to-Table Mapping System
系統需要一個清晰的映射機制，定義每個 section 節點對應哪些表格。

#### Scenario: Mapping configuration
- **WHEN** 應用初始化
- **THEN** 應加載節點-表單映射配置
- **AND** 映射應包含：節點 ID → [表格類型, 表格數據來源]
- **AND** 支持一個節點對應多個表格（使用標籤區分）

#### Scenario: Extensible mapping
- **WHEN** 需要添加新的節點-表單映射
- **THEN** 應能夠在配置文件中簡單地添加新的映射規則
- **AND** 無需修改前端代碼邏輯

---

## ADDED Requirements

### Requirement: Multi-Panel Navigation
右側面板中可能會有多個表格（標籤式或分頁式），用戶應該能夠方便地切換。系統MUST支持標籤式導航讓用戶在多個表格之間切換。

#### Scenario: Tabbed table views
- **WHEN** 節點對應多個表格
- **THEN** 右側面板SHALL使用標籤（tabs）來區分不同表格
- **AND** 用戶可以點擊標籤切換表格
- **AND** 用戶操作記錄（如排序、篩選）在標籤內獨立保持

#### Scenario: Single table display
- **WHEN** 節點只對應一個表格
- **THEN** 系統SHALL不顯示標籤欄，直接顯示表格

---

## REMOVED Requirements

### Requirement: CSV-Only Table Display
移除之前的「右側只顯示 CSV 診療項目表」的限制，改為支持多類型表格。

#### Migration Path
- 現有的 CSV 表格顯示功能保留並改進
- 新增其他表格類型的支持
- 用戶體驗保持一致
