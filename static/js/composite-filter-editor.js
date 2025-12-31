/**
 * 複合篩選編輯器 - Composite Filter Editor
 * 提供互動式 UI 用於創建和編輯複合篩選條件
 * 支持保存/加載篩選模板和預設
 */

/**
 * 複合篩選編輯器
 * 用於創建和管理複合篩選條件
 */
class CompositeFilterEditor {
  constructor(containerId, columns = []) {
    this.container = document.querySelector(containerId);
    this.columns = columns;  // 可用的列配置
    this.conditions = [];     // 編輯中的條件
    this.logic = 'AND';       // 邏輯模式
    this.callbacks = [];      // 變更回調
    this.operators = {
      'eq': '等於',
      'contains': '包含',
      'gt': '大於',
      'gte': '大於等於',
      'lt': '小於',
      'lte': '小於等於',
      'between': '範圍',
      'in': '在列表中',
      'date-between': '日期範圍'
    };
  }

  /**
   * 初始化編輯器
   * @param {Object} options - 配置選項
   */
  initialize(options = {}) {
    const { columns = [], logic = 'AND' } = options;

    if (columns.length > 0) {
      this.columns = columns;
    }
    if (logic) {
      this.logic = logic;
    }

    this.render();
    console.log('✓ 複合篩選編輯器已初始化');
  }

  /**
   * 渲染編輯器 UI
   */
  render() {
    if (!this.container) return;

    const logicLabels = { 'AND': '全部符合 (AND)', 'OR': '任一符合 (OR)' };

    let html = `
      <div class="composite-filter-editor">
        <div class="editor-header">
          <h3>複合篩選編輯器</h3>
          <div class="editor-controls">
            <div class="logic-selector">
              <label>邏輯模式:</label>
              <select class="logic-mode">
                <option value="AND" ${this.logic === 'AND' ? 'selected' : ''}>全部符合 (AND)</option>
                <option value="OR" ${this.logic === 'OR' ? 'selected' : ''}>任一符合 (OR)</option>
              </select>
            </div>
            <button class="btn-add-condition" title="添加新條件">+ 添加條件</button>
          </div>
        </div>

        <div class="conditions-container">
    `;

    // 渲染現有條件
    if (this.conditions.length === 0) {
      html += `
        <div class="empty-conditions">
          <p>尚無篩選條件 - 點擊「添加條件」開始</p>
        </div>
      `;
    } else {
      this.conditions.forEach((condition, index) => {
        html += this.renderCondition(condition, index);
      });
    }

    html += `
        </div>

        <div class="editor-actions">
          <button class="btn-apply">✓ 應用篩選</button>
          <button class="btn-clear">✕ 清空所有</button>
          <button class="btn-save-template">💾 保存為模板</button>
        </div>

        <div class="filter-summary">
          <p id="summary-text">無篩選條件</p>
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
    this.updateSummary();
  }

  /**
   * 渲染單個條件
   * @param {Object} condition - 條件對象
   * @param {Number} index - 條件索引
   * @returns {String} HTML 字符串
   */
  renderCondition(condition, index) {
    const { field, operator, value } = condition;
    const fieldConfig = this.columns.find(c => c.field === field);
    const fieldType = fieldConfig?.type || 'string';

    let valueInput = '';
    switch (fieldType) {
      case 'number':
        if (operator === 'between') {
          const [min, max] = Array.isArray(value) ? value : [value, value];
          valueInput = `
            <input type="number" class="value-input" data-type="between-min" value="${min}" placeholder="最小值">
            <span class="value-separator">~</span>
            <input type="number" class="value-input" data-type="between-max" value="${max}" placeholder="最大值">
          `;
        } else {
          valueInput = `<input type="number" class="value-input" value="${value || ''}" placeholder="輸入數值">`;
        }
        break;

      case 'date':
        if (operator === 'date-between') {
          const [start, end] = Array.isArray(value) ? value : ['', ''];
          valueInput = `
            <input type="date" class="value-input" data-type="date-start" value="${start}">
            <span class="value-separator">~</span>
            <input type="date" class="value-input" data-type="date-end" value="${end}">
          `;
        } else {
          valueInput = `<input type="date" class="value-input" value="${value || ''}">`;
        }
        break;

      case 'select':
      case 'categorical':
        const options = fieldConfig?.options || [];
        if (operator === 'in') {
          valueInput = `<select class="value-input value-multiselect" multiple>
            ${options.map(opt => `
              <option value="${opt}" ${Array.isArray(value) && value.includes(opt) ? 'selected' : ''}>
                ${opt}
              </option>
            `).join('')}
          </select>`;
        } else {
          valueInput = `<select class="value-input">
            <option value="">-- 選擇值 --</option>
            ${options.map(opt => `
              <option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>
            `).join('')}
          </select>`;
        }
        break;

      default:
        valueInput = `<input type="text" class="value-input" value="${value || ''}" placeholder="輸入值">`;
    }

    return `
      <div class="condition-item" data-index="${index}">
        <div class="condition-controls">
          ${index > 0 ? `<span class="logic-operator">${this.logic}</span>` : ''}
          <select class="field-select">
            ${this.columns.map(col => `
              <option value="${col.field}" ${field === col.field ? 'selected' : ''}>
                ${col.label || col.field}
              </option>
            `).join('')}
          </select>
          <select class="operator-select">
            ${Object.entries(this.operators).map(([op, label]) => `
              <option value="${op}" ${operator === op ? 'selected' : ''}>${label}</option>
            `).join('')}
          </select>
          <div class="value-inputs">
            ${valueInput}
          </div>
          <button class="btn-remove-condition" title="移除條件">✕</button>
        </div>
      </div>
    `;
  }

  /**
   * 綁定事件
   */
  bindEvents() {
    // 邏輯模式改變
    const logicSelect = this.container?.querySelector('.logic-mode');
    if (logicSelect) {
      logicSelect.addEventListener('change', (e) => {
        this.logic = e.target.value;
        this.render();
      });
    }

    // 添加條件
    const addBtn = this.container?.querySelector('.btn-add-condition');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addCondition());
    }

    // 應用篩選
    const applyBtn = this.container?.querySelector('.btn-apply');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => this.triggerApply());
    }

    // 清空所有
    const clearBtn = this.container?.querySelector('.btn-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.conditions = [];
        this.render();
      });
    }

    // 保存為模板
    const saveBtn = this.container?.querySelector('.btn-save-template');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveAsTemplate());
    }

    // 條件字段選擇
    this.container?.querySelectorAll('.field-select').forEach((select, index) => {
      select.addEventListener('change', (e) => {
        const newField = e.target.value;
        if (this.conditions[index]) {
          this.conditions[index].field = newField;
          this.render();
        }
      });
    });

    // 運算符選擇
    this.container?.querySelectorAll('.operator-select').forEach((select, index) => {
      select.addEventListener('change', (e) => {
        const newOperator = e.target.value;
        if (this.conditions[index]) {
          this.conditions[index].operator = newOperator;
          this.render();
        }
      });
    });

    // 值輸入
    this.container?.querySelectorAll('.value-input').forEach((input) => {
      input.addEventListener('change', (e) => {
        const conditionItem = input.closest('.condition-item');
        const index = parseInt(conditionItem?.dataset.index);

        if (this.conditions[index]) {
          const type = input.dataset.type;
          if (type === 'between-min') {
            this.conditions[index].value[0] = parseFloat(input.value);
          } else if (type === 'between-max') {
            this.conditions[index].value[1] = parseFloat(input.value);
          } else if (type === 'date-start') {
            this.conditions[index].value[0] = input.value;
          } else if (type === 'date-end') {
            this.conditions[index].value[1] = input.value;
          } else if (input.classList.contains('value-multiselect')) {
            const selected = Array.from(input.selectedOptions).map(opt => opt.value);
            this.conditions[index].value = selected;
          } else {
            this.conditions[index].value = input.value;
          }
          this.updateSummary();
        }
      });
    });

    // 移除條件
    this.container?.querySelectorAll('.btn-remove-condition').forEach((btn, index) => {
      btn.addEventListener('click', () => {
        this.removeCondition(index);
      });
    });
  }

  /**
   * 添加新條件
   */
  addCondition() {
    const defaultField = this.columns[0]?.field || 'field';
    this.conditions.push({
      field: defaultField,
      operator: 'eq',
      value: ''
    });
    this.render();
    console.log('✓ 添加新條件');
  }

  /**
   * 移除條件
   * @param {Number} index - 條件索引
   */
  removeCondition(index) {
    if (index >= 0 && index < this.conditions.length) {
      this.conditions.splice(index, 1);
      this.render();
      console.log(`✓ 移除條件 [${index}]`);
    }
  }

  /**
   * 更新摘要
   */
  updateSummary() {
    const summaryEl = this.container?.querySelector('#summary-text');
    if (!summaryEl) return;

    if (this.conditions.length === 0) {
      summaryEl.textContent = '無篩選條件';
      return;
    }

    const descriptions = this.conditions.map(c => {
      const fieldConfig = this.columns.find(col => col.field === c.field);
      const fieldLabel = fieldConfig?.label || c.field;
      const operatorLabel = this.operators[c.operator] || c.operator;

      let valueStr = c.value;
      if (Array.isArray(c.value)) {
        valueStr = c.value.join(', ');
      } else if (typeof c.value === 'object') {
        valueStr = JSON.stringify(c.value);
      }

      return `${fieldLabel} ${operatorLabel} ${valueStr}`;
    });

    const summary = descriptions.join(` ${this.logic} `);
    summaryEl.textContent = summary;
  }

  /**
   * 觸發應用事件
   */
  triggerApply() {
    const filter = this.toCompositeFilter();
    console.log('✓ 應用複合篩選', filter);

    this.callbacks.forEach(cb => {
      cb({
        filter,
        conditions: this.conditions,
        logic: this.logic
      });
    });
  }

  /**
   * 轉換為 CompositeFilter 對象
   * @returns {CompositeFilter}
   */
  toCompositeFilter() {
    const filter = new CompositeFilter(this.logic);

    this.conditions.forEach(condition => {
      if (condition.value !== '' && condition.value !== null) {
        const fc = new FilterCondition(condition.field, condition.operator, condition.value);
        filter.addCondition(fc);
      }
    });

    return filter;
  }

  /**
   * 從 CompositeFilter 加載
   * @param {CompositeFilter} filter - 複合篩選
   */
  fromCompositeFilter(filter) {
    if (!filter) return;

    this.logic = filter.logic;
    this.conditions = filter.conditions.map(c => ({
      field: c.field,
      operator: c.operator,
      value: c.value
    }));

    this.render();
    console.log('✓ 從 CompositeFilter 加載');
  }

  /**
   * 保存為模板
   */
  saveAsTemplate() {
    const name = prompt('輸入模板名稱:');
    if (!name) return;

    const template = {
      name,
      logic: this.logic,
      conditions: JSON.parse(JSON.stringify(this.conditions)),
      timestamp: new Date().toISOString()
    };

    // 保存到 localStorage
    const templates = JSON.parse(localStorage.getItem('compositeFilterTemplates') || '[]');
    templates.push(template);
    localStorage.setItem('compositeFilterTemplates', JSON.stringify(templates));

    console.log(`✓ 模板已保存: ${name}`);
    alert(`模板已保存: ${name}`);
  }

  /**
   * 加載模板
   * @param {String} name - 模板名稱
   */
  loadTemplate(name) {
    const templates = JSON.parse(localStorage.getItem('compositeFilterTemplates') || '[]');
    const template = templates.find(t => t.name === name);

    if (template) {
      this.logic = template.logic;
      this.conditions = JSON.parse(JSON.stringify(template.conditions));
      this.render();
      console.log(`✓ 模板已加載: ${name}`);
      return true;
    }

    console.warn(`⚠️ 模板不存在: ${name}`);
    return false;
  }

  /**
   * 獲取所有保存的模板
   * @returns {Array} 模板列表
   */
  getSavedTemplates() {
    return JSON.parse(localStorage.getItem('compositeFilterTemplates') || '[]');
  }

  /**
   * 刪除模板
   * @param {String} name - 模板名稱
   */
  deleteTemplate(name) {
    let templates = JSON.parse(localStorage.getItem('compositeFilterTemplates') || '[]');
    templates = templates.filter(t => t.name !== name);
    localStorage.setItem('compositeFilterTemplates', JSON.stringify(templates));
    console.log(`✓ 模板已刪除: ${name}`);
  }

  /**
   * 註冊變更回調
   */
  onChange(callback) {
    this.callbacks.push(callback);
  }

  /**
   * 獲取當前編輯的條件
   * @returns {Array}
   */
  getConditions() {
    return JSON.parse(JSON.stringify(this.conditions));
  }

  /**
   * 設置條件
   * @param {Array} conditions - 條件列表
   */
  setConditions(conditions) {
    this.conditions = JSON.parse(JSON.stringify(conditions));
    this.render();
  }
}

/**
 * 篩選模板管理器
 * 管理保存的篩選模板
 */
class FilterTemplateManager {
  constructor(containerId) {
    this.container = document.querySelector(containerId);
    this.templates = [];
    this.callbacks = [];
    this.loadTemplates();
  }

  /**
   * 初始化
   */
  initialize() {
    this.render();
    console.log('✓ 篩選模板管理器已初始化');
  }

  /**
   * 加載模板
   */
  loadTemplates() {
    this.templates = JSON.parse(localStorage.getItem('compositeFilterTemplates') || '[]');
  }

  /**
   * 渲染模板管理 UI
   */
  render() {
    if (!this.container) return;

    this.loadTemplates();

    let html = `
      <div class="template-manager">
        <h3>篩選模板</h3>
        <div class="templates-list">
    `;

    if (this.templates.length === 0) {
      html += '<p class="empty-templates">尚無保存的模板</p>';
    } else {
      this.templates.forEach((template, index) => {
        const created = new Date(template.timestamp).toLocaleDateString();
        html += `
          <div class="template-item">
            <div class="template-info">
              <h4>${template.name}</h4>
              <p class="template-meta">
                建立: ${created} | 條件: ${template.conditions.length} 個
              </p>
              <p class="template-description">
                ${template.logic === 'AND' ? '全部符合' : '任一符合'}:
                ${template.conditions.map(c => `${c.field} ${c.operator}`).join(', ')}
              </p>
            </div>
            <div class="template-actions">
              <button class="btn-load" data-index="${index}">載入</button>
              <button class="btn-delete" data-index="${index}">刪除</button>
            </div>
          </div>
        `;
      });
    }

    html += `
        </div>
      </div>
    `;

    this.container.innerHTML = html;
    this.bindEvents();
  }

  /**
   * 綁定事件
   */
  bindEvents() {
    this.container?.querySelectorAll('.btn-load').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        const template = this.templates[index];
        this.callbacks.forEach(cb => cb({ action: 'load', template }));
        console.log(`✓ 模板已加載: ${template.name}`);
      });
    });

    this.container?.querySelectorAll('.btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (confirm(`確定要刪除 "${this.templates[index].name}"?`)) {
          const template = this.templates[index];
          this.templates.splice(index, 1);
          localStorage.setItem('compositeFilterTemplates', JSON.stringify(this.templates));
          this.render();
          console.log(`✓ 模板已刪除: ${template.name}`);
        }
      });
    });
  }

  /**
   * 註冊回調
   */
  onAction(callback) {
    this.callbacks.push(callback);
  }
}

// 導出供全局使用
window.CompositeFilterEditor = CompositeFilterEditor;
window.FilterTemplateManager = FilterTemplateManager;
