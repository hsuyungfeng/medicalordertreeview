/**
 * 通用表格加載系統
 * 根據表格配置，從各種數據源加載表格數據
 * 支持 CSV、JSON 文件、內存數據等
 */

class TableLoader {
  constructor(basePath = 'data', csvHandler = null) {
    this.basePath = basePath;
    this.csvHandler = csvHandler;
    this.cache = new Map(); // 表格數據緩存
    this.loadingPromises = new Map(); // 防止重複加載
  }

  /**
   * 根據表格配置加載數據
   */
  async loadTable(tableConfig) {
    if (!tableConfig) {
      throw new Error('表格配置無效');
    }

    const cacheKey = this.generateCacheKey(tableConfig);

    // 檢查緩存
    if (this.cache.has(cacheKey)) {
      console.log(`📦 從緩存返回表格: ${tableConfig.name}`);
      return this.cache.get(cacheKey);
    }

    // 檢查是否正在加載
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey);
    }

    // 開始加載
    const loadPromise = this.loadTableByType(tableConfig);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const data = await loadPromise;
      // 緩存結果
      this.cache.set(cacheKey, data);
      console.log(`✓ 表格已加載: ${tableConfig.name} (${data.length} 筆)`);
      return data;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  /**
   * 根據表格類型加載數據
   */
  async loadTableByType(tableConfig) {
    const type = tableConfig.type;

    switch (type) {
      case 'csv':
        return this.loadCSVTable(tableConfig);
      case 'standard':
        return this.loadStandardTable(tableConfig);
      case 'rules':
        return this.loadRulesTable(tableConfig);
      default:
        throw new Error(`未知的表格類型: ${type}`);
    }
  }

  /**
   * 加載 CSV 診療項目表
   */
  async loadCSVTable(tableConfig) {
    if (!this.csvHandler) {
      throw new Error('CSVHandler 未初始化');
    }

    // 獲取所有 CSV 項目
    const allItems = await this.csvHandler.getAllItems();

    // 根據代碼前綴篩選
    const codePrefixes = tableConfig.codePrefixes || [];
    if (codePrefixes.length === 0) {
      return allItems;
    }

    const filteredItems = allItems.filter(item => {
      const itemCode = String(item.code || '');
      return codePrefixes.some(prefix => itemCode.startsWith(prefix));
    });

    return filteredItems;
  }

  /**
   * 加載支付標準表
   */
  async loadStandardTable(tableConfig) {
    if (!tableConfig.dataFile) {
      throw new Error('支付標準表配置中缺少 dataFile 字段');
    }

    const url = `${this.basePath}/${tableConfig.dataFile}`;
    const data = await this.fetchJSON(url);

    // 返回項目數組
    if (Array.isArray(data.items)) {
      return data.items;
    }

    throw new Error(`無效的支付標準表數據格式: ${url}`);
  }

  /**
   * 加載規則表
   */
  async loadRulesTable(tableConfig) {
    if (!tableConfig.dataFile) {
      throw new Error('規則表配置中缺少 dataFile 字段');
    }

    const url = `${this.basePath}/${tableConfig.dataFile}`;
    const data = await this.fetchJSON(url);

    // 返回項目數組
    if (Array.isArray(data.items)) {
      return data.items;
    }

    throw new Error(`無效的規則表數據格式: ${url}`);
  }

  /**
   * 生成緩存鍵
   */
  generateCacheKey(tableConfig) {
    return `${tableConfig.type}-${tableConfig.id || tableConfig.name}`;
  }

  /**
   * 清空特定表格的緩存
   */
  clearTableCache(tableConfig) {
    const cacheKey = this.generateCacheKey(tableConfig);
    this.cache.delete(cacheKey);
  }

  /**
   * 清空所有緩存
   */
  clearAllCache() {
    this.cache.clear();
    console.log('✓ 所有表格緩存已清空');
  }

  /**
   * 獲取緩存統計
   */
  getCacheStats() {
    return {
      cachedTables: this.cache.size,
      cachedKeys: Array.from(this.cache.keys())
    };
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
   * 預加載多個表格
   */
  async preloadTables(tableConfigs) {
    const promises = tableConfigs.map(config =>
      this.loadTable(config).catch(error => {
        console.warn(`⚠️ 預加載表格失敗: ${config.name}`, error);
        return null; // 失敗時繼續，不中斷其他表格加載
      })
    );

    const results = await Promise.all(promises);
    const successful = results.filter(r => r !== null).length;
    console.log(`✓ 預加載完成: ${successful}/${tableConfigs.length} 個表格`);
    return results;
  }
}

// 導出供全局使用
window.TableLoader = TableLoader;
