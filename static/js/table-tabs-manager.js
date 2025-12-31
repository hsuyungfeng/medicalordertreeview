/**
 * 表格標籤管理系統
 * 管理多表格的標籤切換邏輯
 */

class TableTabsManager {
  constructor(tabsContainerSelector = '.tabs-container') {
    this.tabsContainer = document.querySelector(tabsContainerSelector);
    this.tabsWrapper = document.querySelector('.table-tabs');
    this.tabs = []; // 所有標籤配置
    this.currentTabId = null; // 當前活躍標籤
    this.renderers = {}; // 表格渲染器映射 {tabId: renderer}
    this.changeCallbacks = []; // 標籤切換回調函數
  }

  /**
   * 註冊表格標籤
   * @param {Object} tab - 標籤配置
   *   - id: 標籤唯一識別符
   *   - label: 標籤顯示文本
   *   - description: 標籤說明（可選）
   *   - type: 表格類型（csv, standard, rules）
   *   - itemCount: 表格項目數量（可選）
   *   - renderer: TableRenderer 實例
   */
  registerTab(tab) {
    if (!tab.id || !tab.label) {
      console.error('標籤配置不完整，需要 id 和 label');
      return;
    }

    // 檢查是否已存在
    const existing = this.tabs.find(t => t.id === tab.id);
    if (existing) {
      console.warn(`標籤 ${tab.id} 已存在，更新配置`);
      Object.assign(existing, tab);
      this.renderers[tab.id] = tab.renderer;
      return;
    }

    // 添加新標籤
    this.tabs.push({
      id: tab.id,
      label: tab.label,
      description: tab.description || '',
      type: tab.type || 'csv', // 預設為 csv
      itemCount: tab.itemCount || 0, // 預設為 0
      active: false
    });

    this.renderers[tab.id] = tab.renderer;
    console.log(`✓ 標籤已註冊: ${tab.id} (類型: ${tab.type || 'csv'})`);
  }

  /**
   * 註冊多個標籤
   * @param {Array} tabs - 標籤配置數組
   */
  registerTabs(tabs) {
    tabs.forEach(tab => this.registerTab(tab));
  }

  /**
   * 清空所有標籤
   */
  clearTabs() {
    this.tabs = [];
    this.renderers = {};
    this.currentTabId = null;
  }

  /**
   * 渲染標籤欄
   */
  renderTabs() {
    if (!this.tabsContainer) {
      console.error('標籤容器未找到');
      return;
    }

    // 如果只有一個或沒有標籤，隱藏標籤欄
    if (this.tabs.length <= 1) {
      if (this.tabsWrapper) {
        this.tabsWrapper.style.display = 'none';
      }
      // 如果有標籤，直接激活它
      if (this.tabs.length === 1) {
        this.activateTab(this.tabs[0].id);
      }
      return;
    }

    // 顯示標籤欄
    if (this.tabsWrapper) {
      this.tabsWrapper.style.display = 'flex';
    }

    // 生成標籤按鈕 HTML
    const tabsHTML = this.tabs.map((tab, index) => {
      const tableType = tab.type || 'csv';
      const itemCount = tab.itemCount || 0;
      const countBadge = itemCount > 0 ? `<span class="tab-count">${itemCount}</span>` : '';

      return `
        <button
          class="tab-button ${index === 0 ? 'active' : ''}"
          data-tab-id="${tab.id}"
          data-table-type="${tableType}"
          title="${tab.description}"
        >
          ${this.escapeHtml(tab.label)}
          ${countBadge}
        </button>
      `;
    }).join('');

    this.tabsContainer.innerHTML = tabsHTML;

    // 綁定標籤按鈕事件
    this.bindTabEvents();

    // 默認激活第一個標籤
    if (this.tabs.length > 0) {
      this.activateTab(this.tabs[0].id);
    }

    console.log(`✓ 標籤欄已渲染: ${this.tabs.length} 個標籤`);
  }

  /**
   * 綁定標籤按鈕事件
   */
  bindTabEvents() {
    const buttons = this.tabsContainer?.querySelectorAll('.tab-button');
    if (!buttons) return;

    buttons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const tabId = button.getAttribute('data-tab-id');
        this.activateTab(tabId);
      });
    });
  }

  /**
   * 激活指定標籤
   * @param {String} tabId - 標籤 ID
   */
  activateTab(tabId) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) {
      console.warn(`標籤 ${tabId} 不存在`);
      return;
    }

    // 更新標籤狀態
    this.tabs.forEach(t => t.active = (t.id === tabId));

    // 更新按鈕狀態
    const buttons = this.tabsContainer?.querySelectorAll('.tab-button');
    buttons?.forEach(btn => {
      if (btn.getAttribute('data-tab-id') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.currentTabId = tabId;

    // 隱藏所有表格，顯示當前表格
    this.hideAllTables();
    const renderer = this.renderers[tabId];
    if (renderer) {
      renderer.show();
    }

    console.log(`✓ 標籤已激活: ${tabId}`);

    // 觸發回調函數
    this.changeCallbacks.forEach(callback => callback(tabId));
  }

  /**
   * 隱藏所有表格
   */
  hideAllTables() {
    Object.values(this.renderers).forEach(renderer => {
      if (renderer && typeof renderer.hide === 'function') {
        renderer.hide();
      }
    });
  }

  /**
   * 獲取當前激活的標籤
   */
  getCurrentTab() {
    return this.tabs.find(t => t.active);
  }

  /**
   * 獲取當前激活的渲染器
   */
  getCurrentRenderer() {
    return this.renderers[this.currentTabId];
  }

  /**
   * 添加標籤切換回調
   * @param {Function} callback - 回調函數 (tabId) => void
   */
  onTabChange(callback) {
    this.changeCallbacks.push(callback);
  }

  /**
   * 移除標籤切換回調
   * @param {Function} callback - 要移除的回調函數
   */
  offTabChange(callback) {
    const index = this.changeCallbacks.indexOf(callback);
    if (index > -1) {
      this.changeCallbacks.splice(index, 1);
    }
  }

  /**
   * 更新標籤標籤文本
   * @param {String} tabId - 標籤 ID
   * @param {String} newLabel - 新標籤文本
   */
  updateTabLabel(tabId, newLabel) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      tab.label = newLabel;
      const button = this.tabsContainer?.querySelector(`[data-tab-id="${tabId}"]`);
      if (button) {
        button.textContent = this.escapeHtml(newLabel);
      }
    }
  }

  /**
   * 獲取所有標籤統計
   */
  getStats() {
    return {
      totalTabs: this.tabs.length,
      currentTab: this.currentTabId,
      tabs: this.tabs.map(t => ({
        id: t.id,
        label: t.label,
        active: t.active
      }))
    };
  }

  /**
   * HTML 轉義
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

  /**
   * 清空容器
   */
  clear() {
    if (this.tabsContainer) {
      this.tabsContainer.innerHTML = '';
    }
    if (this.tabsWrapper) {
      this.tabsWrapper.style.display = 'none';
    }
    this.hideAllTables();
  }
}

// 導出供全局使用
window.TableTabsManager = TableTabsManager;
