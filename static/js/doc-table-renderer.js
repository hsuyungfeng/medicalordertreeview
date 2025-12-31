/**
 * 文檔表格渲染器
 * 管理文檔表格的加載、顯示和交互
 */

class DocTableRenderer {
  /**
   * 構造函數
   * @param {string} containerId - 容器 CSS 選擇器
   */
  constructor(containerId = '.csv-table-container') {
    this.csvPanel = document.querySelector('.csv-panel');
    this.container = document.querySelector(containerId);

    // 初始化適配器和通用渲染器
    this.adapter = new DocTableAdapter();
    this.renderer = new TableRenderer(containerId, this.adapter);

    // 綁定事件
    this.setupEvents();

    console.log('✅ 文檔表格渲染器已初始化');
  }

  /**
   * 設置事件監聽
   */
  setupEvents() {
    // 關閉按鈕
    const closeBtn = document.querySelector('.close-csv-panel');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }
  }

  /**
   * 為節點顯示表格
   * @param {string} nodeId - 節點 ID
   */
  async showTableForNode(nodeId) {
    try {
      // 加載表格數據
      const docData = await this.adapter.loadTablesForNode(nodeId);

      if (!docData) {
        console.warn(`⚠️ 節點 ${nodeId} 無表格數據`);
        this.showEmptyState();
        return;
      }

      // 獲取當前表格
      const current = this.adapter.getCurrentTable();
      if (!current) {
        this.showEmptyState();
        return;
      }

      // 更新面板標題
      this.updatePanelHeader();

      // 獲取並渲染表格數據
      const data = this.adapter.getData();
      console.log(`📊 渲染表格: ${data.length} 行, ${this.adapter.getColumns().length} 列`);

      this.renderer.setData(data);
      this.renderer.reset();
      this.renderer.render();

      // 顯示面板
      this.show();

      // 優化：移除骨架屏
      const skeleton = document.getElementById('tree-skeleton');
      if (skeleton) {
        skeleton.style.display = 'none';
      }
    } catch (error) {
      console.error('❌ 顯示表格時出錯:', error);
      this.showEmptyState('加載表格時出錯');
    }
  }

  /**
   * 更新面板標題
   */
  updatePanelHeader() {
    const metadata = this.adapter.getTableMetadata();
    if (!metadata) return;

    const header = document.querySelector('.csv-panel-header h3');
    if (header) {
      const tableLabel = metadata.totalTables > 1
        ? `[${metadata.tableIndex + 1}/${metadata.totalTables}]`
        : '';

      header.innerHTML = `📊 ${metadata.sectionHeading} ${tableLabel} <span class="csv-item-count">(${metadata.rowCount} 行)</span>`;
    }
  }

  /**
   * 顯示空狀態
   * @param {string} message - 顯示的消息
   */
  showEmptyState(message = '此節點無相關表格') {
    // 隱藏表格
    const table = document.querySelector('.csv-table');
    if (table) {
      table.style.display = 'none';
    }

    // 顯示空狀態提示
    let emptyState = document.querySelector('.csv-empty-state');
    if (!emptyState) {
      // 創建空狀態容器
      emptyState = document.createElement('div');
      emptyState.className = 'csv-empty-state';
      emptyState.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        color: #999;
        font-size: 14px;
        padding: 20px;
        text-align: center;
      `;
      this.container.appendChild(emptyState);
    }

    emptyState.innerHTML = `<p>ℹ️ ${message}</p>`;
    emptyState.style.display = 'flex';

    // 更新標題
    const header = document.querySelector('.csv-panel-header h3');
    if (header) {
      header.innerHTML = `📊 相關表格 <span class="csv-item-count">(0)</span>`;
    }

    // 顯示面板
    this.show();
  }

  /**
   * 顯示面板
   */
  show() {
    try {
      if (!this.csvPanel) {
        console.error('❌ csvPanel 未初始化（在 constructor 中應該已設置）');
        // 嘗試重新獲取
        this.csvPanel = document.querySelector('.csv-panel');
      }

      if (this.csvPanel) {
        console.log('📺 正在顯示表格面板...');
        this.csvPanel.style.display = 'flex';
        console.log('✓ 設置 csvPanel display: flex');

        // 確保主容器切換到兩列佈局
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
          mainContainer.classList.add('two-panel');
          console.log('✓ 添加 two-panel 類到主容器');
        } else {
          console.warn('⚠️ .main-container 未找到');
        }
      } else {
        console.error('❌ .csv-panel 元素未找到，無法顯示表格');
      }
    } catch (e) {
      console.error('❌ show() 方法出現錯誤:', e);
    }
  }

  /**
   * 隱藏面板
   */
  hide() {
    if (this.csvPanel) {
      this.csvPanel.style.display = 'none';

      // 移除兩列佈局
      const mainContainer = document.querySelector('.main-container');
      if (mainContainer) {
        mainContainer.classList.remove('two-panel');
      }
    }
  }

  /**
   * 切換到下一個表格
   */
  nextTable() {
    if (this.adapter.nextTable()) {
      const metadata = this.adapter.getTableMetadata();
      console.log(`➡️ 切換到表格 ${metadata.tableIndex + 1}/${metadata.totalTables}`);

      // 重新渲染
      const data = this.adapter.getData();
      this.renderer.setData(data);
      this.renderer.reset();
      this.renderer.render();

      // 更新標題
      this.updatePanelHeader();
      return true;
    }
    return false;
  }

  /**
   * 切換到上一個表格
   */
  previousTable() {
    if (this.adapter.previousTable()) {
      const metadata = this.adapter.getTableMetadata();
      console.log(`⬅️ 切換到表格 ${metadata.tableIndex + 1}/${metadata.totalTables}`);

      // 重新渲染
      const data = this.adapter.getData();
      this.renderer.setData(data);
      this.renderer.reset();
      this.renderer.render();

      // 更新標題
      this.updatePanelHeader();
      return true;
    }
    return false;
  }
}

// 導出供全局使用
window.DocTableRenderer = DocTableRenderer;
