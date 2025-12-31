/**
 * 表格映射管理器
 * 根據節點 ID，查詢並返回該節點對應的表格配置
 */

class TableMapper {
  constructor(basePath = 'data') {
    this.basePath = basePath;
    this.mappingConfig = null;
    this.mappingLoaded = false;
  }

  /**
   * 初始化：加載表格映射配置
   */
  async init() {
    try {
      const configPath = `${this.basePath}/table-mapping.json`;
      this.mappingConfig = await this.fetchJSON(configPath);
      this.mappingLoaded = true;
      console.log(`✓ 表格映射配置已加載: ${Object.keys(this.mappingConfig.mappings).length} 個節點映射`);
      return this.mappingConfig;
    } catch (error) {
      console.error('❌ 加載表格映射配置失敗:', error);
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
   * 根據節點 ID 查詢對應的表格列表
   */
  getTablesForNode(nodeId) {
    if (!this.mappingLoaded || !this.mappingConfig) {
      console.warn(`⚠️ 映射配置未加載`);
      return [];
    }

    const nodeMapping = this.mappingConfig.mappings[nodeId];

    if (!nodeMapping) {
      console.warn(`⚠️ 節點 ${nodeId} 無映射配置`);
      return [];
    }

    return nodeMapping.tables || [];
  }

  /**
   * 根據節點 ID 查詢該節點的標籤（如果有多個表格）
   */
  getTableTabs(nodeId) {
    const tables = this.getTablesForNode(nodeId);

    if (tables.length === 0) {
      return [];
    }

    return tables.map((table, index) => ({
      id: table.id || `table-${index}`,
      label: table.name,
      description: table.description,
      type: table.type,
      data: table
    }));
  }

  /**
   * 檢查節點是否有表格映射
   */
  hasTableMapping(nodeId) {
    return nodeId in this.mappingConfig.mappings;
  }

  /**
   * 獲取所有已映射的節點 ID
   */
  getMappedNodeIds() {
    return Object.keys(this.mappingConfig.mappings);
  }

  /**
   * 驗證映射完整性
   */
  validateMappings() {
    if (!this.mappingLoaded || !this.mappingConfig) {
      console.warn('⚠️ 映射配置未加載');
      return { valid: false, issues: ['配置未加載'] };
    }

    const issues = [];
    const mappings = this.mappingConfig.mappings;

    for (const [nodeId, mapping] of Object.entries(mappings)) {
      // 檢查是否有表格
      if (!mapping.tables || mapping.tables.length === 0) {
        issues.push(`${nodeId}: 無表格配置`);
      }

      // 檢查每個表格是否有必要字段
      mapping.tables.forEach((table, idx) => {
        if (!table.type) {
          issues.push(`${nodeId} 表格 ${idx}: 缺少 type 字段`);
        }
        if (!table.name) {
          issues.push(`${nodeId} 表格 ${idx}: 缺少 name 字段`);
        }
      });
    }

    if (issues.length > 0) {
      console.warn('⚠️ 映射驗證發現問題:');
      issues.forEach(issue => console.warn(`  - ${issue}`));
    }

    return {
      valid: issues.length === 0,
      issues: issues,
      totalMappings: Object.keys(mappings).length
    };
  }

  /**
   * 獲取表格類型的適配器名稱
   */
  getAdapterForTableType(tableType) {
    if (!this.mappingConfig.tableTypes) {
      return null;
    }

    const typeConfig = this.mappingConfig.tableTypes[tableType];
    return typeConfig ? typeConfig.adapter : null;
  }

  /**
   * 獲取所有表格類型定義
   */
  getTableTypeDefinitions() {
    return this.mappingConfig.tableTypes || {};
  }

  /**
   * 為節點添加或更新表格映射（運行時）
   */
  addOrUpdateMapping(nodeId, label, tables) {
    if (!this.mappingConfig.mappings) {
      this.mappingConfig.mappings = {};
    }

    this.mappingConfig.mappings[nodeId] = {
      label: label,
      tables: tables
    };

    console.log(`✓ 已添加/更新節點 ${nodeId} 的表格映射`);
  }

  /**
   * 獲取節點標籤
   */
  getNodeLabel(nodeId) {
    const mapping = this.mappingConfig.mappings[nodeId];
    return mapping ? mapping.label : nodeId;
  }

  /**
   * 獲取完整的配置統計
   */
  getStats() {
    return {
      totalMappedNodes: Object.keys(this.mappingConfig.mappings).length,
      totalTableTypes: Object.keys(this.mappingConfig.tableTypes).length,
      tableTypesList: Object.keys(this.mappingConfig.tableTypes),
      version: this.mappingConfig.version
    };
  }
}

// 導出供全局使用
window.TableMapper = TableMapper;
