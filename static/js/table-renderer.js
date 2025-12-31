/**
 * 通用表格渲染系統
 * 支持通過適配器渲染不同類型的表格
 */

/**
 * 表格適配器基類
 * 所有表格適配器必須實現此接口
 */
class TableAdapter {
  /**
   * 獲取表格列定義
   * @returns {Array} 列定義數組，每項包含 {key, label, sortable, type}
   */
  getColumns() {
    throw new Error('getColumns() must be implemented');
  }

  /**
   * 格式化行數據以供顯示
   * @param {Object} row 原始行數據
   * @returns {Object} 格式化後的行數據
   */
  formatRow(row) {
    throw new Error('formatRow() must be implemented');
  }

  /**
   * 檢查列是否可排序
   * @param {String} column 列名
   * @returns {Boolean}
   */
  canSort(column) {
    const columns = this.getColumns();
    const col = columns.find(c => c.key === column);
    return col ? col.sortable : false;
  }

  /**
   * 獲取用於排序的值
   * @param {Object} row 行數據
   * @param {String} column 列名
   * @returns {*} 用於排序的值
   */
  getSortValue(row, column) {
    return row[column];
  }

  /**
   * HTML 轉義
   * @param {String} text 待轉義文本
   * @returns {String} 轉義後的文本
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

/**
 * CSV 診療項目表適配器
 */
class CSVTableAdapter extends TableAdapter {
  constructor() {
    super();
    this.sectionCodeMap = {
      1: ['01', '02', '03', '04', '05', '06', '07', '08', '09'],  // 檢查
      2: ['10', '11', '12', '13'],  // 檢查判斷
      3: ['14', '15'],  // 藥物
      4: ['20', '21', '22', '23', '24', '25', '26'],  // 治療
      5: ['30', '31'],  // 手術
      6: ['40', '41', '42', '43', '44', '45', '46', '47', '48'],  // 神經
      7: ['50', '51', '52'],  // 復健
      8: ['60', '61', '62', '63', '64'],  // 放射
      9: ['70', '71', '72'],  // 病理
      10: ['96']  // 麻醉費
    };
  }

  getColumns() {
    return [
      { key: 'code', label: '代碼', sortable: true, type: 'string' },
      { key: 'name', label: '項目名稱', sortable: true, type: 'string' },
      { key: 'points', label: '支付點數', sortable: true, type: 'number' },
      { key: 'effective_from', label: '生效日期', sortable: true, type: 'string' },
      { key: 'effective_to', label: '終止日期', sortable: true, type: 'string' }
    ];
  }

  formatRow(row) {
    return {
      code: this.escapeHtml(row.code || ''),
      name: this.escapeHtml(row.name || ''),
      points: row.points || 0,
      effective_from: this.escapeHtml(row.effective_from || ''),
      effective_to: this.escapeHtml(row.effective_to || '')
    };
  }

  getSortValue(row, column) {
    if (column === 'points') {
      return parseInt(row.points) || 0;
    }
    return String(row[column] || '').toLowerCase();
  }

  /**
   * 根據 section ID 獲取代碼前綴
   */
  getCodePrefixesForSection(sectionId) {
    const sectionMatch = sectionId.match(/section-2-2-(\d+)/);
    if (!sectionMatch) {
      return [];
    }

    const sectionNum = parseInt(sectionMatch[1]);
    return this.sectionCodeMap[sectionNum] || [];
  }

  /**
   * 根據 section ID 篩選項目
   */
  filterBySection(items, sectionId) {
    const codePrefixes = this.getCodePrefixesForSection(sectionId);

    if (codePrefixes.length === 0) {
      return [];
    }

    return items.filter(item => {
      const itemCode = String(item.code || '');
      return codePrefixes.some(prefix => itemCode.startsWith(prefix));
    });
  }
}

/**
 * 支付標準表適配器
 * 用於顯示醫療項目的支付標準和支付點數
 */
class StandardTableAdapter extends TableAdapter {
  getColumns() {
    return [
      { key: 'code', label: '項目代碼', sortable: true, type: 'string' },
      { key: 'name', label: '項目名稱', sortable: true, type: 'string' },
      { key: 'payment_points', label: '支付點數', sortable: true, type: 'number' },
      { key: 'effective_from', label: '生效起日', sortable: true, type: 'string' },
      { key: 'effective_to', label: '生效迄日', sortable: true, type: 'string' }
    ];
  }

  formatRow(row) {
    return {
      code: this.escapeHtml(row.code || ''),
      name: this.escapeHtml(row.name || ''),
      payment_points: parseInt(row.payment_points) || 0,
      effective_from: this.formatDate(row.effective_from || ''),
      effective_to: this.formatDate(row.effective_to || '')
    };
  }

  getSortValue(row, column) {
    if (column === 'payment_points') {
      return parseInt(row.payment_points) || 0;
    }
    if (column === 'effective_from' || column === 'effective_to') {
      return row[column] || '';
    }
    return String(row[column] || '').toLowerCase();
  }

  /**
   * 格式化日期 (YYYYMMDD → YYYY-MM-DD)
   */
  formatDate(dateStr) {
    if (!dateStr || dateStr.length !== 8) {
      return dateStr;
    }
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${year}-${month}-${day}`;
  }
}

/**
 * 規則表適配器
 * 用於顯示給付規則和限制條款
 */
class RulesTableAdapter extends TableAdapter {
  getColumns() {
    return [
      { key: 'rule_name', label: '規則名稱', sortable: true, type: 'string' },
      { key: 'rule_code', label: '規則代碼', sortable: true, type: 'string' },
      { key: 'applicable_condition', label: '適用條件', sortable: false, type: 'string' },
      { key: 'remarks', label: '備註', sortable: false, type: 'string' }
    ];
  }

  formatRow(row) {
    // 截斷長文本以改善顯示
    const truncateText = (text, maxLen = 100) => {
      const escaped = this.escapeHtml(text || '');
      return escaped.length > maxLen ? escaped.substring(0, maxLen) + '...' : escaped;
    };

    return {
      rule_name: this.escapeHtml(row.rule_name || ''),
      rule_code: this.escapeHtml(row.rule_code || ''),
      applicable_condition: truncateText(row.applicable_condition || '', 120),
      remarks: truncateText(row.remarks || '', 150)
    };
  }

  getSortValue(row, column) {
    return String(row[column] || '').toLowerCase();
  }

  /**
   * 獲取規則類型標籤
   */
  getRuleTypeLabel(ruleCode) {
    const typeMap = {
      'R01': '給付規則',
      'R02': '限制條款',
      'R03': '特殊規定',
      'R04': '例外情況',
      'R05': '禁忌',
      'R99': '其他'
    };
    const prefix = ruleCode?.substring(0, 3) || 'R99';
    return typeMap[prefix] || '其他';
  }

  /**
   * 檢查是否為嚴重規則（禁忌等）
   */
  isSevereRule(ruleCode) {
    return ruleCode?.substring(0, 3) === 'R05';
  }
}

/**
 * 通用表格渲染器
 * 使用適配器模式支持多種表格類型
 */
class TableRenderer {
  constructor(containerId = '.table-container', adapter = null) {
    this.container = document.querySelector(containerId);
    this.adapter = adapter;
    this.data = [];
    this.filteredData = [];
    this.sortColumn = null;
    this.sortDirection = 'asc';

    // 初始化搜尋優化器
    this.searchOptimizer = new SearchOptimizer();
    this.useOptimizedSearch = true;
    this.lastSearchKeyword = '';

    // 初始化高級篩選器
    this.advancedFilter = new AdvancedFilter();
    this.useAdvancedFilter = true;

    if (this.adapter) {
      this.bindEvents();
    }
  }

  /**
   * 設置適配器
   */
  setAdapter(adapter) {
    this.adapter = adapter;
    this.bindEvents();
  }

  /**
   * 綁定事件監聽器
   */
  bindEvents() {
    // 表格列排序
    this.bindTableHeaderEvents();

    // 關閉按鈕
    const closeBtn = this.container?.querySelector('.close-table-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 篩選輸入框
    const filterInput = this.container?.querySelector('.table-filter-input');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this.filterByKeyword(e.target.value);
      });
    }

    // 排序選擇下拉菜單
    const sortSelect = this.container?.querySelector('.table-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'none') {
          this.sortByColumn(e.target.value);
        }
      });
    }
  }

  /**
   * 綁定表格列點擊事件
   */
  bindTableHeaderEvents() {
    const table = this.container?.querySelector('.data-table');
    if (table) {
      const headers = table.querySelectorAll('th[data-column]');
      headers.forEach(header => {
        // 移除之前的監聽器，避免重複綁定
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', (e) => {
          const column = newHeader.getAttribute('data-column');
          if (this.adapter?.canSort(column)) {
            this.sortByColumn(column);
          }
        });
      });
    }
  }

  /**
   * 設置表格數據
   */
  setData(data) {
    this.data = data || [];
    this.filteredData = [...this.data];

    // 初始化搜尋優化器 (構建倒排索引)
    if (this.useOptimizedSearch && this.adapter) {
      const columns = this.adapter.getColumns();
      this.searchOptimizer.initialize(this.data, columns);
    }

    console.log(`✓ 表格數據已設置: ${this.data.length} 筆`);
  }

  /**
   * 根據關鍵字篩選 (支持優化搜尋)
   */
  filterByKeyword(keyword) {
    const lowerKeyword = keyword.toLowerCase().trim();

    if (!lowerKeyword) {
      this.filteredData = [...this.data];
      this.lastSearchKeyword = '';
    } else if (this.useOptimizedSearch) {
      // 使用優化搜尋 (倒排索引 + 增量搜尋)
      const searchResult = this.searchOptimizer.incrementalSearch(
        this.lastSearchKeyword,
        keyword
      );
      this.filteredData = searchResult.results;

      // 記錄搜尋統計
      const source = searchResult.isIncremental ? '增量' : '索引';
      const perfNote = searchResult.source === 'cache' ? '(快取)' : '';
      console.log(`🔍 ${source}搜尋 ${perfNote} - ${searchResult.results.length} 結果, ${searchResult.time}ms`);
    } else {
      // 回退到普通搜尋
      this.filteredData = this.data.filter(item => {
        const columns = this.adapter.getColumns();
        return columns.some(col => {
          const value = String(item[col.key] || '').toLowerCase();
          return value.includes(lowerKeyword);
        });
      });
    }

    this.lastSearchKeyword = lowerKeyword;
    this.render();
  }

  /**
   * 按列排序
   */
  sortByColumn(column) {
    if (!this.adapter?.canSort(column)) {
      return;
    }

    // 如果點擊相同列，切換排序方向
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    // 排序數據
    this.filteredData.sort((a, b) => {
      let aValue = this.adapter.getSortValue(a, column);
      let bValue = this.adapter.getSortValue(b, column);

      if (aValue < bValue) return this.sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updateSortIndicators();
    this.render();
  }

  /**
   * 更新排序指示器
   */
  updateSortIndicators() {
    // 支持 .data-table 和 .csv-table 兩種結構
    let headers = this.container?.querySelectorAll('.data-table th[data-column]');
    if (!headers || headers.length === 0) {
      headers = this.container?.querySelectorAll('.csv-table th[data-column]');
    }
    if (!headers || headers.length === 0) return;

    headers.forEach(header => {
      header.classList.remove('sort-asc', 'sort-desc', 'sortable');
      const column = header.getAttribute('data-column');

      if (column === this.sortColumn) {
        header.classList.add(`sort-${this.sortDirection}`);
      } else if (this.adapter?.canSort(column)) {
        header.classList.add('sortable');
      }
    });
  }

  /**
   * 重置篩選和排序
   */
  reset() {
    this.sortColumn = null;
    this.sortDirection = 'asc';
    this.filteredData = [...this.data];

    const filterInput = this.container?.querySelector('.table-filter-input');
    if (filterInput) {
      filterInput.value = '';
    }

    const sortSelect = this.container?.querySelector('.table-sort-select');
    if (sortSelect) {
      sortSelect.value = 'none';
    }
  }

  /**
   * 渲染表格
   */
  render() {
    if (!this.container) {
      console.error('表格容器未找到');
      return;
    }

    // 診斷：檢查容器狀態
    console.log(`🔧 render() 被調用 - 數據行數: ${this.filteredData.length}`);
    console.log(`   容器選擇器: ${this.containerSelector}`);
    console.log(`   容器 display: ${window.getComputedStyle(this.container).display}`);
    console.log(`   容器 width: ${window.getComputedStyle(this.container).width}`);
    console.log(`   容器 height: ${window.getComputedStyle(this.container).height}`);

    // 更新計數
    const countSpan = this.container.querySelector('.table-item-count');
    if (countSpan) {
      countSpan.textContent = `(${this.filteredData.length})`;
    }

    // 取得表格和 tbody（支持 .data-table 和 .csv-table 兩種結構）
    let table = this.container.querySelector('.data-table');
    let tbody = table?.querySelector('tbody');
    if (!tbody) {
      table = this.container.querySelector('.csv-table');
      tbody = table?.querySelector('tbody');
    }
    if (!tbody) {
      console.error('❌ 表格 tbody 未找到 (搜尋 .data-table 或 .csv-table)');
      console.log('❌ 容器內容:', this.container?.innerHTML?.substring(0, 300));
      console.log('❌ 容器 HTML:', this.container?.outerHTML?.substring(0, 500));
      return;
    }

    console.log(`✅ 找到表格 tbody，準備渲染 ${this.filteredData.length} 行`);

    // 動態生成表頭（根據適配器的列定義）
    const columns = this.adapter.getColumns();
    try {
      const thead = table.querySelector('thead');
      if (thead) {
        const theadRow = thead.querySelector('tr');
        if (theadRow) {
          theadRow.innerHTML = '';
          columns.forEach(col => {
            const th = document.createElement('th');
            th.setAttribute('data-column', col.key);
            if (col.sortable) {
              th.classList.add('sortable');
            }
            th.textContent = col.label;
            theadRow.appendChild(th);
          });
        }
      }
    } catch (e) {
      console.warn('⚠️ 表頭生成失敗:', e.message);
    }

    // 清空表格數據
    tbody.innerHTML = '';

    // 如果沒有數據，顯示空狀態
    if (this.filteredData.length === 0) {
      this.showEmptyState();
      return;
    }

    // 隱藏空狀態（支持 .table-empty-state 和 .csv-empty-state）
    let emptyState = this.container.querySelector('.table-empty-state');
    if (!emptyState) {
      emptyState = this.container.querySelector('.csv-empty-state');
    }
    if (emptyState) {
      emptyState.style.display = 'none';
    }

    // 渲染行
    let rowCount = 0;
    this.filteredData.forEach((item, idx) => {
      const formattedRow = this.adapter.formatRow(item);

      const row = document.createElement('tr');
      let html = '';

      columns.forEach(col => {
        const value = formattedRow[col.key];
        const alignment = col.type === 'number' ? 'text-align: right;' : '';
        html += `<td style="${alignment}">${value || ''}</td>`;
      });

      row.innerHTML = html;
      tbody.appendChild(row);
      rowCount++;

      // 只診斷前 3 行
      if (idx < 3) {
        console.log(`   行 ${idx + 1}: ${html.substring(0, 100)}...`);
      }
    });

    console.log(`✓ 渲染表格: ${this.filteredData.length} 筆記錄`);

    // 診斷：檢查 tbody 和行的實際狀態
    const tbodyStyle = window.getComputedStyle(tbody);
    console.log(`📊 tbody 狀態:`);
    console.log(`   display: ${tbodyStyle.display}`);
    console.log(`   height: ${tbodyStyle.height}`);
    console.log(`   實際高度: ${tbody.scrollHeight}px`);
    console.log(`   行數: ${tbody.children.length}`);

    if (tbody.children.length > 0) {
      const firstRow = tbody.children[0];
      const rowStyle = window.getComputedStyle(firstRow);
      console.log(`📊 第一行狀態:`);
      console.log(`   height: ${rowStyle.height}`);
      console.log(`   display: ${rowStyle.display}`);
      console.log(`   內容: ${firstRow.textContent.substring(0, 50)}...`);
    }

    // 修復：設置表格容器的正確高度和溢出
    if (this.container && tbody && table) {
      const containerHeight = this.container.clientHeight;

      console.log(`🔧 開始修復表格高度問題:`);
      console.log(`   容器高度: ${containerHeight}px`);
      console.log(`   tbody.scrollHeight: ${tbody.scrollHeight}px (before fix)`);

      // 策略：不使用 display:block，改為使用標準表格佈局
      // 直接在容器上設置高度和溢出，讓瀏覽器自然處理表格佈局

      // 1. 設置表格樣式 - 特別是要確保 display: table!
      table.style.setProperty('display', 'table', 'important');
      table.style.setProperty('width', '100%', 'important');
      table.style.setProperty('border-collapse', 'collapse', 'important');
      table.style.setProperty('table-layout', 'auto', 'important');

      // 2. 直接在容器上設置溢出屬性（而不是創建包裝器）
      this.container.style.height = containerHeight + 'px';
      this.container.style.overflow = 'auto';
      this.container.style.display = 'block';

      // 3. 確保 tbody 可見
      tbody.style.setProperty('display', 'table-row-group', 'important');

      // 4. 設置 thead 為粘性定位
      const thead = table.querySelector('thead');
      if (thead) {
        thead.style.setProperty('display', 'table-header-group', 'important');
        thead.style.setProperty('position', 'sticky', 'important');
        thead.style.setProperty('top', '0', 'important');
        thead.style.setProperty('background-color', '#f5f5f5', 'important');
        thead.style.setProperty('z-index', '10', 'important');
      }

      // 5. 設置每行和單元格樣式以確保可見性
      const rows = tbody.querySelectorAll('tr');

      console.log(`🔍 調試行信息:`);
      console.log(`   找到的行數: ${rows.length}`);
      if (rows.length > 0) {
        console.log(`   第一行 HTML: ${rows[0].outerHTML.substring(0, 200)}`);
        console.log(`   第一行 clientHeight (應用前): ${rows[0].clientHeight}px`);
      }

      rows.forEach((row, index) => {
        // 使用 setProperty 正確處理 !important
        row.style.setProperty('display', 'table-row', 'important');
        row.style.setProperty('height', '30px', 'important');
        row.style.setProperty('min-height', '30px', 'important');

        const cells = row.querySelectorAll('th, td');
        cells.forEach(cell => {
          cell.style.setProperty('display', 'table-cell', 'important');
          cell.style.setProperty('padding', '8px 4px', 'important');
          cell.style.setProperty('height', '30px', 'important');
          cell.style.setProperty('line-height', '1.4', 'important');
          cell.style.setProperty('overflow', 'hidden', 'important');
          cell.style.setProperty('white-space', 'normal', 'important');
          cell.style.setProperty('word-break', 'break-word', 'important');
          cell.style.setProperty('vertical-align', 'middle', 'important');
        });
      });

      if (rows.length > 0) {
        console.log(`🔧 已應用樣式到 ${rows.length} 行`);
        console.log(`   第一行 clientHeight (應用後): ${rows[0].clientHeight}px`);
        console.log(`   第一行 inline style: ${rows[0].getAttribute('style')}`);

        // 檢查第一行的單元格
        const firstCells = rows[0].querySelectorAll('td');
        if (firstCells.length > 0) {
          const firstCell = firstCells[0];
          console.log(`🔍 第一個單元格狀態:`);
          console.log(`   內容: "${firstCell.textContent}"`);
          console.log(`   clientHeight: ${firstCell.clientHeight}px`);
          console.log(`   offsetHeight: ${firstCell.offsetHeight}px`);
          console.log(`   computed display: ${window.getComputedStyle(firstCell).display}`);
          console.log(`   computed height: ${window.getComputedStyle(firstCell).height}`);
          console.log(`   inline style: ${firstCell.getAttribute('style')}`);
        }
      }

      // 診斷表格本身
      console.log(`🔍 表格元素狀態:`);
      console.log(`   table.clientHeight: ${table.clientHeight}px`);
      console.log(`   table.scrollHeight: ${table.scrollHeight}px`);
      console.log(`   tbody.clientHeight: ${tbody.clientHeight}px`);
      console.log(`   table computed height: ${window.getComputedStyle(table).height}`);
      console.log(`   table computed display: ${window.getComputedStyle(table).display}`);

      // 診斷：顯示修復結果
      console.log(`✅ 表格結構已修復:`);
      console.log(`   行數: ${rows.length}`);
      console.log(`   容器高度: ${this.container.clientHeight}px (after fix)`);
      console.log(`   tbody 第一行高度: ${rows[0]?.clientHeight}px`);
      console.log(`   tbody.scrollHeight: ${tbody.scrollHeight}px (after fix)`);

      // 驗證容器是否可見
      const containerComputed = window.getComputedStyle(this.container);
      console.log(`🔍 容器計算樣式:`);
      console.log(`   display: ${containerComputed.display}`);
      console.log(`   visibility: ${containerComputed.visibility}`);
      console.log(`   opacity: ${containerComputed.opacity}`);
      console.log(`   height: ${containerComputed.height}`);
      console.log(`   overflow: ${containerComputed.overflow}`);
    }
  }

  /**
   * 顯示空狀態
   */
  showEmptyState() {
    // 支持 .table-empty-state 和 .csv-empty-state 兩種結構
    let emptyState = this.container?.querySelector('.table-empty-state');
    if (!emptyState) {
      emptyState = this.container?.querySelector('.csv-empty-state');
    }
    if (emptyState) {
      emptyState.style.display = 'flex';
    }
  }

  /**
   * 顯示表格面板
   */
  show() {
    // 支持 .table-panel 和 .csv-panel 兩種結構
    let panel = this.container?.closest('.table-panel');
    if (!panel) {
      panel = this.container?.closest('.csv-panel');
    }
    if (panel) {
      panel.style.display = 'block';
      console.log('✓ 表格面板已顯示');
      return true;
    }
    console.warn('⚠️ 表格面板未找到');
    return false;
  }

  /**
   * 隱藏表格面板
   */
  hide() {
    // 支持 .table-panel 和 .csv-panel 兩種結構
    let panel = this.container?.closest('.table-panel');
    if (!panel) {
      panel = this.container?.closest('.csv-panel');
    }
    if (panel) {
      panel.style.display = 'none';
      console.log('✓ 表格面板已隱藏');
      return true;
    }
    console.warn('⚠️ 表格面板未找到');
    return false;
  }

  /**
   * 啟用/禁用優化搜尋
   * @param {Boolean} enabled - 是否啟用
   */
  setOptimizedSearch(enabled) {
    this.useOptimizedSearch = enabled;
    console.log(`${enabled ? '✓' : '✗'} 優化搜尋已${enabled ? '啟用' : '禁用'}`);
  }

  /**
   * 獲取搜尋優化器統計信息
   * @returns {Object} 統計信息
   */
  getSearchStats() {
    return this.searchOptimizer.getStats();
  }

  /**
   * 打印搜尋性能報告
   */
  printSearchReport() {
    this.searchOptimizer.printReport();
  }

  /**
   * 重置搜尋快取
   */
  clearSearchCache() {
    this.searchOptimizer.searchCache.clear();
    this.lastSearchKeyword = '';
    console.log('✓ 搜尋快取已清空');
  }

  /**
   * 添加列篩選
   * @param {String} field - 欄位名
   * @param {Array} values - 允許的值
   */
  addColumnFilter(field, values) {
    this.advancedFilter.addColumnFilter(field, values);
    this.applyAllFilters();
    return this;
  }

  /**
   * 添加日期範圍篩選
   * @param {String} field - 日期欄位
   * @param {Date} startDate - 開始日期
   * @param {Date} endDate - 結束日期
   */
  addDateRangeFilter(field, startDate, endDate) {
    this.advancedFilter.addDateRange(field, startDate, endDate);
    this.applyAllFilters();
    return this;
  }

  /**
   * 添加數值範圍篩選
   * @param {String} field - 數值欄位
   * @param {Number} min - 最小值
   * @param {Number} max - 最大值
   */
  addNumericRangeFilter(field, min, max) {
    this.advancedFilter.addNumericRange(field, min, max);
    this.applyAllFilters();
    return this;
  }

  /**
   * 應用所有篩選（搜尋 + 高級篩選）
   */
  applyAllFilters() {
    if (!this.useAdvancedFilter || this.advancedFilter.columnFilters.size === 0 &&
        this.advancedFilter.dateRanges.size === 0 &&
        this.advancedFilter.numericRanges.size === 0) {
      // 沒有高級篩選，使用搜尋篩選
      return;
    }

    // 執行高級篩選
    const filterResult = this.advancedFilter.filter(this.data);
    this.filteredData = filterResult.results;

    console.log(`🔍 高級篩選完成 - ${this.filteredData.length} 筆結果 (${filterResult.time}ms)`);

    this.render();
  }

  /**
   * 清空所有篩選
   */
  clearAllFilters() {
    this.advancedFilter.clear();
    this.filteredData = [...this.data];

    const filterInput = this.container?.querySelector('.table-filter-input');
    if (filterInput) {
      filterInput.value = '';
    }

    console.log('✓ 所有篩選已清空');
    this.render();
    return this;
  }

  /**
   * 獲取高級篩選統計
   */
  getFilterStats() {
    return this.advancedFilter.getStats();
  }

  /**
   * 打印高級篩選報告
   */
  printFilterReport() {
    this.advancedFilter.printReport();
  }
}

// 導出供全局使用
window.TableAdapter = TableAdapter;
window.CSVTableAdapter = CSVTableAdapter;
window.StandardTableAdapter = StandardTableAdapter;
window.RulesTableAdapter = RulesTableAdapter;
window.TableRenderer = TableRenderer;
