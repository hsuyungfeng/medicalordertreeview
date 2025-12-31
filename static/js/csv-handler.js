/**
 * CSV 項目處理器
 * 支持虛擬滾動、分片加載、搜索過濾
 */

class CSVHandler {
  constructor(dataBasePath = 'data') {
    this.dataBasePath = dataBasePath;
    this.itemsIndex = null;
    this.loadedChunks = new Map(); // 已加載的分片緩存
    this.allItems = []; // 所有項目（搜索用）
    this.filteredItems = []; // 過濾後的項目
    this.chunkSize = 1000;
  }

  /**
   * 初始化 CSV 索引
   */
  async init() {
    try {
      this.itemsIndex = await this.fetchJSON(`${this.dataBasePath}/csv-items/items-index.json`);
      console.log(`✓ CSV 索引已加載: ${this.itemsIndex.total_items} 個項目, ${this.itemsIndex.chunks.length} 個分片`);
      return this.itemsIndex;
    } catch (error) {
      console.error('❌ 加載 CSV 索引失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取 JSON 數據
   */
  async fetchJSON(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${url}`);
    }
    return response.json();
  }

  /**
   * 加載指定的分片
   */
  async loadChunk(chunkId) {
    // 檢查緩存
    if (this.loadedChunks.has(chunkId)) {
      return this.loadedChunks.get(chunkId);
    }

    try {
      const chunk = this.itemsIndex.chunks.find(c => c.id === chunkId);
      if (!chunk) {
        throw new Error(`分片不存在: ${chunkId}`);
      }

      const data = await this.fetchJSON(chunk.file);

      // 緩存
      this.loadedChunks.set(chunkId, data);

      // 加入全部項目（用於搜索）
      this.allItems.push(...data);

      return data;
    } catch (error) {
      console.error(`加載分片失敗 (${chunkId}):`, error);
      throw error;
    }
  }

  /**
   * 加載所有分片（用於搜索）
   */
  async loadAllChunks() {
    if (this.allItems.length > 0) {
      return this.allItems; // 已加載
    }

    try {
      const promises = this.itemsIndex.chunks.map(chunk => this.loadChunk(chunk.id));
      await Promise.all(promises);
      console.log(`✓ 已加載所有 ${this.itemsIndex.chunks.length} 個分片 (${this.allItems.length} 個項目)`);
      return this.allItems;
    } catch (error) {
      console.error('加載所有分片失敗:', error);
      throw error;
    }
  }

  /**
   * 搜索項目
   */
  async searchItems(query) {
    if (!query.trim()) {
      this.filteredItems = [];
      return [];
    }

    // 確保已加載所有分片
    await this.loadAllChunks();

    const lowerQuery = query.toLowerCase();
    this.filteredItems = this.allItems.filter(item =>
      item.code.toLowerCase().includes(lowerQuery) ||
      item.name.toLowerCase().includes(lowerQuery)
    );

    return this.filteredItems;
  }

  /**
   * 虛擬滾動列表 - 獲取可視區域的項目
   */
  getVisibleItems(items, scrollTop, containerHeight, itemHeight) {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);

    const visibleItems = items.slice(startIndex, Math.min(endIndex, items.length));
    const offsetTop = startIndex * itemHeight;

    return {
      visibleItems,
      startIndex,
      endIndex,
      offsetTop,
      totalHeight: items.length * itemHeight
    };
  }

  /**
   * 創建項目 HTML 元素
   */
  createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'csv-item-row';
    div.innerHTML = `
      <div class="item-code">${this.escapeHtml(item.code)}</div>
      <div class="item-name">${this.escapeHtml(item.name)}</div>
      <div class="item-points">${item.points} 點</div>
    `;
    return div;
  }

  /**
   * 高亮搜索結果
   */
  highlightText(text, query) {
    if (!query) return this.escapeHtml(text);

    const regex = new RegExp(`(${this.escapeHtmlForRegex(query)})`, 'gi');
    const escaped = this.escapeHtml(text);
    return escaped.replace(regex, '<span class="highlight">$1</span>');
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
   * 正則表達式轉義
   */
  escapeHtmlForRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * 獲取項目詳情
   */
  getItemDetails(itemCode) {
    const item = this.allItems.find(i => i.code === itemCode);
    return item || null;
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    return {
      totalItems: this.itemsIndex.total_items,
      totalChunks: this.itemsIndex.chunks.length,
      loadedChunks: this.loadedChunks.size,
      loadedItems: this.allItems.length,
      filteredItems: this.filteredItems.length
    };
  }

  /**
   * 清空緩存
   */
  clearCache() {
    this.loadedChunks.clear();
    this.allItems = [];
    this.filteredItems = [];
  }

  /**
   * 獲取所有 CSV 項目（確保已加載所有分片）
   */
  async getAllItems() {
    if (this.allItems.length > 0) {
      return this.allItems;
    }

    // 加載所有分片
    await this.loadAllChunks();
    return this.allItems;
  }
}

// 導出供全局使用
window.CSVHandler = CSVHandler;
