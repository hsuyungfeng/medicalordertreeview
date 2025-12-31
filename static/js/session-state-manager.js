/**
 * 全局會話狀態管理器
 * 管理樹狀導航、表格、搜尋等狀態的持久化
 * 支援 localStorage 自動保存和恢復
 */

/**
 * 樹狀態管理器
 * 負責保存和恢復樹的展開狀態、麵包屑路徑、選中節點等
 */
class TreeStateManager {
  constructor(treeLoader, storageKey = 'medical-tree-state') {
    this.treeLoader = treeLoader;
    this.storageKey = storageKey;
    this.autoSaveDelay = 1000; // 防抖延遲（毫秒）
    this.saveTimer = null;
  }

  /**
   * 保存樹狀態到 localStorage
   */
  saveState() {
    const state = {
      expandedNodes: Array.from(this.treeLoader.expandedNodes || []),
      breadcrumbPath: Array.from(this.treeLoader.breadcrumbPath || []),
      selectedNode: this.getSelectedNode(),
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      console.log('💾 樹狀態已保存:', state.expandedNodes.length, '個展開節點');
      return true;
    } catch (error) {
      console.warn('⚠️ 樹狀態保存失敗:', error.message);
      return false;
    }
  }

  /**
   * 從 localStorage 恢復樹狀態（異步展開節點）
   */
  async restoreState() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) {
        console.log('ℹ️ 無保存的樹狀態');
        return false;
      }

      const state = JSON.parse(stateJson);

      // 異步展開所有保存的節點
      for (const nodeId of state.expandedNodes) {
        await this.expandNodeById(nodeId);
      }

      // 恢復選中節點
      if (state.selectedNode) {
        this.selectNodeById(state.selectedNode);
      }

      console.log('✓ 樹狀態已恢復:', state.expandedNodes.length, '個節點');
      return true;
    } catch (error) {
      console.warn('⚠️ 樹狀態恢復失敗:', error.message);
      return false;
    }
  }

  /**
   * 防抖保存（延遲執行，避免頻繁寫入）
   */
  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveState();
    }, this.autoSaveDelay);
  }

  /**
   * 展開指定的節點（通過模擬點擊）
   */
  async expandNodeById(nodeId) {
    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!element) {
      console.warn(`⚠️ 節點未找到: ${nodeId}`);
      return;
    }

    const header = element.querySelector('.tree-node-header');
    if (!header) return;

    // 檢查節點是否已展開
    if (this.treeLoader.expandedNodes && !this.treeLoader.expandedNodes.has(nodeId)) {
      header.click();
      // 等待展開動畫完成
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * 選中節點並滾動到可見區域
   */
  selectNodeById(nodeId) {
    const element = document.querySelector(`[data-node-id="${nodeId}"]`);
    if (!element) return;

    const header = element.querySelector('.tree-node-header');
    if (header) {
      header.click();
      header.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * 獲取當前選中節點的 ID
   */
  getSelectedNode() {
    const activeHeader = document.querySelector('.tree-node-header.active');
    if (!activeHeader) return null;

    const nodeElement = activeHeader.closest('.tree-node');
    return nodeElement?.getAttribute('data-node-id') || null;
  }

  /**
   * 清空已保存的樹狀態
   */
  clearState() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('✓ 樹狀態已清空');
      return true;
    } catch (error) {
      console.warn('⚠️ 樹狀態清空失敗:', error.message);
      return false;
    }
  }
}

/**
 * 表格狀態管理器
 * 負責保存和恢復表格排序、標籤位置、滾動位置等
 */
class TableStateManager {
  constructor(tableRenderer, tabsManager, storageKey = 'medical-table-state') {
    this.tableRenderer = tableRenderer;
    this.tabsManager = tabsManager;
    this.storageKey = storageKey;
    this.autoSaveDelay = 1000;
    this.saveTimer = null;
  }

  /**
   * 保存表格狀態到 localStorage
   */
  saveState() {
    const csvPanel = document.querySelector('.csv-panel');
    const tableContainer = csvPanel?.querySelector('.csv-table-container');

    const state = {
      currentTabId: this.tabsManager?.currentTabId || null,
      sortColumn: this.tableRenderer?.sortColumn || null,
      sortDirection: this.tableRenderer?.sortDirection || 'asc',
      scrollPosition: tableContainer?.scrollTop || 0,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      console.log('💾 表格狀態已保存');
      return true;
    } catch (error) {
      console.warn('⚠️ 表格狀態保存失敗:', error.message);
      return false;
    }
  }

  /**
   * 從 localStorage 恢復表格狀態
   */
  restoreState() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) {
        console.log('ℹ️ 無保存的表格狀態');
        return false;
      }

      const state = JSON.parse(stateJson);

      // 恢復標籤位置
      if (state.currentTabId && this.tabsManager && this.tabsManager.currentTabId !== state.currentTabId) {
        if (typeof this.tabsManager.activateTab === 'function') {
          this.tabsManager.activateTab(state.currentTabId);
        }
      }

      // 恢復排序
      if (state.sortColumn && this.tableRenderer) {
        this.tableRenderer.sortColumn = state.sortColumn;
        this.tableRenderer.sortDirection = state.sortDirection;
        if (typeof this.tableRenderer.updateSortIndicators === 'function') {
          this.tableRenderer.updateSortIndicators();
        }
      }

      // 延遲恢復滾動位置（避免抖動）
      if (state.scrollPosition > 0) {
        setTimeout(() => {
          const csvPanel = document.querySelector('.csv-panel');
          const tableContainer = csvPanel?.querySelector('.csv-table-container');
          if (tableContainer) {
            tableContainer.scrollTop = state.scrollPosition;
          }
        }, 500);
      }

      console.log('✓ 表格狀態已恢復');
      return true;
    } catch (error) {
      console.warn('⚠️ 表格狀態恢復失敗:', error.message);
      return false;
    }
  }

  /**
   * 防抖保存
   */
  scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveState();
    }, this.autoSaveDelay);
  }

  /**
   * 清空已保存的表格狀態
   */
  clearState() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('✓ 表格狀態已清空');
      return true;
    } catch (error) {
      console.warn('⚠️ 表格狀態清空失敗:', error.message);
      return false;
    }
  }
}

/**
 * 搜尋狀態管理器
 * 負責保存和恢復搜尋關鍵字
 */
class SearchStateManager {
  constructor(storageKey = 'medical-search-state') {
    this.storageKey = storageKey;
  }

  /**
   * 保存搜尋關鍵字
   */
  saveSearchKeyword(keyword) {
    const state = {
      lastKeyword: keyword,
      lastSearchTime: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      return true;
    } catch (error) {
      console.warn('⚠️ 搜尋狀態保存失敗:', error.message);
      return false;
    }
  }

  /**
   * 恢復搜尋關鍵字
   */
  restoreSearchKeyword() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) return null;

      const state = JSON.parse(stateJson);
      return state.lastKeyword || null;
    } catch (error) {
      console.warn('⚠️ 搜尋狀態恢復失敗:', error.message);
      return null;
    }
  }

  /**
   * 清空已保存的搜尋狀態
   */
  clearState() {
    try {
      localStorage.removeItem(this.storageKey);
      console.log('✓ 搜尋狀態已清空');
      return true;
    } catch (error) {
      console.warn('⚠️ 搜尋狀態清空失敗:', error.message);
      return false;
    }
  }
}

/**
 * 全局狀態管理器（協調器）
 * 統一管理所有狀態管理器，協調初始化和自動保存
 */
class GlobalStateManager {
  constructor(treeLoader, tableRenderer, tabsManager) {
    this.treeState = new TreeStateManager(treeLoader);
    this.tableState = new TableStateManager(tableRenderer, tabsManager);
    this.searchState = new SearchStateManager();
    this.treeLoader = treeLoader;
    this.tableRenderer = tableRenderer;
    this.tabsManager = tabsManager;
  }

  /**
   * 初始化並恢復所有狀態
   */
  async initialize() {
    console.log('🔄 初始化全局狀態管理器...');

    try {
      // 1. 恢復搜尋關鍵字
      const lastKeyword = this.searchState.restoreSearchKeyword();
      if (lastKeyword) {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) {
          searchInput.value = lastKeyword;
        }
      }

      // 2. 異步恢復樹狀態
      await this.treeState.restoreState();

      // 3. 恢復表格狀態
      this.tableState.restoreState();

      // 4. 綁定自動保存
      this.bindAutoSave();

      console.log('✓ 全局狀態管理器初始化完成');
    } catch (error) {
      console.error('❌ 狀態管理器初始化失敗:', error);
    }
  }

  /**
   * 綁定自動保存事件
   */
  bindAutoSave() {
    // 監聽樹節點展開/收合（MutationObserver）
    const treePanel = document.querySelector('.tree-container');
    if (treePanel) {
      const observer = new MutationObserver(() => {
        this.treeState.scheduleSave();
      });

      observer.observe(treePanel, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    }

    // 監聽表格排序
    if (this.tableRenderer && typeof this.tableRenderer.sortByColumn === 'function') {
      const originalSort = this.tableRenderer.sortByColumn.bind(this.tableRenderer);
      this.tableRenderer.sortByColumn = (...args) => {
        originalSort(...args);
        this.tableState.scheduleSave();
      };
    }

    // 監聽滾動（防抖）
    const csvPanel = document.querySelector('.csv-panel');
    const tableContainer = csvPanel?.querySelector('.csv-table-container');
    if (tableContainer) {
      let scrollTimer;
      tableContainer.addEventListener('scroll', () => {
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          this.tableState.scheduleSave();
        }, 300);
      });
    }

    // 監聽搜尋輸入
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchState.saveSearchKeyword(e.target.value);
      });
    }

    console.log('✓ 自動保存事件已綁定');
  }

  /**
   * 清空所有狀態
   */
  clearAll() {
    this.treeState.clearState();
    this.tableState.clearState();
    this.searchState.clearState();
    console.log('✓ 所有狀態已清空');
  }

  /**
   * 手動保存所有狀態
   */
  saveAll() {
    this.treeState.saveState();
    this.tableState.saveState();
    console.log('✓ 所有狀態已手動保存');
  }

  /**
   * 獲取狀態統計信息
   */
  getStats() {
    return {
      tree: {
        expandedNodes: this.treeLoader?.expandedNodes?.size || 0,
        selectedNode: this.treeState.getSelectedNode()
      },
      table: {
        currentTab: this.tabsManager?.currentTabId || null,
        sortColumn: this.tableRenderer?.sortColumn || null,
        sortDirection: this.tableRenderer?.sortDirection || 'asc'
      },
      search: {
        lastKeyword: this.searchState.restoreSearchKeyword()
      }
    };
  }
}

// 全局導出
window.TreeStateManager = TreeStateManager;
window.TableStateManager = TableStateManager;
window.SearchStateManager = SearchStateManager;
window.GlobalStateManager = GlobalStateManager;

console.log('✅ 會話狀態管理器已加載');
