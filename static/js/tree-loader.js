/**
 * 延遲加載樹狀導航組件
 * 支持無限層級展開，按需加載 JSON 數據
 */

class LazyTreeLoader {
  constructor(container, dataBasePath = 'data') {
    this.container = container;
    this.dataBasePath = dataBasePath;
    this.loadedNodes = new Set();  // 已加載的節點 ID
    this.expandedNodes = new Set(); // 已展開的節點 ID
    this.expandedDocuments = new Set(); // 已展開文檔的節點 ID（新增）
    this.nodeCache = new Map(); // 節點數據緩存
    this.allNodes = new Map(); // 所有節點的映射
    this.breadcrumbPath = []; // 麵包屑路徑
  }

  /**
   * 初始化樹狀結構
   */
  async init() {
    try {
      console.log('初始化樹狀結構...');
      const structure = await this.fetchJSON(`${this.dataBasePath}/tree-structure.json`);

      if (!structure.root || !structure.root.children) {
        throw new Error('無效的樹結構格式');
      }

      // 清空容器
      this.container.innerHTML = '';

      // 渲染第一層子節點
      console.log(`準備渲染 ${structure.root.children.length} 個根節點`);
      this.renderChildren(this.container, structure.root.children, 0);

      console.log('✓ 樹狀結構已加載');
    } catch (error) {
      console.error('❌ 加載樹結構失敗:', error);
      this.container.innerHTML = `<div class="empty-state"><div class="empty-state-icon">⚠️</div><div class="empty-state-text">無法加載樹結構數據</div></div>`;
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
   * 渲染子節點
   */
  renderChildren(container, children, parentLevel = 0) {
    if (!children || children.length === 0) {
      return;
    }

    // 確保容器存在且為有效的 DOM 元素
    if (!container || !container.appendChild) {
      console.error('容器無效:', container);
      return;
    }

    children.forEach(node => {
      // 調試：檢查 section 節點的原始屬性
      if (node.type === 'section') {
        console.log(`🔍 renderChildren - Section: ${node.id}, has_children: ${node.has_children}, has subsections: ${node.subsections?.length || 0}`);
      }

      const nodeElement = this.createNodeElement(node, parentLevel + 1);
      container.appendChild(nodeElement);

      // 緩存節點
      this.allNodes.set(node.id, node);
    });
  }

  /**
   * 創建單個節點元素
   */
  createNodeElement(node, level) {
    const nodeDiv = document.createElement('div');
    nodeDiv.className = `tree-node tree-node-level-${level}`;
    nodeDiv.id = `node-${node.id}`;
    nodeDiv.setAttribute('data-node-id', node.id);

    // 特殊標記 CSV 節點
    if (node.type === 'csv') {
      nodeDiv.classList.add('tree-node-csv');
    }

    // 特殊標記 subsection 節點
    if (node.type === 'subsection') {
      nodeDiv.classList.add('tree-node-subsection');
    }

    // 調試：打印 section 節點信息
    if (node.type === 'section') {
      console.log(`📄 Section node: ${node.label}, has_children: ${node.has_children}`);
    }

    // 檢測節點是否有文檔內容
    const hasDocument = node.content && node.content.trim().length > 0;

    // 【修正】檢查節點是否有嵌入的 children 陣列，如果有則標記為有子節點
    const hasEmbeddedChildren = node.children && Array.isArray(node.children) && node.children.length > 0;
    const effectiveHasChildren = node.has_children || hasEmbeddedChildren;

    if (hasEmbeddedChildren && !node.has_children) {
      console.log(`🔧 節點 ${node.id} 有嵌入的 children 但 has_children 為 false，已自動修正為 true`);
    }

    // 創建節點頭部
    const header = document.createElement('div');
    header.className = 'tree-node-header';
    // 標記節點是否有文檔（用於調試和 CSS 選擇）
    if (hasDocument) {
      header.setAttribute('data-has-document', 'true');
    }

    // 更新圖標邏輯：支持子節點展開 + 文檔內容
    let toggleIcon = effectiveHasChildren ? '▶' : '';
    let documentIcon = '';

    if (hasDocument) {
      documentIcon = `<span class="document-icon">📖</span>`;
    } else if (node.type === 'subsection' && !effectiveHasChildren) {
      // 舊邏輯：subsection 沒有文檔時顯示文檔圖標
      toggleIcon = '📖';
    }

    header.innerHTML = `
      <span class="toggle-icon">${toggleIcon}</span>
      ${documentIcon}
      <span class="node-label">${this.escapeHtml(node.label)}</span>
    `;

    nodeDiv.appendChild(header);

    // 創建文檔內容容器（新增）
    if (hasDocument) {
      const documentDiv = document.createElement('div');
      documentDiv.className = 'tree-node-document';
      documentDiv.setAttribute('data-node-id', `doc-${node.id}`);
      documentDiv.innerHTML = '<div class="document-content-wrapper"></div>';
      nodeDiv.appendChild(documentDiv);

      // 調試輸出
      console.log(`✅ 文檔容器已創建: ${node.id}`);
    }

    // 【修正】創建子節點容器 - 使用 effectiveHasChildren 而非 node.has_children
    if (effectiveHasChildren) {
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'tree-node-children';
      childrenDiv.setAttribute('data-node-id', `children-${node.id}`);
      nodeDiv.appendChild(childrenDiv);

      // 綁定子節點展開事件（點擊 toggle-icon 或頭部）
      const toggleIconEl = header.querySelector('.toggle-icon');
      if (toggleIconEl) {
        toggleIconEl.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log(`🔄 點擊展開子節點: ${node.id}`);
          this.toggleNode(node.id, node, header, childrenDiv, level);
        });
      }

      // 頭部其他地方點擊也展開子節點
      header.addEventListener('click', (e) => {
        // 如果點擊了文檔圖標或 toggle-icon，忽略此事件
        if (e.target.classList.contains('document-icon') ||
            e.target.classList.contains('toggle-icon')) {
          return;
        }
        e.stopPropagation();

        // 區分是否有文檔內容
        // 如果有文檔，優先顯示表格；如果沒文檔才展開子節點
        if (hasDocument) {
          console.log(`ℹ️ 點擊頭部顯示表格 (有文檔): ${node.id}`);
          this.showNodeDetails(node, header);
        } else {
          console.log(`🔄 點擊頭部展開子節點 (無文檔): ${node.id}`);
          this.toggleNode(node.id, node, header, childrenDiv, level);
        }
      });
    }

    // 特殊處理：Subsection 節點（子項目）- 顯示分項的文字說明 + 過濾的表格
    if (node.type === 'subsection' && !node.has_children) {
      header.addEventListener('click', (e) => {
        if (e.target.classList.contains('document-icon') ||
            e.target.classList.contains('toggle-icon')) {
          return;
        }
        e.stopPropagation();
        console.log(`📌 點擊 Subsection: ${node.id}`);

        // 如果 subsection 有文字說明（content），顯示分項的詳細內容
        if (hasDocument) {
          console.log(`📖 Subsection 有文字說明，同時顯示文檔和表格`);
          this.showNodeDetailsWithDocument(node, header, nodeDiv);
        } else {
          // 如果沒有文字說明，回退到顯示整個父節點的內容
          console.log(`📋 Subsection 無文字說明，顯示所屬節的完整內容`);
          const parentSection = this.findParentSection(node.id);
          if (parentSection) {
            console.log(`   所屬節: ${parentSection.id} (${parentSection.label})`);
            this.showSectionWithSubsections(parentSection, node, header, nodeDiv);
          } else {
            console.warn(`⚠️ 找不到所屬的節: ${node.id}`);
            this.showNodeDetails(node, header);
          }
        }
      });
    } else if (node.label && node.label.includes('總則')) {
      // 特殊處理：總則節點 - 點擊時同時展開文檔和顯示表格
      header.addEventListener('click', (e) => {
        // 如果點擊了文檔圖標或 toggle-icon，忽略
        if (e.target.classList.contains('document-icon') ||
            e.target.classList.contains('toggle-icon')) {
          return;
        }
        e.stopPropagation();

        console.log(`📚 點擊總則節點: ${node.id} (${node.label})`);
        this.showNodeDetailsWithDocument(node, header, nodeDiv);
      });

      // 如果有文檔圖標，綁定單獨的文檔展開事件
      if (hasDocument) {
        const documentIconEl = header.querySelector('.document-icon');
        if (documentIconEl) {
          documentIconEl.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`📖 點擊總則文檔圖標展開: ${node.id}`);
            this.toggleDocumentContent(node, header, nodeDiv);
          });
        }
      }
    } else if (node.type === 'section' && hasDocument) {
      // 特殊處理：Section 節點有文檔內容時 - 點擊頭部同時展開文檔和表格
      header.addEventListener('click', (e) => {
        if (e.target.classList.contains('document-icon') ||
            e.target.classList.contains('toggle-icon')) {
          return;
        }
        e.stopPropagation();

        console.log(`📄 點擊節點: ${node.id} (${node.label}), 同時展開文檔和表格`);
        this.showNodeDetailsWithDocument(node, header, nodeDiv);
      });

      // 如果有文檔圖標，綁定單獨的文檔展開事件
      const documentIconEl = header.querySelector('.document-icon');
      if (documentIconEl) {
        documentIconEl.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log(`📖 點擊文檔圖標展開: ${node.id}`);
          this.toggleDocumentContent(node, header, nodeDiv);
        });
      }
    } else if (hasDocument) {
      // 非 Subsection、非總則、非 Section 節點，但有文檔內容
      const documentIconEl = header.querySelector('.document-icon');

      // Part 和 Chapter 類型節點的特殊處理：優先顯示表格
      if (node.type === 'part' || node.type === 'chapter') {
        // 整個 header 點擊都顯示表格和文檔
        header.addEventListener('click', (e) => {
          // 只有點擊到 toggle-icon 時才忽略
          if (e.target.classList.contains('toggle-icon')) {
            return;
          }
          e.stopPropagation();
          console.log(`📚 點擊 ${node.type} 節點: ${node.id} (${node.label})`);
          this.showNodeDetailsWithDocument(node, header, nodeDiv);
        });

        // 如果有文檔圖標，則文檔圖標單獨處理展開文檔
        if (documentIconEl) {
          documentIconEl.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`📖 點擊文檔圖標展開: ${node.id}`);
            this.toggleDocumentContent(node, header, nodeDiv);
          });
        }
      } else if (documentIconEl) {
        // 其他有文檔圖標的節點
        // 文檔圖標點擊展開文檔
        documentIconEl.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log(`📖 點擊文檔圖標展開: ${node.id}`);
          this.toggleDocumentContent(node, header, nodeDiv);
        });

        // 點擊節點名稱展開文檔
        header.addEventListener('click', (e) => {
          if (e.target.classList.contains('document-icon') ||
              e.target.classList.contains('toggle-icon')) {
            return;
          }
          e.stopPropagation();
          console.log(`📖 點擊頭部展開文檔: ${node.id}`);
          this.toggleDocumentContent(node, header, nodeDiv);
        });
      } else if (!node.has_children) {
        // 沒有子節點也沒有文檔圖標，整個 header 點擊都展開文檔
        header.addEventListener('click', (e) => {
          e.stopPropagation();
          console.log(`📖 點擊頭部展開文檔: ${node.id}`);
          this.toggleDocumentContent(node, header, nodeDiv);
        });
      }
    } else if (!node.has_children) {
      // 無子節點也無文檔的終端節點，點擊時顯示詳情
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log(`ℹ️ 點擊終端節點: ${node.id}`);
        this.showNodeDetails(node, header);
      });
    }

    return nodeDiv;
  }

  /**
   * 切換節點的展開/收合
   */
  async toggleNode(nodeId, node, headerElement, childrenContainer, level) {
    const nodeDiv = headerElement.parentElement;

    if (this.expandedNodes.has(nodeId)) {
      // 收合
      this.expandedNodes.delete(nodeId);
      nodeDiv.classList.remove('expanded');
      childrenContainer.style.maxHeight = '0';
      this.updateBreadcrumb([]);
    } else {
      // 展開
      try {
        console.log(`🔄 展開節點 ${nodeId}, has_children: ${node.has_children}`);

        // 如果尚未加載子節點，先加載
        if (!this.loadedNodes.has(nodeId)) {
          console.log(`   加載子節點...`);
          await this.loadChildren(nodeId, node, childrenContainer, level + 1);
          console.log(`   ✓ 子節點已加載`);
          this.loadedNodes.add(nodeId);
        }

        this.expandedNodes.add(nodeId);
        nodeDiv.classList.add('expanded');
        childrenContainer.style.maxHeight = '10000px';

        // 更新麵包屑
        this.breadcrumbPath = [node.label];
        this.updateBreadcrumb(this.breadcrumbPath);

        console.log(`✓ 展開成功: ${nodeId}`);
      } catch (error) {
        console.error(`加載節點失敗 (${nodeId}):`, error);
        childrenContainer.innerHTML = `<div class="loading" style="padding: 20px; color: red;">❌ 加載失敗</div>`;
      }
    }
  }

  /**
   * 切換節點的文檔內容展開/收合
   */
  async toggleDocumentContent(node, headerElement, nodeDiv) {
    const nodeId = node.id;
    const documentContainer = nodeDiv.querySelector('.tree-node-document');

    if (!documentContainer) {
      console.warn('節點無文檔容器:', nodeId);
      return;
    }

    if (this.expandedDocuments.has(nodeId)) {
      // 收合文檔
      this.expandedDocuments.delete(nodeId);
      nodeDiv.classList.remove('document-expanded');
      documentContainer.style.maxHeight = '0';
      documentContainer.style.opacity = '0';
      headerElement.classList.remove('document-active');
      console.log(`✓ 文檔已收合: ${nodeId}`);
    } else {
      // 展開文檔
      try {
        // 如果尚未加載文檔內容，先生成 HTML
        const wrapper = documentContainer.querySelector('.document-content-wrapper');
        if (!wrapper.hasChildNodes()) {
          const contentHtml = this.generateDocumentContentHtml(node);
          wrapper.innerHTML = contentHtml;

          // 綁定展開全文按鈕
          this.bindExpandContentButton(wrapper);
        }

        this.expandedDocuments.add(nodeId);
        nodeDiv.classList.add('document-expanded');

        // 計算實際高度並展開（修復：限制最大高度以支持滾動）
        const transition = documentContainer.style.transition;
        documentContainer.style.transition = 'none';

        documentContainer.style.maxHeight = 'none';
        const actualHeight = documentContainer.scrollHeight;
        console.log(`📏 計算高度: ${actualHeight}px (${nodeId})`);

        // 限制最大高度為 500px，允許內部滾動
        const displayHeight = Math.min(actualHeight, 500);

        documentContainer.style.maxHeight = '0';
        documentContainer.offsetHeight; // 觸發重排

        // 重新啟用過渡並設置最終狀態
        documentContainer.style.transition = transition;
        documentContainer.style.maxHeight = `${displayHeight}px`;
        documentContainer.style.opacity = '1';
        headerElement.classList.add('document-active');

        // 動畫完成後保持限制高度（讓內部滾動條工作）
        setTimeout(() => {
          if (this.expandedDocuments.has(nodeId)) {
            documentContainer.style.maxHeight = '500px';
          }
        }, 400);

        console.log(`✓ 文檔已展開: ${nodeId}`);
      } catch (error) {
        console.error('展開文檔內容失敗:', error);
      }
    }
  }

  /**
   * 生成文檔內容 HTML - 包含滾動設計支持 (Phase 5)
   */
  generateDocumentContentHtml(node) {
    if (!node.content) {
      return '<div class="document-content empty-content"><p>此節點無文檔內容</p></div>';
    }

    const contentLength = node.content.length;
    const isLongContent = contentLength > 1000;
    const contentHtml = this.escapeHtml(node.content).replace(/\n/g, '<br/>');

    // 使用 DocumentContentExtractor 進行智能內容提取
    if (window.DocumentContentExtractor) {
      const extractor = new window.DocumentContentExtractor({ maxPreviewLength: 500 });
      const extracted = extractor.extractCoreContent(node.content);
      return extractor.renderContent(extracted);
    } else {
      // 增強的降級方案 - 支持滾動設計
      console.warn('DocumentContentExtractor 未加載，使用增強降級方案');

      if (isLongContent) {
        // 長文檔：使用滾動容器 + 展開按鈕
        return `
          <div class="document-content-container">
            <div class="document-content-scrollable" id="doc-scroll-${node.id}">
              <div class="content-text">${contentHtml}</div>
            </div>
            <button class="expand-content-btn" onclick="document.getElementById('doc-scroll-${node.id}').classList.toggle('expanded'); event.target.innerHTML = document.getElementById('doc-scroll-${node.id}').classList.contains('expanded') ? '📕 收起內容' : '📖 展開全文'">
              📖 展開全文
            </button>
          </div>
        `;
      } else {
        // 短文檔：直接顯示（無滾動條）
        return `
          <div class="document-content-container">
            <div class="document-content-scrollable expanded">
              <div class="content-text">${contentHtml}</div>
            </div>
          </div>
        `;
      }
    }
  }

  /**
   * 綁定展開/收合按鈕
   */
  bindExpandContentButton(wrapper) {
    const expandBtn = wrapper.querySelector('.expand-content-btn');
    if (!expandBtn) return;

    expandBtn.addEventListener('click', () => {
      const isExpanded = expandBtn.getAttribute('data-expanded') === 'true';
      const preview = wrapper.querySelector('.content-preview');
      const full = wrapper.querySelector('.content-full');
      const icon = expandBtn.querySelector('.expand-icon');
      const text = expandBtn.querySelector('.expand-text');

      if (isExpanded) {
        // 收合
        if (preview) preview.style.display = 'block';
        if (full) full.style.display = 'none';
        if (icon) icon.textContent = '▼';
        if (text) text.textContent = '展開全文';
        expandBtn.setAttribute('data-expanded', 'false');
      } else {
        // 展開
        if (preview) preview.style.display = 'none';
        if (full) full.style.display = 'block';
        if (icon) icon.textContent = '▲';
        if (text) text.textContent = '收合';
        expandBtn.setAttribute('data-expanded', 'true');
      }
    });
  }

  /**
   * 加載子節點
   */
  async loadChildren(nodeId, node, container, level) {
    // 首先檢查是否已有嵌入的 children 數組（用於 chapter 和其他節點類型）
    if (node.children && Array.isArray(node.children)) {
      console.log(`📌 使用嵌入的 children 加載 ${nodeId}（${node.children.length} 個子節點）`);

      // 清空容器
      container.innerHTML = '';

      // 直接渲染嵌入的 children
      this.renderChildren(container, node.children, level);
      console.log(`✓ 已渲染 ${node.children.length} 個 children 節點`);
      return;
    }

    // 檢查 section 節點是否已有嵌入的 subsections
    if (node.type === 'section' && node.subsections && Array.isArray(node.subsections)) {
      console.log(`📌 使用嵌入的 subsections 加載 ${nodeId}`);

      // 清空容器
      container.innerHTML = '';

      // 將 subsections 轉換為節點格式
      const subsectionNodes = node.subsections.map((sub, idx) => ({
        id: `${nodeId}-sub-${idx}`,
        type: 'subsection',
        label: sub.title || `內容 ${idx + 1}`,
        level: level,
        parent_id: nodeId,
        has_children: false,
        content: sub.content,
        metadata: {
          parent_section: nodeId,
          index: idx
        }
      }));

      this.renderChildren(container, subsectionNodes, level);
      console.log(`✓ 已渲染 ${subsectionNodes.length} 個 subsections`);
      return;
    }

    // 確定加載 URL
    let loadUrl = null;

    if (node.lazy_load_url) {
      loadUrl = node.lazy_load_url;
    } else if (node.type === 'section' && node.has_children) {
      // Section 節點：從 sections 目錄加載
      loadUrl = `${this.dataBasePath}/sections/${nodeId}.json`;
    }

    if (!loadUrl) {
      return;
    }

    // 顯示加載指示器
    container.innerHTML = '<div class="loading"><span class="spinner"></span>加載中...</div>';

    try {
      const data = await this.fetchJSON(loadUrl);

      // 清空容器
      container.innerHTML = '';

      if (data.children && Array.isArray(data.children)) {
        this.renderChildren(container, data.children, level);
      }
    } catch (error) {
      console.error(`加載子節點失敗 (${nodeId}):`, error);
      container.innerHTML = `<div class="loading" style="color: red;">❌ 加載失敗: ${error.message}</div>`;
      throw error;
    }
  }

  /**
   * 更新麵包屑導航
   */
  updateBreadcrumb(path) {
    const breadcrumbEl = document.querySelector('.breadcrumb');
    if (!breadcrumbEl) return;

    if (path.length === 0) {
      breadcrumbEl.innerHTML = '<span class="breadcrumb-item active">根目錄</span>';
      return;
    }

    const items = path.map((item, index) => {
      const isActive = index === path.length - 1;
      return `
        <span class="breadcrumb-item ${isActive ? 'active' : ''}">
          ${this.escapeHtml(item)}
        </span>
        ${index < path.length - 1 ? '<span class="breadcrumb-separator">/</span>' : ''}
      `;
    }).join('');

    breadcrumbEl.innerHTML = '<span class="breadcrumb-item">根目錄</span><span class="breadcrumb-separator">/</span>' + items;
  }

  /**
   * 搜索節點
   */
  searchNodes(query) {
    if (!query.trim()) {
      this.clearSearch();
      return [];
    }

    const results = [];
    const lowerQuery = query.toLowerCase();

    // 遍歷所有已加載的節點
    this.allNodes.forEach((node, nodeId) => {
      if (node.label.toLowerCase().includes(lowerQuery) ||
          node.id.toLowerCase().includes(lowerQuery)) {
        results.push(node);
      }
    });

    return results;
  }

  /**
   * 清空搜索
   */
  clearSearch() {
    // 重置麵包屑
    this.updateBreadcrumb([]);
    this.expandedNodes.clear();
    this.loadedNodes.clear();

    // 重置所有節點的展開狀態
    document.querySelectorAll('.tree-node.expanded').forEach(node => {
      node.classList.remove('expanded');
    });
  }

  /**
   * 顯示節點詳情（主要用於 CSV 表格）
   */
  showNodeDetails(node, headerElement) {
    // 移除之前的高亮
    document.querySelectorAll('.tree-node-header.active').forEach(el => {
      el.classList.remove('active');
    });

    // 高亮當前節點
    headerElement.classList.add('active');

    // 更新麵包屑
    this.breadcrumbPath = [node.label];
    this.updateBreadcrumb(this.breadcrumbPath);

    // 顯示文檔表格（新系統）
    if (window.docTableRenderer) {
      console.log(`📊 準備顯示文檔表格 - 節點類型: ${node.type}, ID: ${node.id}`);
      window.docTableRenderer.showTableForNode(node.id);
      console.log(`✅ 文檔表格已顯示: ${node.label}`);
    } else {
      console.warn('⚠️ docTableRenderer 未初始化，無法顯示表格');
    }

    console.log('✓ 節點已選中:', node.label);
  }

  /**
   * 同時顯示節點詳情和文檔內容（左右分列佈局）
   * 用於章、節層級的左右分列顯示
   */
  async showNodeDetailsWithDocument(node, headerElement, nodeDiv) {
    // 移除之前的高亮
    document.querySelectorAll('.tree-node-header.active').forEach(el => {
      el.classList.remove('active');
    });

    // 高亮當前節點
    headerElement.classList.add('active');

    // 更新麵包屑
    this.breadcrumbPath = [node.label];
    this.updateBreadcrumb(this.breadcrumbPath);

    // 檢查是否有文檔內容
    const hasDocument = node.content && node.content.trim().length > 0;

    // 1. 展開文檔內容（如果存在）
    if (hasDocument) {
      console.log(`📖 展開文檔內容: ${node.id}`);
      await this.toggleDocumentContent(node, headerElement, nodeDiv);
    }

    // 2. 根據是否有表格數據決定右側顯示
    // 注意：Section 節點即使有 has_children，也應該優先顯示表格
    console.log(`📊 嘗試顯示表格: ${node.id}`);
    if (window.docTableRenderer) {
      window.docTableRenderer.showTableForNode(node.id);
    } else {
      console.warn('docTableRenderer 未初始化');
    }

    console.log(`✅ 已顯示節點詳情和文檔: ${node.label}`);
  }


  /**
   * 顯示節點及其子節點的合併文檔內容（用於小節層級）
   * 當點擊小節時，顯示其所屬節(Section)的完整內容 + 所有小節的合併文字
   */
  async showSectionWithSubsections(parentNode, childNode, headerElement, parentNodeDiv) {
    // 移除之前的高亮
    document.querySelectorAll('.tree-node-header.active').forEach(el => {
      el.classList.remove('active');
    });

    // 高亮當前節點
    headerElement.classList.add('active');

    // 更新麵包屑
    this.breadcrumbPath = [parentNode.label, childNode.label];
    this.updateBreadcrumb(this.breadcrumbPath);

    // 1. 展開父節點的文檔內容（節的說明文字）
    console.log(`📖 展開節的文檔內容: ${parentNode.id}`);
    const parentDocContainer = parentNodeDiv.querySelector('.tree-node-document');
    if (parentDocContainer && parentNode.content) {
      // 為父節點生成合併的文檔內容（包含所有小節）
      const mergedContent = this.generateMergedSubsectionContent(parentNode);
      const wrapper = parentDocContainer.querySelector('.document-content-wrapper');

      if (wrapper) {
        wrapper.innerHTML = mergedContent;
        this.bindExpandContentButton(wrapper);
      }

      // 展開父節點的文檔容器
      if (!this.expandedDocuments.has(parentNode.id)) {
        const transition = parentDocContainer.style.transition;
        parentDocContainer.style.transition = 'none';
        parentDocContainer.style.maxHeight = 'none';
        const actualHeight = parentDocContainer.scrollHeight;
        parentDocContainer.style.maxHeight = '0';
        parentDocContainer.offsetHeight;
        parentDocContainer.style.transition = transition;
        parentDocContainer.style.maxHeight = `${actualHeight}px`;
        parentDocContainer.style.opacity = '1';
        this.expandedDocuments.add(parentNode.id);
      }
    }

    // 2. 顯示表格（右邊顯示該節的表格）
    console.log(`📊 顯示節內的表格: ${parentNode.id}`);
    if (window.docTableRenderer) {
      window.docTableRenderer.showTableForNode(parentNode.id);
    }

    console.log(`✅ 已顯示節和小節的合併內容: ${parentNode.label} > ${childNode.label}`);
  }

  /**
   * 生成包含所有小節文字的合併文檔內容
   */
  generateMergedSubsectionContent(sectionNode) {
    let mergedHtml = '';

    // 首先添加節本身的文檔內容
    if (sectionNode.content) {
      mergedHtml += `<div class="document-content section-content">
        <div class="content-text">
          ${this.escapeHtml(sectionNode.content).replace(/\n/g, '<br/>')}
        </div>
      </div>`;
    }

    // 然後添加所有小節的文檔內容
    if (sectionNode.subsections && Array.isArray(sectionNode.subsections)) {
      mergedHtml += '<div class="subsections-content">';

      sectionNode.subsections.forEach((sub, idx) => {
        if (sub.content) {
          mergedHtml += `<div class="subsection-item">
            <div class="subsection-title">${this.escapeHtml(sub.title || `項目 ${idx + 1}`)}</div>
            <div class="subsection-content">
              ${this.escapeHtml(sub.content).replace(/\n/g, '<br/>')}
            </div>
          </div>`;
        }
      });

      mergedHtml += '</div>';
    }

    return mergedHtml || '<div class="document-content empty-content"><p>此節點無文檔內容</p></div>';
  }

  /**
   * 查找小節的所屬父節點(Section)
   */
  findParentSection(subsectionId) {
    // 遍歷所有已加載的節點，查找擁有此小節的父節點
    for (const [nodeId, node] of this.allNodes.entries()) {
      if (node.type === 'section' && node.subsections && Array.isArray(node.subsections)) {
        // 檢查此section是否包含所查詢的subsection
        for (let i = 0; i < node.subsections.length; i++) {
          const expectedSubId = `${nodeId}-sub-${i}`;
          if (expectedSubId === subsectionId) {
            return node;
          }
        }
      }
    }

    // 降級方案：根據 DOM 結構查找
    const subsectionEl = document.querySelector(`[data-node-id="${subsectionId}"]`);
    if (subsectionEl) {
      // 向上遍歷 DOM 尋找 section 節點
      let parent = subsectionEl.parentElement;
      while (parent) {
        const parentDataId = parent.getAttribute('data-node-id');
        if (parentDataId && parentDataId.startsWith('children-')) {
          // 找到了子節點容器，再向上找到 section 節點
          const sectionEl = parent.parentElement;
          if (sectionEl) {
            const sectionId = sectionEl.getAttribute('data-node-id');
            if (sectionId && sectionId.startsWith('node-')) {
              const cleanId = sectionId.replace('node-', '');
              const sectionNode = this.allNodes.get(cleanId);
              if (sectionNode && sectionNode.type === 'section') {
                return sectionNode;
              }
            }
          }
        }
        parent = parent.parentElement;
      }
    }

    return null;
  }

  /**
   * 從節點標籤中提取代碼範圍
   * 例如：「二、創傷處置 (48001-48035)」 → { start: '48001', end: '48035' }
   */
  extractCodeRangeFromLabel(label) {
    if (!label) return null;

    // 嘗試匹配 (XXXXX-YYYYY) 格式
    const match = label.match(/\((\d+)-(\d+)\)/);
    if (match) {
      return {
        start: match[1],
        end: match[2]
      };
    }

    // 嘗試匹配 XXXXX-YYYYY 格式（不在括號內）
    const match2 = label.match(/(\d{5})-(\d{5})/);
    if (match2) {
      return {
        start: match2[1],
        end: match2[2]
      };
    }

    return null;
  }

  /**
   * 顯示代碼範圍對應的表格
   */
  showCodeRangeTable(startCode, endCode, headerElement) {
    // 移除之前的高亮
    document.querySelectorAll('.tree-node-header.active').forEach(el => {
      el.classList.remove('active');
    });

    // 高亮當前節點
    headerElement.classList.add('active');

    // 更新麵包屑
    const nodeLabel = headerElement.closest('.tree-node').querySelector('.node-label')?.textContent;
    this.breadcrumbPath = [nodeLabel];
    this.updateBreadcrumb(this.breadcrumbPath);

    // 顯示代碼範圍表格
    if (window.csvTableRenderer) {
      const mainContainer = document.querySelector('.main-container');
      if (mainContainer) {
        mainContainer.classList.add('two-panel');
      }

      // 調用代碼範圍篩選方法
      window.csvTableRenderer.filterByCodeRange(startCode, endCode);
      window.csvTableRenderer.show();

      console.log(`✅ 代碼範圍表格已顯示: ${startCode}-${endCode}`);
    } else {
      console.warn('⚠️ csvTableRenderer 未初始化');
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
   * 獲取節點信息
   */
  getNode(nodeId) {
    return this.allNodes.get(nodeId);
  }

  /**
   * 獲取所有已展開的節點
   */
  getExpandedNodes() {
    return Array.from(this.expandedNodes);
  }

  /**
   * 獲取所有已加載的節點
   */
  getLoadedNodes() {
    return Array.from(this.loadedNodes);
  }

  /**
   * 加載搜尋索引
   */
  async loadSearchIndex() {
    if (this.searchIndex) return this.searchIndex;

    try {
      this.searchIndex = await this.fetchJSON(`${this.dataBasePath}/search-index.json`);
      console.log(`✓ 搜尋索引已加載: ${this.searchIndex.length} 個條目`);
      return this.searchIndex;
    } catch (error) {
      console.error('❌ 無法加載搜尋索引:', error);
      return [];
    }
  }

  /**
   * 執行搜尋
   */
  async search(keyword) {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const searchIndex = await this.loadSearchIndex();
    if (!searchIndex || searchIndex.length === 0) {
      return [];
    }

    const lowerKeyword = keyword.toLowerCase();
    const results = [];

    for (const entry of searchIndex) {
      // 計算匹配得分
      const searchable = entry.searchable || '';

      // 完全匹配得分最高
      if (searchable.includes(lowerKeyword)) {
        let score = 100;

        // 在開頭出現則加分
        if (searchable.startsWith(lowerKeyword)) {
          score += 50;
        }

        // 在標籤中出現則加分
        if (entry.label && entry.label.toLowerCase().includes(lowerKeyword)) {
          score += 30;
        }

        // 在代碼中出現則加分
        if (entry.code && entry.code.includes(keyword)) {
          score += 20;
        }

        results.push({
          ...entry,
          score: score,
          matchPosition: searchable.indexOf(lowerKeyword)
        });
      }
    }

    // 按得分排序
    results.sort((a, b) => b.score - a.score || a.matchPosition - b.matchPosition);

    return results.slice(0, 100); // 限制返回 100 個結果
  }

  /**
   * 顯示搜尋結果
   */
  displaySearchResults(results) {
    const resultsPanel = document.querySelector('.search-results-panel');
    const resultsList = document.querySelector('.search-results-list');
    const resultCount = document.querySelector('.result-count');

    if (!resultsPanel || !resultsList) return;

    resultCount.textContent = `(${results.length})`;

    if (results.length === 0) {
      resultsList.innerHTML = '<div class="search-empty">找不到相符的結果</div>';
      resultsPanel.style.display = 'block';
      return;
    }

    // 分組顯示結果
    let html = '';
    let currentType = '';

    for (const result of results) {
      if (result.type !== currentType) {
        currentType = result.type;
        html += `<div class="result-group-header">${this.getResultTypeLabel(result.type)}</div>`;
      }

      html += this.renderSearchResult(result);
    }

    resultsList.innerHTML = html;
    resultsPanel.style.display = 'block';

    // 綁定結果點擊事件
    document.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const resultId = item.getAttribute('data-result-id');
        const resultType = item.getAttribute('data-result-type');
        this.navigateToResult(resultId, resultType);
      });
    });
  }

  /**
   * 渲染單個搜尋結果
   */
  renderSearchResult(result) {
    const typeLabel = this.getResultTypeLabel(result.type);
    let title = result.label || result.name || '';
    let subtitle = '';

    if (result.type === 'csv-item') {
      subtitle = `代碼: ${result.code} | 點數: ${result.points}`;
    } else if (result.content) {
      // 顯示內容預覽
      const preview = result.content.substring(0, 100).replace(/\n/g, ' ');
      subtitle = `${preview}...`;
    }

    return `
      <div class="search-result-item" data-result-id="${result.id}" data-result-type="${result.type}">
        <div class="result-title">${this.escapeHtml(title)}</div>
        ${subtitle ? `<div class="result-subtitle">${this.escapeHtml(subtitle)}</div>` : ''}
      </div>
    `;
  }

  /**
   * 獲取結果類型標籤
   */
  getResultTypeLabel(type) {
    const labels = {
      'section': '📄 章節',
      'chapter': '📚 章',
      'part': '📖 部',
      'csv-item': '💊 CSV 項目'
    };
    return labels[type] || type;
  }

  /**
   * 導航到搜尋結果
   */
  async navigateToResult(resultId, resultType) {
    if (resultType === 'csv-item') {
      // CSV 項目導航 (需要在 CSV 處理器中實現)
      console.log('導航到 CSV 項目:', resultId);
      // 這裡可以觸發 CSV 項目展開事件
      window.dispatchEvent(new CustomEvent('navigate-csv', { detail: { id: resultId } }));
    } else {
      // 文檔節點導航
      const node = this.getNode(resultId);
      if (!node) {
        console.warn('找不到節點:', resultId);
        return;
      }

      // 找到節點的 DOM 元素並點擊它
      const element = document.querySelector(`[data-node-id="${resultId}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });

        // 如果是可展開的節點，先展開它
        if (node.has_children && !this.expandedNodes.has(resultId)) {
          const header = element.querySelector('.tree-node-header');
          if (header) {
            header.click();
            setTimeout(() => {
              // 展開後再點擊顯示詳情
              if (!node.has_children && header.parentElement) {
                header.click();
              }
            }, 200);
          }
        } else if (!node.has_children) {
          // 不可展開的節點，直接顯示詳情
          const header = element.querySelector('.tree-node-header');
          if (header) {
            header.click();
          }
        }
      }
    }

    // 關閉搜尋結果面板
    const resultsPanel = document.querySelector('.search-results-panel');
    if (resultsPanel) {
      resultsPanel.style.display = 'none';
    }
  }

  /**
   * 清空搜尋
   */
  clearSearch() {
    const resultsPanel = document.querySelector('.search-results-panel');
    const searchInput = document.querySelector('.search-input');

    if (resultsPanel) {
      resultsPanel.style.display = 'none';
    }

    if (searchInput) {
      searchInput.value = '';
    }
  }
}

// 導出供全局使用
window.LazyTreeLoader = LazyTreeLoader;
