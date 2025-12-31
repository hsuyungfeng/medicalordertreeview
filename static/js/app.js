/**
 * 應用主邏輯初始化
 */

class MedicalTreeApp {
  constructor() {
    this.treeLoader = null;
    this.csvHandler = null;
    this.searchDebounceTimer = null;
    this.searchDebounceDelay = 300;
  }

  /**
   * 初始化應用
   */
  async init() {
    try {
      console.log('正在初始化應用...');

      // 綁定事件
      this.bindEvents();

      // 初始化樹狀導航
      const treeContainer = document.querySelector('.tree-container');
      if (!treeContainer) {
        throw new Error('樹容器元素不存在');
      }

      console.log('樹容器已找到:', treeContainer);

      this.treeLoader = new LazyTreeLoader(treeContainer, 'data');
      await this.treeLoader.init();

      // 初始化 CSV 處理器（用於搜尋功能）
      this.csvHandler = new CSVHandler('data');
      await this.csvHandler.init();

      // 初始化文檔表格渲染器（新系統）
      if (window.DocTableRenderer) {
        window.docTableRenderer = new DocTableRenderer('.csv-table-container');
        console.log('✓ 文檔表格渲染器已初始化');
      } else {
        console.warn('⚠️ 文檔表格渲染器未找到');
      }

      console.log('✅ 應用初始化完成');
      console.log('樹節點總數:', this.treeLoader.allNodes.size);
    } catch (error) {
      console.error('❌ 應用初始化失敗:', error);
      this.showError('應用初始化失敗，請刷新頁面重試。' + error.message);
    }
  }

  /**
   * 綁定事件處理器
   */
  bindEvents() {
    const searchInput = document.querySelector('.search-input');
    const searchButton = document.querySelector('.search-button');
    const clearButton = document.querySelector('.clear-button');
    const closeSearchResultsBtn = document.querySelector('.close-search-results');

    if (searchInput && searchButton && clearButton) {
      // 搜索框輸入事件（防抖）
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = setTimeout(() => {
          this.handleSearch(e.target.value);
        }, this.searchDebounceDelay);
      });

      // 搜索按鈕
      searchButton.addEventListener('click', () => {
        this.handleSearch(searchInput.value);
      });

      // 清空按鈕
      clearButton.addEventListener('click', () => {
        searchInput.value = '';
        this.treeLoader.clearSearch();
      });

      // 按 Enter 鍵搜索
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          clearTimeout(this.searchDebounceTimer);
          this.handleSearch(e.target.value);
        }
      });

      // 關閉搜尋結果按鈕
      if (closeSearchResultsBtn) {
        closeSearchResultsBtn.addEventListener('click', () => {
          this.treeLoader.clearSearch();
        });
      }
    }
  }

  /**
   * 處理搜索
   */
  async handleSearch(query) {
    try {
      if (!query || !query.trim()) {
        const resultsPanel = document.querySelector('.search-results-panel');
        if (resultsPanel) {
          resultsPanel.style.display = 'none';
        }
        return;
      }

      // 執行搜索
      const results = await this.treeLoader.search(query);

      // 顯示結果
      this.treeLoader.displaySearchResults(results);

      console.log(`✓ 搜尋完成: 找到 ${results.length} 個結果`);
    } catch (error) {
      console.error('❌ 搜索失敗:', error);
      this.showError('搜索失敗，請稍後重試。');
    }
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
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 顯示錯誤信息
   */
  showError(message) {
    const treeContainer = document.querySelector('.tree-container');
    treeContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-text">${this.escapeHtml(message)}</div>
      </div>
    `;
  }
}

// ============================================
// 全局狀態管理初始化
// ============================================

let globalStateManager;

/**
 * 初始化全局狀態管理系統
 */
async function initializeStateManagement(app) {
  if (!window.GlobalStateManager) {
    console.warn('⚠️ GlobalStateManager 未加載，跳過狀態管理初始化');
    return;
  }

  try {
    globalStateManager = new GlobalStateManager(
      app.treeLoader,
      window.csvTableRenderer,
      window.tabsManager
    );

    // 初始化並恢復所有狀態
    await globalStateManager.initialize();

    // 移除骨架屏
    const skeleton = document.getElementById('tree-skeleton');
    if (skeleton) {
      skeleton.remove();
    }

    console.log('✓ 全局狀態管理已啟用');
  } catch (error) {
    console.error('❌ 狀態管理初始化失敗:', error);
  }
}

/**
 * 頁面卸載前保存狀態
 */
window.addEventListener('beforeunload', () => {
  if (globalStateManager) {
    globalStateManager.saveAll();
  }
});

/**
 * 頁面加載時初始化應用
 */
document.addEventListener('DOMContentLoaded', async () => {
  const app = new MedicalTreeApp();
  await app.init();

  // 將應用實例暴露到全局以便調試
  window.app = app;

  // 延遲 1 秒後初始化狀態管理（確保樹加載完成）
  setTimeout(async () => {
    await initializeStateManagement(app);
  }, 1000);
});
