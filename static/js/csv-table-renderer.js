/**
 * CSV 表格渲染器（向後相容性包裝）
 * 使用新的 TableRenderer + CSVTableAdapter 架構
 * 保持舊的 API 兼容性
 */

class CSVTableRenderer {
  constructor(containerId = '.csv-table-container', csvData = []) {
    // 查找實際容器
    this.csvPanel = document.querySelector('.csv-panel');
    this.container = this.csvPanel?.querySelector('.csv-table-container');
    this.csvData = csvData;
    this.currentSectionId = null;

    // 初始化新的渲染系統
    this.adapter = new CSVTableAdapter();
    this.renderer = new TableRenderer('.csv-table-container', this.adapter);
    this.renderer.setData(csvData);

    // 綁定事件
    this.setupLegacyEvents();
  }

  /**
   * 設置舊版本事件監聽（與舊 HTML 結構兼容）
   */
  setupLegacyEvents() {
    // 關閉按鈕
    const closeBtn = document.querySelector('.close-csv-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 篩選輸入框
    const filterInput = document.querySelector('.csv-filter-input');
    if (filterInput) {
      filterInput.addEventListener('input', (e) => {
        this.filterByKeyword(e.target.value);
      });
    }

    // 排序選擇下拉菜單
    const sortSelect = document.querySelector('.csv-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        if (e.target.value !== 'none') {
          this.sortByColumn(e.target.value);
        }
      });
    }

    // 表格列點擊排序
    this.bindTableHeaderEvents();
  }

  /**
   * 綁定表格列點擊事件
   */
  bindTableHeaderEvents() {
    const table = document.querySelector('.csv-table');
    if (table) {
      const headers = table.querySelectorAll('th[data-column]');
      headers.forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);

        newHeader.addEventListener('click', (e) => {
          const column = newHeader.getAttribute('data-column');
          this.sortByColumn(column);
        });
      });
    }
  }

  /**
   * 根據代碼範圍篩選 CSV 項目
   * @param {string} startCode - 起始代碼 (例如: 48001)
   * @param {string} endCode - 結束代碼 (例如: 48035)
   */
  filterByCodeRange(startCode, endCode) {
    console.log(`🔄 filterByCodeRange 被調用: ${startCode}-${endCode}`);
    console.log(`  CSV 適配器: ${!!this.adapter}, 渲染器: ${!!this.renderer}`);
    console.log(`  CSV 數據總數: ${this.csvData.length}`);

    const startNum = parseInt(startCode);
    const endNum = parseInt(endCode);

    if (isNaN(startNum) || isNaN(endNum)) {
      console.error(`❌ 無效的代碼範圍: ${startCode}-${endCode}`);
      return;
    }

    // 篩選在範圍內的項目
    const filtered = this.csvData.filter(item => {
      const itemCode = parseInt(item.code || 0);
      return itemCode >= startNum && itemCode <= endNum;
    });

    console.log(`📊 按代碼範圍篩選: ${startCode}-${endCode} (${filtered.length} 筆)`);

    if (filtered.length === 0) {
      console.warn(`⚠️ 警告: 該代碼範圍沒有相關數據！`);
    }

    // 設置篩選後的數據
    console.log(`  設置渲染器數據...`);
    this.renderer.setData(filtered);

    console.log(`  調用 reset()...`);
    this.renderer.reset();

    console.log(`  調用 render()...`);
    this.renderer.render();

    console.log(`✅ 表格更新完成`);

    // 更新計數器
    this.updateItemCount(filtered.length);

    // 重置篩選輸入
    this.resetFilterInput();
  }

  /**
   * 根據章節 ID 篩選 CSV 項目
   * @param {string|null} sectionId - 章節 ID，null 表示顯示所有
   */
  filterBySectionId(sectionId) {
    this.currentSectionId = sectionId;

    console.log(`🔄 filterBySectionId 被調用: sectionId=${sectionId}`);
    console.log(`  CSV 適配器: ${!!this.adapter}, 渲染器: ${!!this.renderer}`);
    console.log(`  CSV 數據總數: ${this.csvData.length}`);

    // 如果 sectionId 為 null 或 undefined，顯示所有數據
    let filtered;
    if (!sectionId) {
      filtered = this.csvData;
      console.log(`📊 顯示所有 CSV 數據 (${this.csvData.length} 筆)`);
    } else {
      // 使用適配器篩選
      const codePrefixes = this.adapter.getCodePrefixesForSection(sectionId);
      console.log(`  🔍 Section ID: ${sectionId}, 代碼前綴: [${codePrefixes.join(', ')}]`);

      filtered = this.adapter.filterBySection(this.csvData, sectionId);
      console.log(`📊 按 section ID 篩選: ${sectionId} (${filtered.length} 筆)`);

      if (filtered.length === 0) {
        console.warn(`⚠️ 警告: 該 section 沒有相關數據！`);
        console.log(`  - 檢查 sectionCodeMap 是否包含此 section`);
        console.log(`  - 檢查 CSV 數據中是否有匹配的代碼`);
      }
    }

    // 設置篩選後的數據
    console.log(`  設置渲染器數據...`);
    this.renderer.setData(filtered);

    console.log(`  調用 reset()...`);
    this.renderer.reset();

    console.log(`  調用 render()...`);
    this.renderer.render();

    console.log(`✅ 表格更新完成`);

    // 更新計數器
    this.updateItemCount(filtered.length);

    // 重置篩選輸入
    this.resetFilterInput();
  }

  /**
   * 更新計數器顯示
   * @param {number} count - 項目數量
   */
  updateItemCount(count) {
    const itemCountEl = document.querySelector('.csv-item-count');
    if (itemCountEl) {
      itemCountEl.textContent = `(${count})`;
    }
  }

  /**
   * 重置篩選輸入框（已移除排序功能）
   */
  resetFilterInput() {
    // 篩選輸入框和排序選項已被移除
    // 保留此方法以便將來擴展
  }

  /**
   * 根據關鍵字篩選
   */
  filterByKeyword(keyword) {
    this.renderer.filterByKeyword(keyword);
  }

  /**
   * 按列排序
   */
  sortByColumn(column) {
    this.renderer.sortByColumn(column);
  }

  /**
   * 更新排序指示器
   */
  updateSortIndicators() {
    this.renderer.updateSortIndicators();
  }

  /**
   * 渲染表格
   */
  render() {
    this.renderer.render();
  }

  /**
   * 顯示 CSV 面板
   */
  show() {
    this.renderer.show();
  }

  /**
   * 隱藏 CSV 面板
   */
  hide() {
    this.renderer.hide();
  }

  /**
   * 設置 CSV 數據
   */
  setData(csvData) {
    this.csvData = csvData || [];
    this.renderer.setData(csvData);
    console.log(`✓ CSV 表格數據已設置: ${this.csvData.length} 筆`);
  }
}

// 導出供全局使用
window.CSVTableRenderer = CSVTableRenderer;
