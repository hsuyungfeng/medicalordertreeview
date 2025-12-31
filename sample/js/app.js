/**
 * ATC 診所藥物分類系統 - 主應用邏輯
 * 支援延遲加載分類樹、藥物卡片展開、tooltip 互動
 */

// ==================== 應用狀態管理 ====================

const appState = {
    selectedDrugs: new Map(),        // 已選藥物 (drug_code -> drug_obj)
    expandedCategories: new Set(),   // 已展開的分類
    expandedDrugCards: new Set(),    // 已展開的藥物卡片
    categoryCache: {},               // 分類快取
    currentCategory: null,           // 當前選中分類
    currentPage: 1,
    perPage: 50,
    totalDrugs: 0,
    searchQuery: ''
};

// ==================== 應用初始化 ====================

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('應用初始化中...');

        // 初始化事件監聽器
        initEventListeners();

        // 初始化分類樹（延遲加載）
        await initCategoryTreeLazy();

        console.log('應用初始化完成');
        showToast('系統已就緒', 'success');
    } catch (error) {
        console.error('應用初始化失敗:', error);
        showToast('應用初始化失敗: ' + error.message, 'error');
    }
});

// ==================== 事件監聽器初始化 ====================

function initEventListeners() {
    // 隱形功能面板控制
    initFunctionsPanelListeners();

    // 批量導入
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('csv-file-input');
    const selectFileBtn = document.getElementById('select-file-btn');

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#d3e3fd';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.backgroundColor = '#e8f0fe';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.backgroundColor = '#e8f0fe';
        handleFileDrop(e);
    });

    uploadArea.addEventListener('click', () => fileInput.click());
    selectFileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelected(e.target.files[0]);
        }
    });

    // 搜尋 / 匯出 樹狀檢視控制
    const treeSearch = document.getElementById('tree-search-input');
    const collapseAllBtn = document.getElementById('collapse-all-btn');
    const exportSelectedBtn = document.getElementById('export-selected-btn');

    if (treeSearch) {
        treeSearch.addEventListener('input', (e) => {
            searchAndExpand(e.target.value);
        });
    }

    if (collapseAllBtn) {
        collapseAllBtn.addEventListener('click', () => collapseAll());
    }

    if (exportSelectedBtn) {
        exportSelectedBtn.addEventListener('click', () => handleExportSelected());
    }

    // 新增藥物
    document.getElementById('add-drug-btn').addEventListener('click', handleAddDrug);
    document.getElementById('new-drug-code').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleAddDrug();
    });
}

// ==================== 隱形功能面板管理 ====================

function initFunctionsPanelListeners() {
    const toggleBtn = document.getElementById('toggle-functions-btn');
    const closeBtn = document.getElementById('close-functions-btn');
    const panel = document.getElementById('functions-panel');
    const overlay = document.getElementById('functions-overlay');

    // 打開功能面板
    toggleBtn.addEventListener('click', () => {
        openFunctionsPanel();
    });

    // 關閉功能面板
    closeBtn.addEventListener('click', () => {
        closeFunctionsPanel();
    });

    // 點擊遮罩關閉
    overlay.addEventListener('click', () => {
        closeFunctionsPanel();
    });

    // ESC 鍵關閉
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!panel.classList.contains('hidden')) {
                closeFunctionsPanel();
            } else {
                // 如果沒有面板打開，則重置頁面（重新整理）
                window.location.reload();
            }
        }
    });
}

function openFunctionsPanel() {
    const panel = document.getElementById('functions-panel');
    const overlay = document.getElementById('functions-overlay');

    panel.classList.remove('hidden');
    overlay.classList.remove('hidden');
}

function closeFunctionsPanel() {
    const panel = document.getElementById('functions-panel');
    const overlay = document.getElementById('functions-overlay');

    panel.classList.add('hidden');
    overlay.classList.add('hidden');
}

// ==================== 標籤頁管理 ====================

// ==================== 分類樹延遲加載 ====================

async function initCategoryTreeLazy() {
    try {
        const container = document.getElementById('category-tree-lazy');
        container.innerHTML = '';

        // 載入第 1 層（14 個主要組別）
        const level1Categories = await getCategoriesByLevel(1);
        renderCategoryLevel(level1Categories, container, 1);
    } catch (error) {
        console.error('初始化分類樹失敗:', error);
        showToast('分類樹載入失敗', 'error');
    }
}

/**
 * 按層級查詢分類（新增 API 方法）
 * 注意：使用 api.js 中定義的函數
 */
async function getCategoriesByLevel(level, parentCode = null) {
    try {
        const params = new URLSearchParams({ level });
        if (parentCode) params.append('parent', parentCode);

        const url = `${API_BASE_URL}/clinic-categories?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('查詢分類失敗:', error);
        return [];
    }
}

/**
 * 渲染指定層級的分類
 */
function renderCategoryLevel(categories, parentElement, level) {
    categories.forEach(category => {
        const node = document.createElement('div');
        node.className = 'category-node';
        node.dataset.code = category.id;
        node.dataset.level = level;

        // 渲染節點內容
        const hasChildren = category.children_count > 0;
        node.innerHTML = `
            <span class="expand-icon"></span>
            <span class="category-name">${category.id} - ${category.name}</span>
            <span class="drug-count">(${category.drug_count})</span>
        `;

        // 獲取元素
        const expandIcon = node.querySelector('.expand-icon');
        const categoryName = node.querySelector('.category-name');

        // 1. 點擊箭頭：僅切換展開/收起
        if (hasChildren) {
            expandIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleCategoryExpand(category.id, level, node);
            });
        } else {
            expandIcon.style.visibility = 'hidden';
        }

        // 2. 點擊名稱：選擇分類 (觸發詳細/列表視圖)
        // 並嘗試展開 (如果是收起狀態)
        categoryName.addEventListener('click', (e) => {
            e.stopPropagation();
            selectCategory(category.id, level, node);

            // 若有子分類且未展開，順便展開
            if (hasChildren && !node.classList.contains('expanded')) {
                toggleCategoryExpand(category.id, level, node);
            }
        });

        // 3. 點擊整行背景：同點擊名稱
        node.addEventListener('click', (e) => {
            e.stopPropagation();
            // 如果點到的是 expand-icon 或 category-name，前面已經處理並 stopPropagation
            // 這裡處理點擊空白處
            selectCategory(category.id, level, node);
            if (hasChildren && !node.classList.contains('expanded')) {
                toggleCategoryExpand(category.id, level, node);
            }
        });

        parentElement.appendChild(node);
    });
}

/**
 * 切換分類展開/收起
 */
async function toggleCategoryExpand(categoryCode, level, nodeElement) {
    const isExpanded = appState.expandedCategories.has(categoryCode);


    if (isExpanded) {
        // 收起：移除 expanded 類別
        appState.expandedCategories.delete(categoryCode);
        nodeElement.classList.remove('expanded');
        const childContainer = nodeElement.querySelector('.children-container');
        if (childContainer) childContainer.remove();

        // 專注模式：如果是第 1 層，取消隱藏其他兄弟節點
        if (level === 1) {
            document.querySelectorAll('.category-node[data-level="1"]').forEach(node => {
                node.classList.remove('hidden-sibling');
            });
        }
    } else {
        // 展開：添加 expanded 類別
        appState.expandedCategories.add(categoryCode);
        nodeElement.classList.add('expanded');

        // 專注模式：如果是第 1 層，隱藏其他兄弟節點
        if (level === 1) {
            document.querySelectorAll('.category-node[data-level="1"]').forEach(node => {
                if (node !== nodeElement) {
                    node.classList.add('hidden-sibling');
                }
            });
        }

        // 檢查快取
        let children = [];
        let isDrugLevel = false;

        // 如果是第 4 層，則載入藥物（第 5 層）
        if (level === 4) {
            isDrugLevel = true;
            if (appState.categoryCache[categoryCode]) {
                children = appState.categoryCache[categoryCode];
            } else {
                children = await loadDrugsForCategory(categoryCode);
                appState.categoryCache[categoryCode] = children;
            }
        } else {
            // 普通分類層級
            if (appState.categoryCache[categoryCode]) {
                children = appState.categoryCache[categoryCode];
            } else {
                children = await getCategoriesByLevel(level + 1, categoryCode);
                appState.categoryCache[categoryCode] = children;
            }
        }

        // 渲染子層
        if (children.length > 0) {
            const childContainer = document.createElement('div');
            childContainer.className = 'children-container';

            if (isDrugLevel) {
                console.log('Rendering Drug Level: Adding grid class');
                childContainer.classList.add('drug-grid-container');
                renderDrugLevel(children, childContainer);
            } else {
                renderCategoryLevel(children, childContainer, level + 1);
            }

            nodeElement.appendChild(childContainer);
        } else if (isDrugLevel) {
            // 無藥物的情況
            const childContainer = document.createElement('div');
            childContainer.className = 'children-container';
            const emptyNode = document.createElement('div');
            emptyNode.className = 'category-node empty-node';
            emptyNode.innerHTML = `<span class="category-name" style="color: #999; font-style: italic;">無藥物資料</span>`;
            childContainer.appendChild(emptyNode);
            nodeElement.appendChild(childContainer);
        }
    }
}

/**
 * 載入分類下的藥物（作為第 5 層）
 */
async function loadDrugsForCategory(atcCode) {
    try {
        // 使用現有的藥物查詢 API，不分頁取所有
        const params = new URLSearchParams({
            atc_code: atcCode,
            per_page: 1000  // 假設單一分類下藥物不會超過 1000
        });

        const url = `${API_BASE_URL}/clinic-drugs?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        return data.data.drugs || [];
    } catch (error) {
        console.error('載入分類藥物失敗:', error);
        return [];
    }
}

/**
 * 渲染藥物層級（第 5 層）
 */
function renderDrugLevel(drugs, parentElement) {
    drugs.forEach(drug => {
        const node = document.createElement('div');
        node.className = 'category-node drug-node';
        node.dataset.code = drug.drug_code;
        node.dataset.level = 5;

        // 藥物節點內容
        node.innerHTML = `
            <input type="checkbox" class="select-drug-checkbox" aria-label="選取藥物" />
            <span class="drug-icon">💊</span>
            <span class="category-name">${drug.drug_code} - ${drug.drug_name_zh}</span>
            <span class="ingredient-info">(${drug.ingredient || '—'})</span>
        `;

        // 點擊藥物節點 - 打開 Modal（但勾選 checkbox 時不應觸發）
        node.addEventListener('click', (e) => {
            // 點擊 checkbox 時不打開 modal
            if (e.target.classList && e.target.classList.contains('select-drug-checkbox')) return;
            e.stopPropagation();
            openDrugActionModal(drug);
        });

        // checkbox 事件：選取/取消選取
        const checkbox = node.querySelector('.select-drug-checkbox');
        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            if (checkbox.checked) {
                appState.selectedDrugs.set(drug.drug_code, drug);
                node.classList.add('selected');
            } else {
                appState.selectedDrugs.delete(drug.drug_code);
                node.classList.remove('selected');
            }
        });

        parentElement.appendChild(node);
    });
}

// ==================== 藥物操作 Modal 管理 ====================

function openDrugActionModal(drug) {
    const modal = document.getElementById('drug-modal');
    if (!modal) return;

    // 填入資料
    document.getElementById('modal-drug-code').textContent = drug.drug_code;
    document.getElementById('modal-drug-name').textContent = drug.drug_name_zh;
    document.getElementById('modal-drug-ingredient').textContent = drug.ingredient || '—';

    // 顯示 Modal
    modal.classList.remove('hidden');

    // 綁定按鈕事件 (需先移除舊事件避免疊加，這裡使用簡單的 onclick 覆蓋)
    document.getElementById('close-drug-modal').onclick = closeDrugActionModal;
    document.getElementById('modal-btn-cancel').onclick = closeDrugActionModal;

    document.getElementById('modal-btn-process').onclick = () => {
        showToast(`正在處理藥物: ${drug.drug_name_zh}`, 'info');
        // 這裡可以加入更多實際的處理邏輯，例如跳轉頁面或編輯
        closeDrugActionModal();
    };
}

function closeDrugActionModal() {
    const modal = document.getElementById('drug-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

/**
 * 選擇分類
 */
function selectCategory(categoryCode, level, nodeElement) {
    // 更新選中狀態
    document.querySelectorAll('.category-node.selected').forEach(node => {
        node.classList.remove('selected');
    });
    nodeElement.classList.add('selected');

    appState.currentCategory = categoryCode;

    // 如果不是第 4 層，我們不一定要展開
    // 但現在邏輯是點擊展開，雙擊選擇
    // 第 4 層展開會顯示藥物列表

    // CHECK: 如果這是最後一層類別且藥物數量 <= 10，切換到詳細模式
    const drugCountElem = nodeElement.querySelector('.drug-count');
    const drugCount = drugCountElem ? parseInt(drugCountElem.textContent.replace(/[()]/g, '')) : 0;

    if (drugCount > 0 && drugCount <= 10) {
        console.log(`Small category detected (${drugCount}), switching to Detailed View`);
        loadDetailedDrugList(categoryCode);
    } else {
        // 標準列表模式
        loadMainDrugList(categoryCode);
    }
}

// ==================== 詳細藥物列表 (小分類) ====================

async function loadDetailedDrugList(atcCode) {
    try {
        const container = document.getElementById('main-drug-list');
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>載入詳細藥物資料...</p></div>';
        // 隱藏分頁，因為詳細模式通常是全部顯示
        document.getElementById('main-pagination').classList.add('hidden');

        // 獲取藥物
        const params = new URLSearchParams({ atc_code: atcCode, per_page: 100 });
        const url = `${API_BASE_URL}/clinic-drugs?${params}`;
        const response = await fetch(url);
        const data = await response.json();
        const drugs = data.data.drugs || [];

        container.innerHTML = '';
        container.className = 'detailed-drug-list'; // Add layout class

        if (drugs.length === 0) {
            container.innerHTML = '<p class="empty-msg">此分類下無藥物</p>';
            return;
        }

        drugs.forEach(drug => {
            const card = createDetailedDrugCard(drug);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('詳細列表載入失敗:', error);
        showToast('載入失敗', 'error');
    }
}

function createDetailedDrugCard(drug) {
    const card = document.createElement('div');
    card.className = 'detailed-drug-card';

    // Header: Code + Name + AI Button
    const header = document.createElement('div');
    header.className = 'detailed-header';

    const codeGroup = document.createElement('span');
    codeGroup.className = 'detailed-code-group';
    codeGroup.innerHTML = `
        <span class="detailed-code">${drug.drug_code}</span>
        <span class="detailed-name" title="${drug.drug_name_zh}">${drug.drug_name_zh}</span>
    `;

    // AI Button (Compact)
    const aiBtn = document.createElement('button');
    aiBtn.className = 'btn-ai-compact';
    aiBtn.innerHTML = '🤖'; // Or use an icon class
    aiBtn.title = 'AI 摘要';
    aiBtn.onclick = (e) => {
        e.stopPropagation(); // Avoid card click if any
        openAiNoteModal(drug);
    };

    if (!drug.ai_note) {
        aiBtn.style.opacity = '0.3';
        aiBtn.disabled = true;
    }

    header.appendChild(codeGroup);
    header.appendChild(aiBtn);

    // Meta: Ingredient
    const meta = document.createElement('div');
    meta.className = 'detailed-meta';
    meta.textContent = `${drug.ingredient || '—'}`;
    meta.title = drug.ingredient || '';

    // Actions: Prescribe + Delete
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'detailed-actions';

    // Button: Prescribe
    const prescribeBtn = document.createElement('button');
    prescribeBtn.className = 'btn-action btn-prescribe';
    prescribeBtn.textContent = '開立';
    prescribeBtn.onclick = () => {
        showToast(`已開立藥物：${drug.drug_code}`, 'success');
        console.log('Connecting to external prescription system...', drug);
    };

    // Button: Delete
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-action btn-delete';
    deleteBtn.textContent = '刪除';
    deleteBtn.onclick = () => handleDeleteDrug(drug.drug_code);

    actionsDiv.appendChild(prescribeBtn);
    actionsDiv.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(meta);
    card.appendChild(actionsDiv);

    return card;
}

// ==================== AI 摘要 Modal ====================

function openAiNoteModal(drug) {
    const modal = document.getElementById('ai-note-modal');
    const contentDiv = document.getElementById('ai-note-content');

    // Set content (handle newlines or markdown if needed)
    contentDiv.textContent = drug.ai_note || '尚無 AI 摘要資料。';

    // Show
    modal.classList.remove('hidden');

    // Close handlers
    const closeBtn = document.getElementById('close-ai-note-modal');
    closeBtn.onclick = () => modal.classList.add('hidden');
}

// ==================== 藥物列表管理 ====================

async function loadMainDrugList(atcCode = null) {
    try {
        const container = document.getElementById('main-drug-list');
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>載入中...</p></div>';

        const params = new URLSearchParams({
            page: appState.currentPage,
            per_page: appState.perPage
        });

        if (atcCode) {
            params.append('atc_code', atcCode);
        }

        if (appState.searchQuery) {
            params.append('search', appState.searchQuery);
        }

        const url = `${API_BASE_URL}/clinic-drugs?${params}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        const drugs = data.data || [];
        appState.totalDrugs = data.total || 0;

        container.innerHTML = '';

        if (drugs.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #999; padding: 40px 20px;">未找到藥物</p>';
        } else {
            drugs.forEach(drug => {
                const card = createDrugCard(drug);
                container.appendChild(card);
            });
        }

        // 渲染分頁
        renderPagination();
    } catch (error) {
        console.error('載入藥物列表失敗:', error);
        showToast('藥物列表載入失敗', 'error');
    }
}

/**
 * 建立藥物卡片元素
 */
function createDrugCard(drug) {
    const card = document.createElement('div');
    card.className = 'drug-card';
    card.dataset.drugCode = drug.drug_code;

    // 藥物摘要行
    const summary = document.createElement('div');
    summary.className = 'drug-summary';

    // 藥品代號
    const codeSpan = document.createElement('span');
    codeSpan.className = 'drug-code';
    codeSpan.textContent = drug.drug_code;

    // 成份
    const ingredientSpan = document.createElement('span');
    ingredientSpan.className = 'drug-ingredient';
    ingredientSpan.textContent = drug.ingredient || '—';

    // 中文名稱
    const nameSpan = document.createElement('span');
    nameSpan.className = 'drug-name-zh';
    nameSpan.textContent = drug.drug_name_zh;

    // AI 摘要 Tooltip
    let tooltipHtml = '';
    if (drug.ai_note) {
        tooltipHtml = `
            <div class="ai-tooltip-trigger">
                <i>ℹ️</i>
                <div class="ai-tooltip-content">${escapeHtml(drug.ai_note)}</div>
            </div>
        `;
    }

    // 展開按鈕
    const expandBtn = document.createElement('button');
    expandBtn.className = 'expand-btn';
    expandBtn.textContent = '▼';

    summary.appendChild(codeSpan);
    summary.appendChild(ingredientSpan);
    summary.appendChild(nameSpan);
    if (tooltipHtml) {
        summary.innerHTML += tooltipHtml;
    }
    summary.appendChild(expandBtn);

    card.appendChild(summary);

    // 操作按鈕區（隱藏）
    const actions = document.createElement('div');
    actions.className = 'drug-actions hidden';

    const selectBtn = document.createElement('button');
    selectBtn.className = 'btn btn-primary';
    selectBtn.textContent = '選擇';
    selectBtn.addEventListener('click', () => {
        handleSelectDrug(drug.drug_code, drug.drug_name_zh);
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = '刪除';
    deleteBtn.addEventListener('click', () => {
        handleDeleteDrug(drug.drug_code);
    });

    actions.appendChild(selectBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    // 綁定展開按鈕事件
    expandBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = appState.expandedDrugCards.has(drug.drug_code);

        if (isExpanded) {
            appState.expandedDrugCards.delete(drug.drug_code);
            actions.classList.add('hidden');
            expandBtn.textContent = '▼';
        } else {
            appState.expandedDrugCards.add(drug.drug_code);
            actions.classList.remove('hidden');
            expandBtn.textContent = '▲';
        }
    });

    return card;
}

// ==================== 藥物操作 ====================

async function handleAddDrug() {
    const input = document.getElementById('new-drug-code');
    const drugCode = input.value.trim().toUpperCase();

    if (!drugCode) {
        showToast('請輸入藥品代號', 'info');
        return;
    }

    if (!/^AC\d{8}$/.test(drugCode)) {
        showToast('藥品代號格式不正確（應為 AC + 8位數字）', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/clinic-drugs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ drug_code: drugCode })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '新增失敗');
        }

        showToast('藥物新增成功', 'success');
        input.value = '';

        // 重新載入列表
        await loadMainDrugList(appState.currentCategory);
    } catch (error) {
        console.error('新增藥物失敗:', error);
        showToast('新增藥物失敗: ' + error.message, 'error');
    }
}

async function handleDeleteDrug(drugCode) {
    if (!confirm(`確認刪除藥物 ${drugCode}？`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/clinic-drugs/${drugCode}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '刪除失敗');
        }

        showToast('藥物已刪除', 'success');

        // 重新載入列表
        await loadMainDrugList(appState.currentCategory);
    } catch (error) {
        console.error('刪除藥物失敗:', error);
        showToast('刪除藥物失敗: ' + error.message, 'error');
    }
}

async function handleSelectDrug(drugCode, drugName) {
    appState.selectedDrugs.set(drugCode, {
        drug_code: drugCode,
        drug_name_zh: drugName
    });

    showToast(`已選擇: ${drugName}`, 'success');
    updateSelectedDrugsList();
}

// ==================== 已選藥物管理 ====================

function updateSelectedDrugsList() {
    // 已選藥物列表功能已移除
    // 藥物選擇通過藥物卡片的操作按鈕進行
}

function handleClearSelected() {
    if (appState.selectedDrugs.size === 0) {
        showToast('未選擇任何藥物', 'info');
        return;
    }

    if (!confirm('確認清空所有已選藥物？')) {
        return;
    }

    appState.selectedDrugs.clear();
    updateSelectedDrugsList();
    showToast('已清空選擇', 'success');
}

async function handleExportSelected() {
    if (appState.selectedDrugs.size === 0) {
        showToast('未選擇任何藥物', 'info');
        return;
    }

    try {
        const drugs = Array.from(appState.selectedDrugs.values());
        const csv = convertToCSV(drugs);
        downloadCSV(csv, '診所藥物清單.csv');
        showToast('已導出藥物清單', 'success');
    } catch (error) {
        console.error('導出失敗:', error);
        showToast('導出失敗', 'error');
    }
}

function convertToCSV(drugs) {
    const headers = ['藥品代號', '中文名稱'];
    const rows = drugs.map(drug => [drug.drug_code, drug.drug_name_zh]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
}

// ==================== 批量導入 ====================

async function handleFileDrop(event) {
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        handleFileSelected(files[0]);
    }
}

async function handleFileSelected(file) {
    if (!file.name.endsWith('.csv')) {
        showToast('請選擇 CSV 檔案', 'error');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        showProgressBar();

        const response = await fetch('/api/v1/clinic-drugs/batch-import', {
            method: 'POST',
            body: formData
        });

        hideProgressBar();

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || '導入失敗');
        }

        const data = await response.json();
        displayImportResult(data.data);

        // 重新載入列表和統計
        await loadMainDrugList(appState.currentCategory);
    } catch (error) {
        hideProgressBar();
        console.error('批量導入失敗:', error);
        showToast('批量導入失敗: ' + error.message, 'error');
    }
}

function showProgressBar() {
    const progress = document.getElementById('import-progress');
    progress.classList.remove('hidden');
}

function hideProgressBar() {
    const progress = document.getElementById('import-progress');
    progress.classList.add('hidden');
}

function displayImportResult(result) {
    const resultDiv = document.getElementById('import-result');
    const summary = document.getElementById('import-summary');

    summary.innerHTML = `
        已導入: ${result.imported_count} 筆<br>
        ${result.errors.length > 0 ? `失敗: ${result.errors.length} 筆` : ''}
    `;

    if (result.errors.length > 0) {
        summary.innerHTML += `<br><details><summary>查看失敗詳情</summary><pre>${result.errors.join('\n')}</pre></details>`;
    }

    resultDiv.classList.remove('hidden');

    // 3 秒後隱藏
    setTimeout(() => {
        resultDiv.classList.add('hidden');
    }, 5000);
}

// ==================== 分頁 ====================

function renderPagination() {
    const container = document.getElementById('main-pagination');
    container.innerHTML = '';

    const totalPages = Math.ceil(appState.totalDrugs / appState.perPage);

    if (totalPages <= 1) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    console.log('ATC App Initialized v3.0');

    // 上一頁
    if (appState.currentPage > 1) {
        const prevBtn = document.createElement('button');
        prevBtn.textContent = '上一頁';
        prevBtn.addEventListener('click', () => {
            appState.currentPage--;
            loadMainDrugList(appState.currentCategory);
        });
        container.appendChild(prevBtn);
    }

    // 頁碼
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.textContent = i.toString();
        if (i === appState.currentPage) {
            btn.classList.add('active');
        }
        btn.addEventListener('click', () => {
            appState.currentPage = i;
            loadMainDrugList(appState.currentCategory);
        });
        container.appendChild(btn);
    }

    // 下一頁
    if (appState.currentPage < totalPages) {
        const nextBtn = document.createElement('button');
        nextBtn.textContent = '下一頁';
        nextBtn.addEventListener('click', () => {
            appState.currentPage++;
            loadMainDrugList(appState.currentCategory);
        });
        container.appendChild(nextBtn);
    }
}

// ==================== 統計資訊 ====================

// ==================== 工具函數 ====================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    // 3 秒後移除
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================== 樹狀檢索與展開工具 ====================

function collapseAll() {
    document.querySelectorAll('.category-node.expanded').forEach(node => {
        const code = node.dataset.code;
        appState.expandedCategories.delete(code);
        node.classList.remove('expanded');
        const childContainer = node.querySelector('.children-container');
        if (childContainer) childContainer.remove();
    });

    document.querySelectorAll('.category-node').forEach(node => node.classList.remove('match'));
}

function searchAndExpand(term) {
    const q = (term || '').trim().toLowerCase();

    if (!q) {
        collapseAll();
        return;
    }

    // 清除舊的 match
    document.querySelectorAll('.category-node').forEach(node => node.classList.remove('match'));

    // 搜尋節點名稱與藥物名稱
    document.querySelectorAll('.category-node').forEach(node => {
        const labelElem = node.querySelector('.category-name');
        if (!labelElem) return;
        const text = labelElem.textContent.toLowerCase();
        if (text.includes(q)) {
            // 標記 match
            node.classList.add('match');

            // 展開所有父節點
            let p = node.parentElement;
            while (p && p.classList.contains('children-container')) {
                const parentNode = p.closest('.category-node');
                if (parentNode && !parentNode.classList.contains('expanded')) {
                    // 觸發展開（非同步可能會載入子節點）
                    const code = parentNode.dataset.code;
                    const lvl = parseInt(parentNode.dataset.level || '1', 10);
                    toggleCategoryExpand(code, lvl, parentNode);
                }
                p = parentNode ? parentNode.parentElement : null;
            }
        }
    });
}

// 匯出選取（簡單 wrapper，已存在 handleExportSelected）
function exportSelectedCSV() {
    handleExportSelected();
}
