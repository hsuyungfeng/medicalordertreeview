/**
 * 文檔表格適配器
 * 提供從 .doc 文件提取的表格數據給通用表格渲染器
 */

class DocTableAdapter extends TableAdapter {
  constructor() {
    super();
    this.mapping = null;
    this.currentDocData = null;
    this.currentTableIndex = 0;
    this.currentNodeMapping = null;  // 保存當前節點的映射信息（包括 row_range）
    this.currentNodeTableIndices = [];  // 當前節點對應的所有表格全局索引
    this.currentTableIndexInNode = 0;  // 當前節點中第幾個表格（0-based）
  }

  /**
   * 加載映射配置
   */
  async loadMapping() {
    if (this.mapping) {
      console.debug('📋 映射已快取，跳過重新加載');
      return;
    }

    try {
      console.log('📥 開始加載映射文件: data/doc-table-mapping.json');
      const response = await fetch('data/doc-table-mapping.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.mapping = await response.json();
      console.log('✅ 文檔表格映射已加載，版本:', this.mapping.version);
      console.log('📊 映射統計 - 節點總數:', this.mapping.summary?.total_nodes_with_tables || 'N/A');
      console.log('🔑 mappings 鑰匙:', Object.keys(this.mapping.mappings || {}).length, '個');
    } catch (error) {
      console.error('❌ 加載映射文件失敗:', error);
      this.mapping = { version: "2.0.0", mappings: {} };
    }
  }

  /**
   * 為指定節點加載表格
   * @param {string} nodeId - 節點 ID
   * @returns {Promise<Object|null>} 文檔數據或 null
   */
  async loadTablesForNode(nodeId) {
    console.log(`🔍 開始加載節點表格: ${nodeId}`);
    await this.loadMapping();

    // 支援多種映射格式
    let nodeMapping = null;

    // 優先查找 mappings 字段 (當前版本 3.0.0)
    if (this.mapping.mappings && this.mapping.mappings[nodeId]) {
      nodeMapping = this.mapping.mappings[nodeId];
      console.log(`✅ 在 mappings 中找到節點: ${nodeId}`);
    }
    // 備用: nodes 字段 (舊版本)
    else if (this.mapping.nodes && this.mapping.nodes[nodeId]) {
      nodeMapping = this.mapping.nodes[nodeId];
      console.log(`✅ 在 nodes 中找到節點: ${nodeId}`);
    }
    else {
      console.debug(`❌ 節點 ${nodeId} 未在映射中 (mappings: ${Object.keys(this.mapping.mappings || {}).join(', ')})`);
    }

    if (!nodeMapping) {
      // 靜默處理容器節點，不顯示警告（容器節點由 tree-loader 處理）
      console.debug(`📋 節點 ${nodeId} 無表格映射（可能為容器節點或無表格數據）`);
      this.currentNodeMapping = null;
      return null;
    }

    // 保存當前節點的映射信息（用於 row_range 過濾）
    this.currentNodeMapping = nodeMapping;
    if (nodeMapping.row_range) {
      console.log(`🔢 檢測到 row_range: ${nodeMapping.row_range}`);
    }

    // 檢查是否有表格數據
    const hasTablesNew = nodeMapping.tables && nodeMapping.tables.length > 0;
    const hasTablesOld = nodeMapping.has_tables;

    console.log(`📊 節點 ${nodeId} 檢查 - hasTablesNew: ${hasTablesNew}, hasTablesOld: ${hasTablesOld}`);

    if (!hasTablesNew && !hasTablesOld) {
      console.warn(`⚠️ 節點 ${nodeId} 無表格數據`);
      return null;
    }

    try {
      const docId = nodeMapping.doc_id;
      console.log(`📄 加載文檔表格: ${docId}`);

      const response = await fetch(`data/doc-tables/${docId}.json`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      this.currentDocData = await response.json();

      // 【修正】從所有 tables 陣列中解析表格索引
      if (hasTablesNew && nodeMapping.tables && nodeMapping.tables.length > 0) {
        this.currentNodeTableIndices = [];

        for (let i = 0; i < nodeMapping.tables.length; i++) {
          const tableId = nodeMapping.tables[i];
          // 支援兩種格式: table-0 或 doc-table-...-t0
          let tableIndexMatch = tableId.match(/table-(\d+)$/) || tableId.match(/-t(\d+)$/);

          if (tableIndexMatch) {
            const index = parseInt(tableIndexMatch[1], 10);
            this.currentNodeTableIndices.push(index);
            console.log(`  [${i}] 從表格 ID 提取索引: t${index} (ID: ${tableId})`);
          } else {
            console.warn(`  ⚠️ 無法從表格 ID 提取索引: ${tableId}`);
          }
        }

        if (this.currentNodeTableIndices.length > 0) {
          this.currentTableIndexInNode = 0;
          this.currentTableIndex = this.currentNodeTableIndices[0];

          if (this.currentNodeTableIndices.length > 1) {
            console.log(`🎯 此節點有 ${this.currentNodeTableIndices.length} 個表格，已加載第 1 個`);
          } else {
            console.log(`🎯 此節點有 1 個表格，索引: ${this.currentTableIndex}`);
          }
        } else {
          console.warn(`⚠️ 無法從任何表格 ID 提取索引，使用預設索引 0`);
          this.currentTableIndex = 0;
          this.currentNodeTableIndices = [0];
        }
      } else {
        this.currentTableIndex = 0;
        this.currentNodeTableIndices = [0];
      }

      console.log(`✅ 文檔表格已加載: ${docId}, 共 ${this.currentDocData.sections?.length || 0} 個 section, 當前表格索引: ${this.currentTableIndex}/${this.currentNodeTableIndices.join(',')}`);
      return this.currentDocData;
    } catch (error) {
      console.error(`❌ 加載文檔表格失敗:`, error);
      return null;
    }
  }

  /**
   * 獲取當前表格的數據
   * @returns {Object|null} 包含 {section, table} 的對象或 null
   */
  getCurrentTable() {
    if (!this.currentDocData || !this.currentDocData.sections) {
      return null;
    }

    let tableCount = 0;
    for (const section of this.currentDocData.sections) {
      if (!section.tables || section.tables.length === 0) {
        continue;
      }

      for (const table of section.tables) {
        if (tableCount === this.currentTableIndex) {
          return { section, table };
        }
        tableCount++;
      }
    }

    return null;
  }

  /**
   * 獲取總表格數
   * @returns {number} 表格總數
   */
  getTotalTables() {
    if (!this.currentDocData || !this.currentDocData.sections) {
      return 0;
    }

    return this.currentDocData.sections.reduce(
      (sum, s) => sum + (s.tables ? s.tables.length : 0),
      0
    );
  }

  /**
   * 獲取表格列定義
   * 動態生成，基於當前表格的 headers
   * @returns {Array} 列定義數組
   */
  getColumns() {
    const current = this.getCurrentTable();
    if (!current || !current.table) {
      return [];
    }

    const { headers } = current.table;
    return headers.map((header, index) => ({
      key: `col_${index}`,
      label: header,
      sortable: true,
      type: 'string'
    }));
  }

  /**
   * 格式化行數據
   * @param {Array} row - 行數據（數組格式）
   * @returns {Object} 格式化後的行數據（對象格式）
   */
  formatRow(row) {
    const formatted = {};
    if (Array.isArray(row)) {
      row.forEach((cell, index) => {
        formatted[`col_${index}`] = this.escapeHtml(String(cell || ''));
      });
    }
    return formatted;
  }

  /**
   * 獲取表格數據
   * @returns {Array} 行數據數組
   */
  getData() {
    const current = this.getCurrentTable();
    if (!current || !current.table) {
      return [];
    }

    let rows = current.table.rows;

    // 如果有 row_range，進行過濾
    if (this.currentNodeMapping && this.currentNodeMapping.row_range) {
      const [startStr, endStr] = this.currentNodeMapping.row_range.split('-');
      const startRow = parseInt(startStr, 10);
      const endRow = parseInt(endStr, 10);

      if (!isNaN(startRow) && !isNaN(endRow)) {
        const filteredRows = rows.slice(startRow, endRow + 1);
        console.log(`🔢 應用 row_range: ${this.currentNodeMapping.row_range} (${startRow}-${endRow}) - ${rows.length} 行 → ${filteredRows.length} 行`);
        return filteredRows;
      }
    }

    return rows;
  }

  /**
   * 獲取表格元數據
   * @returns {Object} 包含表格信息的元數據
   */
  getTableMetadata() {
    const current = this.getCurrentTable();
    if (!current) {
      return null;
    }

    const totalTables = this.getTotalTables();
    const rowCount = this.getData().length;  // 使用 getData() 以便包含 row_range 過濾

    // 【修正】顯示當前節點內的表格位置
    let tablePosition = '';
    if (this.currentNodeTableIndices && this.currentNodeTableIndices.length > 1) {
      tablePosition = `(當前節點: ${this.currentTableIndexInNode + 1}/${this.currentNodeTableIndices.length})`;
    }

    return {
      sectionHeading: current.section.heading,
      sectionLevel: current.section.level,
      tableIndex: this.currentTableIndex,
      totalTables: totalTables,
      tablePosition: tablePosition,  // 新增字段
      rowCount: rowCount,
      columnCount: current.table.headers.length
    };
  }

  /**
   * 切換到下一個表格
   * @returns {boolean} 是否還有下一個表格
   */
  nextTable() {
    // 【修正】支援當前節點內的多表格導航
    if (this.currentNodeTableIndices && this.currentNodeTableIndices.length > 1) {
      if (this.currentTableIndexInNode < this.currentNodeTableIndices.length - 1) {
        this.currentTableIndexInNode++;
        this.currentTableIndex = this.currentNodeTableIndices[this.currentTableIndexInNode];
        console.log(`🔄 切換到表格 ${this.currentTableIndexInNode + 1}/${this.currentNodeTableIndices.length} (索引: ${this.currentTableIndex})`);
        return true;
      }
    }
    // 備用邏輯：不在當前節點內時，切換到下一個全局表格
    if (this.currentTableIndex < this.getTotalTables() - 1) {
      this.currentTableIndex++;
      return true;
    }
    return false;
  }

  /**
   * 切換到上一個表格
   * @returns {boolean} 是否還有上一個表格
   */
  previousTable() {
    // 【修正】支援當前節點內的多表格導航
    if (this.currentNodeTableIndices && this.currentNodeTableIndices.length > 1) {
      if (this.currentTableIndexInNode > 0) {
        this.currentTableIndexInNode--;
        this.currentTableIndex = this.currentNodeTableIndices[this.currentTableIndexInNode];
        console.log(`🔄 切換到表格 ${this.currentTableIndexInNode + 1}/${this.currentNodeTableIndices.length} (索引: ${this.currentTableIndex})`);
        return true;
      }
    }
    // 備用邏輯：不在當前節點內時，切換到上一個全局表格
    if (this.currentTableIndex > 0) {
      this.currentTableIndex--;
      return true;
    }
    return false;
  }

  /**
   * 獲取排序值
   * 覆寫基類方法，處理數組格式的行數據
   * @param {Object} row - 行數據
   * @param {string} column - 列 key
   * @returns {*} 用於排序的值
   */
  getSortValue(row, column) {
    // row 已經被 formatRow 轉換為對象格式
    const value = row[column];

    // 嘗試轉換為數字用於排序
    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
  }
}

// 導出供全局使用
window.DocTableAdapter = DocTableAdapter;
