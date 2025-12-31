/**
 * 篩選 UX 增強系統 - Filter UX Enhancement System
 * 包含快捷鍵、狀態保存、動畫、歷史記錄功能
 */

/**
 * 快捷鍵管理器
 * 管理篩選編輯器的鍵盤快捷鍵
 */
class FilterKeyboardManager {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.shortcuts = new Map();
    this.enabled = true;
    this.settings = {
      altKey: true,
      ctrlKey: true,
      ...options
    };
    this.registerDefaultShortcuts();
  }

  /**
   * 註冊默認快捷鍵
   */
  registerDefaultShortcuts() {
    // Alt+A: 添加條件
    this.registerShortcut('Alt+A', () => {
      this.editor.addCondition();
      console.log('⌨️ 快捷鍵: 添加條件 (Alt+A)');
    }, '添加新條件');

    // Alt+C: 清空所有
    this.registerShortcut('Alt+C', () => {
      if (confirm('確定要清空所有條件?')) {
        this.editor.conditions = [];
        this.editor.render();
        console.log('⌨️ 快捷鍵: 清空條件 (Alt+C)');
      }
    }, '清空所有條件');

    // Alt+S: 保存模板
    this.registerShortcut('Alt+S', () => {
      this.editor.saveAsTemplate();
      console.log('⌨️ 快捷鍵: 保存模板 (Alt+S)');
    }, '保存為模板');

    // Alt+Enter: 應用篩選
    this.registerShortcut('Alt+Enter', () => {
      this.editor.triggerApply();
      console.log('⌨️ 快捷鍵: 應用篩選 (Alt+Enter)');
    }, '應用篩選');

    // Ctrl+Z: 撤銷（最後操作）
    this.registerShortcut('Control+Z', () => {
      if (this.editor.conditions.length > 0) {
        this.editor.conditions.pop();
        this.editor.render();
        console.log('⌨️ 快捷鍵: 撤銷 (Ctrl+Z)');
      }
    }, '撤銷最後操作');

    // Alt+T: 切換邏輯模式
    this.registerShortcut('Alt+T', () => {
      this.editor.logic = this.editor.logic === 'AND' ? 'OR' : 'AND';
      this.editor.render();
      console.log(`⌨️ 快捷鍵: 切換邏輯模式 (Alt+T) -> ${this.editor.logic}`);
    }, '切換 AND/OR 邏輯');
  }

  /**
   * 註冊自定義快捷鍵
   * @param {String} key - 快捷鍵 (如 'Alt+A', 'Control+S')
   * @param {Function} callback - 回調函數
   * @param {String} description - 快捷鍵描述
   */
  registerShortcut(key, callback, description = '') {
    this.shortcuts.set(key, {
      callback,
      description,
      enabled: true
    });
  }

  /**
   * 啟動快捷鍵監聽
   */
  enable() {
    this.enabled = true;
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    console.log('✓ 快捷鍵系統已啟用');
  }

  /**
   * 禁用快捷鍵監聽
   */
  disable() {
    this.enabled = false;
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    console.log('✓ 快捷鍵系統已禁用');
  }

  /**
   * 處理鍵盤事件
   */
  handleKeyDown(event) {
    if (!this.enabled) return;

    // 構造快捷鍵字符串
    let shortcut = '';
    if (event.ctrlKey) shortcut += 'Control+';
    if (event.altKey) shortcut += 'Alt+';
    if (event.shiftKey) shortcut += 'Shift+';
    shortcut += event.key.length > 1 ? event.key : event.key.toUpperCase();

    const shortcutInfo = this.shortcuts.get(shortcut);
    if (shortcutInfo && shortcutInfo.enabled) {
      event.preventDefault();
      shortcutInfo.callback();
    }
  }

  /**
   * 獲取所有快捷鍵
   */
  getShortcuts() {
    return Array.from(this.shortcuts.entries()).map(([key, info]) => ({
      key,
      description: info.description,
      enabled: info.enabled
    }));
  }

  /**
   * 顯示快捷鍵幫助
   */
  showHelp() {
    let helpText = '🎹 快捷鍵幫助\n\n';
    this.shortcuts.forEach((info, key) => {
      helpText += `${key}: ${info.description}\n`;
    });
    console.log(helpText);
    alert(helpText);
  }
}

/**
 * 狀態保存管理器
 * 自動保存和恢復篩選狀態
 */
class FilterStateManager {
  constructor(editor, storageKey = 'filterEditorState') {
    this.editor = editor;
    this.storageKey = storageKey;
    this.lastSavedState = null;
    this.autoSaveInterval = null;
    this.autoSaveDelay = 1000;  // 1 秒
  }

  /**
   * 初始化狀態管理
   */
  initialize() {
    // 嘗試恢復上次保存的狀態
    this.restoreState();

    // 啟動自動保存
    this.startAutoSave();

    console.log('✓ 狀態保存管理器已初始化');
  }

  /**
   * 保存當前狀態
   */
  saveState() {
    const state = {
      logic: this.editor.logic,
      conditions: JSON.parse(JSON.stringify(this.editor.conditions)),
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
      this.lastSavedState = state;
      console.log('💾 狀態已保存');
      return true;
    } catch (error) {
      console.warn('⚠️ 狀態保存失敗:', error.message);
      return false;
    }
  }

  /**
   * 恢復狀態
   */
  restoreState() {
    try {
      const stateJson = localStorage.getItem(this.storageKey);
      if (!stateJson) {
        console.log('ℹ️ 無保存的狀態');
        return false;
      }

      const state = JSON.parse(stateJson);
      this.editor.logic = state.logic;
      this.editor.conditions = JSON.parse(JSON.stringify(state.conditions));
      this.editor.render();

      const savedDate = new Date(state.timestamp).toLocaleString();
      console.log(`✓ 狀態已恢復 (保存於 ${savedDate})`);
      return true;
    } catch (error) {
      console.warn('⚠️ 狀態恢復失敗:', error.message);
      return false;
    }
  }

  /**
   * 啟動自動保存
   */
  startAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    let saveTimer = null;
    const debouncedSave = () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        this.saveState();
      }, this.autoSaveDelay);
    };

    // 監聽編輯器變更
    const originalRender = this.editor.render.bind(this.editor);
    this.editor.render = function() {
      originalRender();
      debouncedSave();
    };

    console.log('✓ 自動保存已啟動');
  }

  /**
   * 停止自動保存
   */
  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
    console.log('✓ 自動保存已停止');
  }

  /**
   * 清空保存的狀態
   */
  clearSavedState() {
    try {
      localStorage.removeItem(this.storageKey);
      this.lastSavedState = null;
      console.log('✓ 保存的狀態已清空');
      return true;
    } catch (error) {
      console.warn('⚠️ 清空狀態失敗:', error.message);
      return false;
    }
  }

  /**
   * 獲取最後保存的狀態
   */
  getLastSavedState() {
    return this.lastSavedState;
  }

  /**
   * 設置自動保存延遲
   */
  setAutoSaveDelay(ms) {
    this.autoSaveDelay = ms;
  }
}

/**
 * 篩選歷史記錄
 * 追蹤篩選操作的歷史
 */
class FilterHistory {
  constructor(maxSize = 50) {
    this.history = [];
    this.maxSize = maxSize;
    this.currentIndex = -1;
  }

  /**
   * 記錄篩選操作
   */
  record(action, conditions, logic) {
    // 移除當前索引之後的所有項目（新操作後）
    this.history = this.history.slice(0, this.currentIndex + 1);

    // 添加新紀錄
    const record = {
      action,
      conditions: JSON.parse(JSON.stringify(conditions)),
      logic,
      timestamp: new Date().toISOString()
    };

    this.history.push(record);

    // 限制歷史記錄大小
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }

    this.currentIndex = this.history.length - 1;

    console.log(`📝 操作已記錄: ${action} (${this.history.length}/${this.maxSize})`);
  }

  /**
   * 撤銷 (Undo)
   */
  undo() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      const record = this.history[this.currentIndex];
      console.log(`↶ 撤銷: ${record.action}`);
      return record;
    }
    console.warn('⚠️ 無法撤銷：已在最早操作');
    return null;
  }

  /**
   * 重做 (Redo)
   */
  redo() {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const record = this.history[this.currentIndex];
      console.log(`↷ 重做: ${record.action}`);
      return record;
    }
    console.warn('⚠️ 無法重做：已在最新操作');
    return null;
  }

  /**
   * 獲取當前紀錄
   */
  getCurrent() {
    if (this.currentIndex >= 0 && this.currentIndex < this.history.length) {
      return this.history[this.currentIndex];
    }
    return null;
  }

  /**
   * 獲取所有歷史記錄
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.history));
  }

  /**
   * 清空歷史
   */
  clear() {
    this.history = [];
    this.currentIndex = -1;
    console.log('✓ 歷史記錄已清空');
  }

  /**
   * 獲取歷史統計
   */
  getStats() {
    return {
      totalRecords: this.history.length,
      currentIndex: this.currentIndex,
      canUndo: this.currentIndex > 0,
      canRedo: this.currentIndex < this.history.length - 1
    };
  }

  /**
   * 匯出歷史記錄為 JSON
   */
  exportAsJSON() {
    return JSON.stringify({
      history: this.history,
      currentIndex: this.currentIndex,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }
}

/**
 * 篩選 UX 管理器
 * 整合所有 UX 增強功能
 */
class FilterUXManager {
  constructor(editor, options = {}) {
    this.editor = editor;
    this.keyboardManager = new FilterKeyboardManager(editor, options.keyboard);
    this.stateManager = new FilterStateManager(editor, options.storageKey);
    this.history = new FilterHistory(options.historySize || 50);
    this.animationEnabled = options.animationEnabled !== false;
    this.notificationEnabled = options.notificationEnabled !== false;
  }

  /**
   * 初始化所有增強功能
   */
  initialize() {
    this.keyboardManager.enable();
    this.stateManager.initialize();
    console.log('✓ 篩選 UX 管理器已初始化');
  }

  /**
   * 顯示通知
   */
  notify(message, type = 'info', duration = 2000) {
    if (!this.notificationEnabled) return;

    const notification = document.createElement('div');
    notification.className = `filter-notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#48bb78' : type === 'error' ? '#f56565' : '#667eea'};
      color: white;
      border-radius: 4px;
      font-size: 13px;
      z-index: 10000;
      animation: slideInRight 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  /**
   * 應用操作並記錄
   */
  recordAndApply(action, operation) {
    try {
      operation();
      this.history.record(action, this.editor.conditions, this.editor.logic);
      this.notify(`✓ ${action}`, 'success');
      return true;
    } catch (error) {
      console.error('❌ 操作失敗:', error);
      this.notify(`❌ ${action}失敗`, 'error');
      return false;
    }
  }

  /**
   * 執行撤銷
   */
  performUndo() {
    const record = this.history.undo();
    if (record) {
      this.editor.logic = record.logic;
      this.editor.conditions = JSON.parse(JSON.stringify(record.conditions));
      this.editor.render();
      this.notify('↶ 已撤銷', 'info');
      return true;
    }
    return false;
  }

  /**
   * 執行重做
   */
  performRedo() {
    const record = this.history.redo();
    if (record) {
      this.editor.logic = record.logic;
      this.editor.conditions = JSON.parse(JSON.stringify(record.conditions));
      this.editor.render();
      this.notify('↷ 已重做', 'info');
      return true;
    }
    return false;
  }

  /**
   * 獲取統計信息
   */
  getStats() {
    return {
      keyboard: this.keyboardManager.getShortcuts(),
      history: this.history.getStats(),
      state: {
        lastSaved: this.stateManager.lastSavedState?.timestamp
      }
    };
  }

  /**
   * 顯示幫助信息
   */
  showHelp() {
    const stats = this.getStats();
    let helpText = '🎛️ 篩選 UX 增強\n\n';

    helpText += '⌨️ 快捷鍵:\n';
    stats.keyboard.forEach(kb => {
      helpText += `  ${kb.key}: ${kb.description}\n`;
    });

    helpText += '\n💾 狀態管理:\n';
    helpText += '  • 自動保存篩選狀態\n';
    helpText += '  • 頁面刷新後自動恢復\n';

    helpText += '\n📝 歷史記錄:\n';
    helpText += `  • 最多保留 ${this.history.maxSize} 條記錄\n`;
    helpText += `  • 撤銷/重做支持\n`;

    console.log(helpText);
    alert(helpText);
  }

  /**
   * 導出狀態和歷史
   */
  exportData() {
    return {
      currentState: {
        logic: this.editor.logic,
        conditions: this.editor.conditions
      },
      history: this.history.exportAsJSON(),
      lastSavedState: this.stateManager.lastSavedState
    };
  }

  /**
   * 銷毀管理器
   */
  destroy() {
    this.keyboardManager.disable();
    this.stateManager.stopAutoSave();
    console.log('✓ 篩選 UX 管理器已銷毀');
  }
}

// 導出供全局使用
window.FilterKeyboardManager = FilterKeyboardManager;
window.FilterStateManager = FilterStateManager;
window.FilterHistory = FilterHistory;
window.FilterUXManager = FilterUXManager;
