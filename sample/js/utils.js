/**
 * 工具函數模組
 */

/**
 * 顯示通知訊息
 * @param {string} message 訊息內容
 * @param {string} type 訊息類型 (success, error, info)
 * @param {number} duration 顯示時間（毫秒）
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;

    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);

    setTimeout(() => {
        toast.classList.remove('hidden');
    }, 10);
}

/**
 * 隱藏元素
 * @param {HTMLElement} element
 */
function hide(element) {
    element?.classList.add('hidden');
}

/**
 * 顯示元素
 * @param {HTMLElement} element
 */
function show(element) {
    element?.classList.remove('hidden');
}

/**
 * 切換元素顯示/隱藏
 * @param {HTMLElement} element
 */
function toggle(element) {
    element?.classList.toggle('hidden');
}

/**
 * 清空元素內容
 * @param {HTMLElement} element
 */
function clear(element) {
    if (element) element.innerHTML = '';
}

/**
 * 延遲執行
 * @param {number} ms 毫秒
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 驗證藥品代號格式
 * @param {string} code 藥品代號
 * @returns {boolean}
 */
function isValidDrugCode(code) {
    return /^AC\d{8}$/.test(code);
}

/**
 * 驗證 ATC 代碼格式
 * @param {string} code ATC 代碼
 * @returns {boolean}
 */
function isValidAtcCode(code) {
    return /^[A-Z][0-9A-Z]{0,6}$/.test(code);
}

/**
 * 格式化日期時間
 * @param {string} dateString ISO 日期字符串
 * @returns {string} 格式化後的日期
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * 複製文字到剪貼簿
 * @param {string} text 要複製的文字
 */
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('已複製到剪貼簿', 'success');
    }).catch(() => {
        showToast('複製失敗', 'error');
    });
}

/**
 * 下載 CSV 檔案
 * @param {array} data 資料陣列
 * @param {string} filename 檔案名稱
 */
function downloadCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
        showToast('沒有資料可導出', 'error');
        return;
    }

    // 取得標題
    const headers = Object.keys(data[0]);

    // 建立 CSV 內容
    let csv = headers.join(',') + '\n';
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // 處理包含逗號的值
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value || '';
        });
        csv += values.join(',') + '\n';
    });

    // 建立 Blob 和下載連結
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`已下載 ${filename}`, 'success');
}

/**
 * 解析 CSV 檔案
 * @param {File} file CSV 檔案
 * @returns {Promise<array>} 解析後的資料
 */
function parseCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const csv = event.target.result;
                const lines = csv.trim().split('\n');

                if (lines.length < 2) {
                    reject(new Error('CSV 檔案為空'));
                    return;
                }

                // 取得標題
                const headers = lines[0].split(',').map(h => h.trim());

                // 解析資料
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim());
                    const row = {};

                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });

                    data.push(row);
                }

                resolve(data);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => {
            reject(new Error('檔案讀取失敗'));
        };

        reader.readAsText(file, 'utf-8');
    });
}

/**
 * 節流函數
 * @param {Function} func 要執行的函數
 * @param {number} delay 延遲時間
 */
function throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

/**
 * 防抖函數
 * @param {Function} func 要執行的函數
 * @param {number} delay 延遲時間
 */
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * 格式化幣值
 * @param {number} value 數值
 * @returns {string} 格式化後的幣值
 */
function formatCurrency(value) {
    if (value === null || value === undefined) return 'N/A';
    return `NT$${parseFloat(value).toFixed(2)}`;
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深複製物件
 * @param {any} obj 物件
 * @returns {any} 複製後的物件
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
