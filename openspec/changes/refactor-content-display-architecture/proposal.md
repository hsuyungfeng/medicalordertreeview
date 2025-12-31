# Change: Refactor Content Display Architecture - Separate Documentation from Data

## Why
目前的系統在左側面板同時顯示「文檔說明」和「細節數據」，造成信息混亂。用戶的真實需求是：
- **左側**：只關注文檔的說明文本（文章內容）
- **右側**：根據節點對應顯示相關的「表格、規則、數據」

這樣的分離可以提供更清晰的用戶體驗，讓用戶能夠同時看到「說明」和「表單」，快速理解並查找相關數據。

## What Changes
- **MODIFIED** 左側詳情面板的內容邏輯：從完整文檔內容改為「簡化說明」
- **MODIFIED** 右側面板的顯示策略：從單一 CSV 表改為「多類型表單系統」
- **ADDED** 節點-表單映射機制：根據 section ID 確定該節點應顯示哪些表格
- **ADDED** 動態表格加載系統：支持 CSV 表、支付標準表、規則表等多種類型
- **ADDED** 表格分類管理：為不同類型的表格定義統一的顯示方式

## Impact
- Affected specs: `ui` capability (content display logic), 新增 `table-system` capability
- Affected code:
  - `static/js/tree-loader.js` (修改內容邏輯)
  - `static/js/csv-table-renderer.js` (改為通用表格渲染器)
  - `static/js/table-mapper.js` (新增：節點-表單映射)
  - `static/js/table-loader.js` (新增：表格加載系統)
  - `static/css/medical-tree.css` (表格樣式優化)
- No backend changes (客戶端新增邏輯)
- Breaking changes: 右側面板內容從「固定 CSV」改為「多類型表格」（用戶看到更多有用數據）
