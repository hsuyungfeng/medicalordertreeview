/**
 * 文檔容器調試工具
 * 在 browser console 中執行: window.debugContainers()
 */

window.debugContainers = function() {
  console.clear();
  console.log('%c🔍 文檔容器調試工具', 'font-size: 18px; color: #667eea; font-weight: bold;');
  console.log('');

  // ============================================
  // 1. 檢查全局變數
  // ============================================
  console.log('%c1️⃣ 檢查全局變數', 'font-size: 14px; font-weight: bold; color: #667eea;');

  const checks = {
    'LazyTreeLoader': !!window.LazyTreeLoader,
    'DocumentContentExtractor': !!window.DocumentContentExtractor,
    'Tree 實例': window.treeLoader ? '✓' : '✗'
  };

  Object.entries(checks).forEach(([name, status]) => {
    console.log(`  ${status ? '✅' : '❌'} ${name}`);
  });
  console.log('');

  // ============================================
  // 2. 檢查 DOM 結構
  // ============================================
  console.log('%c2️⃣ 檢查 DOM 結構', 'font-size: 14px; font-weight: bold; color: #667eea;');

  const treeContainer = document.querySelector('.tree-container');
  if (!treeContainer) {
    console.error('❌ 找不到 .tree-container');
    return;
  }

  const nodes = treeContainer.querySelectorAll('.tree-node');
  console.log(`  找到 ${nodes.length} 個樹節點`);
  console.log('');

  // 詳細檢查前3個節點
  console.log('%c節點詳細信息（前5個）:', 'font-size: 12px; font-weight: bold; color: #666;');

  let nodeCount = 0;
  for (const node of nodes) {
    if (nodeCount >= 5) break;
    nodeCount++;

    const nodeId = node.getAttribute('data-node-id');
    const label = node.querySelector('.node-label')?.textContent || '(無標籤)';

    const header = node.querySelector('.tree-node-header');
    const docContainer = node.querySelector('.tree-node-document');
    const childContainer = node.querySelector('.tree-node-children');
    const docIcon = header?.querySelector('.document-icon');
    const toggleIcon = header?.querySelector('.toggle-icon');

    const hasDocContent = docContainer ? docContainer.querySelector('.document-content-wrapper')?.hasChildNodes() : false;

    console.group(`  #${nodeCount}: ${label} (${nodeId})`);
    console.log(`    ├─ 頭部: ${header ? '✓' : '✗'}`);
    console.log(`    ├─ 文檔容器: ${docContainer ? '✓' : '✗'} ${docContainer ? `(已展開: ${node.classList.contains('document-expanded') ? '是' : '否'})` : ''}`);
    console.log(`    ├─ 文檔圖標: ${docIcon ? '✓' : '✗'}`);
    console.log(`    ├─ 子節點容器: ${childContainer ? '✓' : '✗'} ${childContainer ? `(已展開: ${node.classList.contains('expanded') ? '是' : '否'})` : ''}`);
    console.log(`    ├─ Toggle 圖標: ${toggleIcon ? `✓ (${toggleIcon.textContent})` : '✗'}`);
    console.log(`    └─ 文檔內容已加載: ${hasDocContent ? '✓' : '✗'}`);
    console.groupEnd();
  }
  console.log('');

  // ============================================
  // 3. 檢查事件監聽器
  // ============================================
  console.log('%c3️⃣ 檢查事件監聽器', 'font-size: 14px; font-weight: bold; color: #667eea;');

  const docIcons = document.querySelectorAll('.document-icon');
  console.log(`  發現 ${docIcons.length} 個文檔圖標`);

  if (docIcons.length > 0) {
    // 嘗試偵測事件監聽器
    const firstIcon = docIcons[0];
    const listeners = getEventListeners?.(firstIcon);

    if (listeners?.click?.length > 0) {
      console.log(`  ✅ 第一個圖標已綁定 ${listeners.click.length} 個 click 監聽器`);
    } else if (listeners) {
      console.log(`  ℹ️ 無法確定 click 監聽器（需要在 Chrome DevTools 中檢查）`);
    } else {
      console.log(`  ℹ️ getEventListeners() 不可用（不在 Chrome DevTools 中執行）`);
    }
  }
  console.log('');

  // ============================================
  // 4. 檢查 CSS 樣式
  // ============================================
  console.log('%c4️⃣ 檢查 CSS 樣式', 'font-size: 14px; font-weight: bold; color: #667eea;');

  // 創建測試元素
  const testDoc = document.createElement('div');
  testDoc.className = 'tree-node-document';
  document.body.appendChild(testDoc);

  const computed = window.getComputedStyle(testDoc);
  const docStyles = {
    'max-height': computed.maxHeight,
    'opacity': computed.opacity,
    'overflow': computed.overflow,
    'transition': computed.transition.substring(0, 50) // 只顯示前50個字符
  };

  Object.entries(docStyles).forEach(([key, value]) => {
    console.log(`  .tree-node-document`);
    console.log(`    └─ ${key}: ${value}`);
  });

  document.body.removeChild(testDoc);
  console.log('');

  // ============================================
  // 5. 快速測試功能
  // ============================================
  console.log('%c5️⃣ 快速測試功能', 'font-size: 14px; font-weight: bold; color: #667eea;');

  const firstDocIcon = document.querySelector('.document-icon');
  if (firstDocIcon) {
    console.log(`  ℹ️ 準備測試：將在 5 秒後自動點擊第一個文檔圖標...`);

    setTimeout(() => {
      console.log(`  🖱️ 點擊第一個文檔圖標...`);
      firstDocIcon.click();

      setTimeout(() => {
        const docContainer = firstDocIcon.closest('.tree-node')?.querySelector('.tree-node-document');
        if (docContainer) {
          const isExpanded = docContainer.parentElement.classList.contains('document-expanded');
          const maxHeight = docContainer.style.maxHeight || window.getComputedStyle(docContainer).maxHeight;
          const opacity = docContainer.style.opacity || window.getComputedStyle(docContainer).opacity;

          console.log(`  📊 點擊後的狀態:`);
          console.log(`    ├─ document-expanded 類: ${isExpanded ? '✓' : '✗'}`);
          console.log(`    ├─ max-height: ${maxHeight}`);
          console.log(`    └─ opacity: ${opacity}`);
        }
      }, 500);
    }, 5000);
  } else {
    console.log(`  ❌ 未找到文檔圖標，無法測試`);
  }

  console.log('');
  console.log('%c所有檢查完成！', 'font-size: 12px; color: #999;');
};

/**
 * 輔助函數：查找並展開第一個有文檔內容的節點
 */
window.autoExpandFirstDocument = function() {
  const firstDocIcon = document.querySelector('.document-icon');
  if (firstDocIcon) {
    console.log('🎯 自動展開第一個文檔...');
    firstDocIcon.click();
    return true;
  } else {
    console.warn('❌ 未找到任何文檔圖標');
    return false;
  }
};

/**
 * 輔助函數：列出所有已展開的文檔
 */
window.listExpandedDocuments = function() {
  const expandedNodes = document.querySelectorAll('.tree-node.document-expanded');
  console.log(`%c已展開的文檔: ${expandedNodes.length} 個`, 'font-size: 14px; font-weight: bold;');

  expandedNodes.forEach((node, idx) => {
    const label = node.querySelector('.node-label')?.textContent;
    const nodeId = node.getAttribute('data-node-id');
    console.log(`  ${idx + 1}. ${label} (${nodeId})`);
  });
};

/**
 * 輔助函數：收合所有文檔
 */
window.collapseAllDocuments = function() {
  const expandedNodes = document.querySelectorAll('.tree-node.document-expanded');
  console.log(`收合 ${expandedNodes.length} 個文檔...`);

  expandedNodes.forEach(node => {
    node.classList.remove('document-expanded');
    const docContainer = node.querySelector('.tree-node-document');
    if (docContainer) {
      docContainer.style.maxHeight = '0';
      docContainer.style.opacity = '0';
    }
  });

  console.log('✓ 已收合所有文檔');
};

// ============================================
// 在控制檯輸出幫助信息
// ============================================
console.log('%c🛠️ 調試工具已加載', 'font-size: 12px; color: #999;');
console.log('%c使用以下命令進行調試：', 'font-size: 12px; color: #999;');
console.log('  debugContainers()          - 運行完整的調試檢查');
console.log('  autoExpandFirstDocument()  - 自動展開第一個文檔');
console.log('  listExpandedDocuments()    - 列出所有已展開的文檔');
console.log('  collapseAllDocuments()     - 收合所有文檔');
console.log('');
