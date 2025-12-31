/**
 * API 客戶端模組
 * 提供所有後端 API 呼叫的包裝函數
 */

// API 基礎 URL
const API_BASE_URL = 'http://127.0.0.1:5000/api/v1';

/**
 * 標準化 API 回應
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function handleResponse(response) {
    const data = await response.json();

    if (!response.ok) {
        const error = data.error || {};
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return data;
}

/**
 * 單一藥品查詢（從主程式 CSV）
 * @param {string} drugCode 藥品代號
 * @returns {Promise<Object>}
 */
async function searchDrug(drugCode) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/clinic-drugs/search?q=${encodeURIComponent(drugCode)}`
        );
        const data = await handleResponse(response);
        return data.data;
    } catch (error) {
        console.error('搜尋藥品失敗:', error);
        throw error;
    }
}

/**
 * 新增單一藥物到診所藥物庫
 * @param {string} drugCode 藥品代號
 * @returns {Promise<Object>}
 */
async function addClinicDrug(drugCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/clinic-drugs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ drug_code: drugCode })
        });
        const data = await handleResponse(response);
        return data.data;
    } catch (error) {
        console.error('新增藥物失敗:', error);
        throw error;
    }
}

/**
 * 刪除診所藥物
 * @param {string} drugCode 藥品代號
 * @returns {Promise<Object>}
 */
async function deleteClinicDrug(drugCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/clinic-drugs/${drugCode}`, {
            method: 'DELETE'
        });
        const data = await handleResponse(response);
        return data;
    } catch (error) {
        console.error('刪除藥物失敗:', error);
        throw error;
    }
}

/**
 * 查詢指定分類的診所藥物列表
 * @param {Object} options 查詢選項
 * @param {string} options.atcCode ATC 代碼
 * @param {number} options.page 頁碼
 * @param {number} options.perPage 每頁筆數
 * @param {string} options.search 搜尋關鍵詞
 * @returns {Promise<Object>}
 */
async function getClinicDrugs(options = {}) {
    try {
        const params = new URLSearchParams();

        if (options.atcCode) {
            params.append('atc_code', options.atcCode);
        }
        if (options.search) {
            params.append('search', options.search);
        }
        if (options.page) {
            params.append('page', options.page);
        }
        if (options.perPage) {
            params.append('per_page', options.perPage);
        }

        const url = `${API_BASE_URL}/clinic-drugs${params.toString() ? '?' + params.toString() : ''}`;
        const response = await fetch(url);
        const data = await handleResponse(response);
        return data.data;
    } catch (error) {
        console.error('查詢藥物清單失敗:', error);
        throw error;
    }
}

/**
 * 取得診所分類樹（含藥物計數）
 * @param {number} maxLevel 最大層級（預設 4）
 * @returns {Promise<Array>}
 */
async function getCategoryTree(maxLevel = 4) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/clinic-categories/tree?max_level=${maxLevel}`
        );
        const data = await handleResponse(response);
        return data.data.tree;
    } catch (error) {
        console.error('查詢分類樹失敗:', error);
        throw error;
    }
}

/**
 * 按層級查詢分類（支援延遲加載）
 * @param {number} level 分類層級 (1-4)
 * @param {string} parentCode 父層代碼（可選）
 * @returns {Promise<Array>}
 */
async function getCategoriesByLevel(level, parentCode = null) {
    try {
        const params = new URLSearchParams({ level });
        if (parentCode) {
            params.append('parent', parentCode);
        }

        const response = await fetch(
            `${API_BASE_URL}/clinic-categories?${params.toString()}`
        );
        const data = await handleResponse(response);
        return data.data;
    } catch (error) {
        console.error(`查詢第 ${level} 層分類失敗:`, error);
        throw error;
    }
}

/**
 * 批量導入診所藥物（CSV 檔案）
 * @param {File} file CSV 檔案
 * @returns {Promise<Object>}
 */
async function batchImportDrugs(file) {
    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/clinic-drugs/batch-import`, {
            method: 'POST',
            body: formData
        });
        const data = await handleResponse(response);
        return data.data;
    } catch (error) {
        console.error('批量導入失敗:', error);
        throw error;
    }
}

/**
 * 取得所有診所藥物
 * @returns {Promise<Object>}
 */
async function getAllClinicDrugs() {
    try {
        const response = await fetch(`${API_BASE_URL}/clinic-drugs/all`);
        const data = await handleResponse(response);
        return data.data;
    } catch (error) {
        console.error('查詢全部藥物失敗:', error);
        throw error;
    }
}

/**
 * 系統健康檢查
 * @returns {Promise<Object>}
 */
async function healthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await handleResponse(response);
        return data;
    } catch (error) {
        console.error('系統健康檢查失敗:', error);
        throw error;
    }
}
