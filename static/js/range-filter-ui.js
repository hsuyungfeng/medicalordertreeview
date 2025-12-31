/**
 * 範圍篩選 UI 增強 - Range Filter UI Enhancement
 * 支持日期選擇器、數值滑塊、快速預設範圍
 *
 * 功能:
 * - 互動式日期選擇器
 * - 數值滑塊支持
 * - 快速預設範圍 (本週、本月、本年)
 */

/**
 * 日期範圍選擇器
 * 提供互動式的日期選擇和快速預設
 */
class DateRangeSelector {
  constructor(containerId) {
    this.container = document.querySelector(containerId);
    this.startDate = null;
    this.endDate = null;
    this.callbacks = [];
  }

  /**
   * 初始化日期選擇器
   * @param {Object} options - 配置選項
   */
  initialize(options = {}) {
    const {
      startDate = new Date(new Date().getFullYear(), 0, 1),
      endDate = new Date(),
      showPresets = true
    } = options;

    this.startDate = startDate;
    this.endDate = endDate;

    this.render(showPresets);
  }

  /**
   * 渲染日期選擇器
   */
  render(showPresets = true) {
    if (!this.container) return;

    const today = new Date();
    const startStr = this.formatDate(this.startDate);
    const endStr = this.formatDate(this.endDate);

    let html = `
      <div class="date-range-selector">
        <div class="date-inputs">
          <div class="date-input-group">
            <label>開始日期:</label>
            <input type="date" class="date-start" value="${startStr}">
          </div>
          <div class="date-input-group">
            <label>結束日期:</label>
            <input type="date" class="date-end" value="${endStr}">
          </div>
        </div>
    `;

    if (showPresets) {
      html += `
        <div class="date-presets">
          <h4>快速範圍:</h4>
          <button class="preset-btn" data-preset="today">今天</button>
          <button class="preset-btn" data-preset="week">本週</button>
          <button class="preset-btn" data-preset="month">本月</button>
          <button class="preset-btn" data-preset="quarter">本季</button>
          <button class="preset-btn" data-preset="year">本年</button>
          <button class="preset-btn" data-preset="all-time">全時期</button>
        </div>
      `;
    }

    html += `
      </div>
    `;

    this.container.innerHTML = html;

    // 綁定事件
    this.bindEvents();
  }

  /**
   * 綁定事件監聽器
   */
  bindEvents() {
    const startInput = this.container?.querySelector('.date-start');
    const endInput = this.container?.querySelector('.date-end');

    if (startInput) {
      startInput.addEventListener('change', (e) => {
        this.startDate = new Date(e.target.value);
        this.triggerChange();
      });
    }

    if (endInput) {
      endInput.addEventListener('change', (e) => {
        this.endDate = new Date(e.target.value);
        this.triggerChange();
      });
    }

    // 綁定預設按鈕
    this.container?.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        this.applyPreset(preset);
      });
    });
  }

  /**
   * 應用快速預設範圍
   */
  applyPreset(preset) {
    const today = new Date();
    const start = new Date(today);
    const end = new Date(today);

    switch (preset) {
      case 'today':
        // 今天
        break;

      case 'week':
        // 本週 (從週一開始)
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);
        break;

      case 'month':
        // 本月
        start.setDate(1);
        break;

      case 'quarter':
        // 本季
        const quarter = Math.floor(today.getMonth() / 3);
        start.setMonth(quarter * 3);
        start.setDate(1);
        break;

      case 'year':
        // 本年
        start.setMonth(0);
        start.setDate(1);
        break;

      case 'all-time':
        // 全時期 (過去 10 年)
        start.setFullYear(today.getFullYear() - 10);
        break;

      default:
        return;
    }

    this.startDate = start;
    this.endDate = end;

    // 更新輸入框
    const startInput = this.container?.querySelector('.date-start');
    const endInput = this.container?.querySelector('.date-end');

    if (startInput) startInput.value = this.formatDate(start);
    if (endInput) endInput.value = this.formatDate(end);

    this.triggerChange();

    console.log(`📅 應用預設範圍: ${preset} (${this.formatDate(start)} - ${this.formatDate(end)})`);
  }

  /**
   * 格式化日期 (YYYY-MM-DD)
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * 註冊變更回調
   */
  onChange(callback) {
    this.callbacks.push(callback);
  }

  /**
   * 觸發變更事件
   */
  triggerChange() {
    this.callbacks.forEach(cb => {
      cb({
        startDate: this.startDate,
        endDate: this.endDate
      });
    });
  }

  /**
   * 獲取選定的日期範圍
   */
  getRange() {
    return {
      startDate: this.startDate,
      endDate: this.endDate
    };
  }
}

/**
 * 數值範圍滑塊
 * 支持互動式的數值範圍選擇
 */
class NumericRangeSlider {
  constructor(containerId) {
    this.container = document.querySelector(containerId);
    this.minValue = 0;
    this.maxValue = 100;
    this.currentMin = 0;
    this.currentMax = 100;
    this.callbacks = [];
  }

  /**
   * 初始化滑塊
   * @param {Object} options - 配置選項
   */
  initialize(options = {}) {
    const {
      min = 0,
      max = 1000,
      currentMin = min,
      currentMax = max,
      step = 1,
      showPresets = true,
      label = '數值範圍'
    } = options;

    this.minValue = min;
    this.maxValue = max;
    this.currentMin = currentMin;
    this.currentMax = currentMax;
    this.step = step;
    this.label = label;

    this.render(showPresets);
  }

  /**
   * 渲染滑塊
   */
  render(showPresets = true) {
    if (!this.container) return;

    const range = this.maxValue - this.minValue;
    const minPercent = ((this.currentMin - this.minValue) / range) * 100;
    const maxPercent = ((this.currentMax - this.minValue) / range) * 100;

    let html = `
      <div class="numeric-range-slider">
        <h4>${this.label}</h4>
        <div class="range-display">
          <span class="range-values">${this.currentMin} - ${this.currentMax}</span>
        </div>
        <div class="slider-container">
          <div class="slider-track"></div>
          <div class="slider-fill" style="left: ${minPercent}%; right: ${100 - maxPercent}%"></div>
          <input type="range" class="slider-min" min="${this.minValue}" max="${this.maxValue}"
                 value="${this.currentMin}" step="${this.step}">
          <input type="range" class="slider-max" min="${this.minValue}" max="${this.maxValue}"
                 value="${this.currentMax}" step="${this.step}">
        </div>
        <div class="slider-inputs">
          <input type="number" class="input-min" value="${this.currentMin}" min="${this.minValue}">
          <span>-</span>
          <input type="number" class="input-max" value="${this.currentMax}" max="${this.maxValue}">
        </div>
    `;

    if (showPresets) {
      const quarter = Math.round(range / 4);
      const halfway = Math.round(range / 2);

      html += `
        <div class="range-presets">
          <h4>快速預設:</h4>
          <button class="preset-btn" data-min="${this.minValue}" data-max="${this.minValue + quarter}">
            1/4
          </button>
          <button class="preset-btn" data-min="${this.minValue}" data-max="${this.minValue + halfway}">
            1/2
          </button>
          <button class="preset-btn" data-min="${Math.round(this.minValue + range / 4)}"
                  data-max="${Math.round(this.minValue + range * 3 / 4)}">
            中段
          </button>
          <button class="preset-btn" data-min="${this.minValue}" data-max="${this.maxValue}">
            全範圍
          </button>
        </div>
      `;
    }

    html += `
      </div>
    `;

    this.container.innerHTML = html;

    // 綁定事件
    this.bindEvents();
  }

  /**
   * 綁定事件監聽器
   */
  bindEvents() {
    const sliderMin = this.container?.querySelector('.slider-min');
    const sliderMax = this.container?.querySelector('.slider-max');
    const inputMin = this.container?.querySelector('.input-min');
    const inputMax = this.container?.querySelector('.input-max');

    if (sliderMin) {
      sliderMin.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val <= this.currentMax) {
          this.currentMin = val;
          this.updateDisplay();
          this.triggerChange();
        } else {
          sliderMin.value = this.currentMin;
        }
      });
    }

    if (sliderMax) {
      sliderMax.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        if (val >= this.currentMin) {
          this.currentMax = val;
          this.updateDisplay();
          this.triggerChange();
        } else {
          sliderMax.value = this.currentMax;
        }
      });
    }

    if (inputMin) {
      inputMin.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (val >= this.minValue && val <= this.currentMax) {
          this.currentMin = val;
          this.updateDisplay();
          this.triggerChange();
        } else {
          inputMin.value = this.currentMin;
        }
      });
    }

    if (inputMax) {
      inputMax.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        if (val <= this.maxValue && val >= this.currentMin) {
          this.currentMax = val;
          this.updateDisplay();
          this.triggerChange();
        } else {
          inputMax.value = this.currentMax;
        }
      });
    }

    // 綁定預設按鈕
    this.container?.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const min = parseInt(e.target.dataset.min);
        const max = parseInt(e.target.dataset.max);
        this.setRange(min, max);
      });
    });
  }

  /**
   * 更新顯示
   */
  updateDisplay() {
    const range = this.maxValue - this.minValue;
    const minPercent = ((this.currentMin - this.minValue) / range) * 100;
    const maxPercent = ((this.currentMax - this.minValue) / range) * 100;

    const fill = this.container?.querySelector('.slider-fill');
    if (fill) {
      fill.style.left = minPercent + '%';
      fill.style.right = (100 - maxPercent) + '%';
    }

    const display = this.container?.querySelector('.range-values');
    if (display) {
      display.textContent = `${this.currentMin} - ${this.currentMax}`;
    }

    const inputMin = this.container?.querySelector('.input-min');
    const inputMax = this.container?.querySelector('.input-max');
    const sliderMin = this.container?.querySelector('.slider-min');
    const sliderMax = this.container?.querySelector('.slider-max');

    if (inputMin) inputMin.value = this.currentMin;
    if (inputMax) inputMax.value = this.currentMax;
    if (sliderMin) sliderMin.value = this.currentMin;
    if (sliderMax) sliderMax.value = this.currentMax;
  }

  /**
   * 設置範圍
   */
  setRange(min, max) {
    if (min >= this.minValue && max <= this.maxValue && min <= max) {
      this.currentMin = min;
      this.currentMax = max;
      this.updateDisplay();
      this.triggerChange();
      console.log(`🎚️ 範圍已設置: ${min} - ${max}`);
    }
  }

  /**
   * 註冊變更回調
   */
  onChange(callback) {
    this.callbacks.push(callback);
  }

  /**
   * 觸發變更事件
   */
  triggerChange() {
    this.callbacks.forEach(cb => {
      cb({
        min: this.currentMin,
        max: this.currentMax
      });
    });
  }

  /**
   * 獲取選定的範圍
   */
  getRange() {
    return {
      min: this.currentMin,
      max: this.currentMax
    };
  }
}

/**
 * 範圍篩選面板管理器
 * 統一管理日期和數值範圍篩選
 */
class RangeFilterPanel {
  constructor() {
    this.dateSelector = null;
    this.sliders = new Map();
    this.onFilterChange = null;
  }

  /**
   * 創建日期範圍篩選面板
   * @param {String} containerId - 容器 ID
   * @param {Object} options - 配置
   */
  createDateRangePanel(containerId, options = {}) {
    const container = document.querySelector(containerId);
    if (!container) {
      console.warn(`⚠️ 容器未找到: ${containerId}`);
      return;
    }

    this.dateSelector = new DateRangeSelector(containerId);
    this.dateSelector.initialize(options);
    this.dateSelector.onChange((range) => {
      console.log(`📅 日期範圍變更: ${range.startDate.toLocaleDateString()} - ${range.endDate.toLocaleDateString()}`);
      this.onFilterChange?.('date', range);
    });
  }

  /**
   * 創建數值範圍滑塊面板
   * @param {String} containerId - 容器 ID
   * @param {String} field - 欄位名
   * @param {Object} options - 配置
   */
  createNumericRangePanel(containerId, field, options = {}) {
    const container = document.querySelector(containerId);
    if (!container) {
      console.warn(`⚠️ 容器未找到: ${containerId}`);
      return;
    }

    const slider = new NumericRangeSlider(containerId);
    slider.initialize({
      label: options.label || field,
      ...options
    });

    slider.onChange((range) => {
      console.log(`🎚️ 數值範圍變更: ${field} = ${range.min} - ${range.max}`);
      this.onFilterChange?.(field, range);
    });

    this.sliders.set(field, slider);
  }

  /**
   * 註冊篩選變更回調
   */
  onRangeFilterChange(callback) {
    this.onFilterChange = callback;
  }

  /**
   * 獲取所有篩選值
   */
  getAllRanges() {
    const ranges = {};

    if (this.dateSelector) {
      ranges.date = this.dateSelector.getRange();
    }

    this.sliders.forEach((slider, field) => {
      ranges[field] = slider.getRange();
    });

    return ranges;
  }

  /**
   * 重置所有篩選
   */
  resetAll() {
    if (this.dateSelector) {
      const today = new Date();
      this.dateSelector.applyPreset('year');
    }

    this.sliders.forEach(slider => {
      const range = slider.getRange();
      slider.setRange(range.min, range.max);
    });

    console.log('✓ 所有篩選已重置');
  }
}

// 導出供全局使用
window.DateRangeSelector = DateRangeSelector;
window.NumericRangeSlider = NumericRangeSlider;
window.RangeFilterPanel = RangeFilterPanel;
