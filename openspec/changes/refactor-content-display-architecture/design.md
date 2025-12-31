# Design: Content Display Architecture Refactoring

## Context
目前的系統展示方式是：
- **左側面板**：顯示整個文檔（包含所有細節、規則、限制條款）
- **右側面板**：僅顯示 CSV 診療項目表

用戶的真實需求：
- **左側**：只要「關鍵說明」，不要冗長的細節
- **右邊**：展示「最相關的表格」，不同節點應該有不同的表格

新系統需要支持：
1. 文檔內容的智能拆分（說明 vs 數據）
2. 節點到表格的靈活映射
3. 多類型表格的統一展示

## Goals
- 提高信息清晰度：分離文檔說明和數據表格
- 支持多種表格類型：不限於 CSV，也包括支付標準、規則表等
- 易於擴展：新增節點-表單映射不需要修改代碼
- 保持性能：表格懶加載，只在需要時讀取
- 統一 UX：所有表格使用同樣的交互方式

## Non-Goals
- 實現高級數據分析功能
- 修改後端 API（純客戶端改進）
- 完全重寫樹狀導航邏輯

## Decisions

### Decision 1: Content Extraction Strategy
**What**: 對左側面板的文檔進行智能拆分，提取「說明部分」

**Why**: 用戶需要關鍵信息，而不是冗長的細節文檔

**Alternatives considered**:
- 選項1：前端正則表達式識別 → 易出錯，需要手調規則
- 選項2：後端服務提供簡化版本 → 需要後端改動
- **選項3（採用）**：啟發式提取（提取前 N 段或特定關鍵詞） + 用戶可展開查看全文

**Implementation**:
```javascript
// 簡單的說明提取邏輯
function extractDocumentation(fullContent) {
  // 策略1：按「通則：」、「說明：」等關鍵詞分割
  // 策略2：提取前500字符
  // 策略3：提取前3段（換行分割）
  // 返回說明 + 「展開全文」按鈕
}
```

### Decision 2: Node-to-Table Mapping System
**What**: 使用靜態配置文件定義節點和表格的對應關係

**Why**:
- 靈活性高：無需修改代碼即可添加新映射
- 易於維護：映射規則集中管理
- 易於驗證：可單獨檢查映射的正確性

**Alternatives considered**:
- 選項1：硬編碼映射在 JavaScript → 改動需要改代碼
- **選項2（採用）**：JSON 配置文件 + 運行時加載
- 選項3：數據庫 + API → 超過需求

**Implementation**:
```json
{
  "section-2-2-1": {
    "label": "第二部第二章第一節檢查",
    "tables": [
      {
        "type": "csv",
        "name": "診療項目",
        "codePrefixes": ["01", "02", "03"]
      },
      {
        "type": "standard",
        "name": "支付標準",
        "dataUrl": "data/standards/2-2-1.json"
      }
    ]
  },
  "section-2-2-2": { ... }
}
```

### Decision 3: Table Rendering Architecture
**What**: 創建通用的表格渲染引擎，支持多種表格類型

**Why**:
- 代碼重用：CSV 表和其他表共享排序、篩選邏輯
- 一致 UX：所有表格使用同樣的樣式和交互
- 易於擴展：添加新表格類型只需實現新的「表格適配器」

**Alternatives considered**:
- 選項1：為每種表格類型寫單獨的渲染器 → 代碼重複
- **選項2（採用）**：通用表格引擎 + 表格類型適配器
- 選項3：使用表格庫（如 DataTables） → 增加依賴

**Implementation**:
```javascript
class TableRenderer {
  render(tableConfig, data) {
    // 通用渲染邏輯：排序、篩選、分頁
  }
}

class CSVTableAdapter extends TableAdapter {
  // CSV 特定的適配邏輯
}

class StandardTableAdapter extends TableAdapter {
  // 支付標準表特定邏輯
}
```

### Decision 4: Content Expansion
**What**: 右側面板顯示簡化內容，但用戶可點擊「展開全文」查看完整文檔

**Why**:
- 默認展示簡潔，但不丟失完整信息
- 用戶可自主選擇是否查看詳細內容
- 符合「漸進式展示」的設計原則

**Implementation**:
```html
<!-- 左側面板 -->
<div class="documentation">
  <div class="summary"><!-- 簡化說明 --></div>
  <button class="expand-full">展開全文</button>
  <div class="full-content" style="display: none;"><!-- 完整文檔 --></div>
</div>
```

## Risks & Trade-offs

### Risk 1: Content Extraction Accuracy
**Risk**: 啟發式提取可能提取錯誤的「說明」部分

**Mitigation**:
- 在初始版本中，採用簡單的「前 3 段」策略
- 允許手動調整提取邏輯（根據實際文檔反饋）
- 提供「展開全文」按鈕作為後備

### Risk 2: Mapping Maintenance
**Risk**: 節點-表單映射可能不完整或過時

**Mitigation**:
- 在應用初始化時驗證映射的完整性（log 警告）
- 為未映射的節點提供「無相關表格」提示
- 版本控制配置文件，跟蹤映射變化

### Risk 3: Performance with Multiple Tables
**Risk**: 節點對應多個表格時，同時加載所有表格可能緩慢

**Mitigation**:
- 使用標籤式設計，只在用戶點擊標籤時加載對應表格
- 實現表格級別的緩存

## Migration Plan

### Phase 1: Infrastructure Setup
1. 創建 `table-mapper.js`（節點-表單映射）
2. 創建 `table-loader.js`（表格加載系統）
3. 改進 `table-renderer.js`（通用表格引擎）

### Phase 2: Left Panel Modification
1. 實現內容提取邏輯
2. 添加「展開全文」功能
3. 测試效果

### Phase 3: Right Panel Multi-Type Support
1. 實現表格適配器系統
2. 遷移現有 CSV 表到新架構
3. 添加支付標準表支持
4. 添加規則表支持

### Phase 4: Integration & Testing
1. 整合所有模塊
2. 端到端測試
3. 用戶反饋和優化

## Open Questions

1. **內容提取規則**：現有文檔的「說明」部分在哪裡？是否有一致的結構？

2. **表格數據來源**：
   - CSV 項目表已有（from CSV chunks）
   - 支付標準表數據在哪裡？需要從文檔解析還是已有結構化數據？
   - 規則表是否已以表格形式存在？

3. **多表格優先級**：如果一個節點有多個表格，默認顯示哪一個？

4. **性能考量**：應該在應用初始化時加載所有映射，還是按需加載？

5. **用戶反饋**：是否需要提供「我找不到我要的表格」的反饋機制？
