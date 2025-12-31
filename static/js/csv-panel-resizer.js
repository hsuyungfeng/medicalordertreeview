/**
 * CSV 面板分割線調整器
 * 支持拖動分割線調整表格和說明文字的比例
 */

class CSVPanelResizer {
  constructor() {
    this.divider = document.querySelector('.csv-split-divider');
    this.tableSection = document.querySelector('.csv-table-section');
    this.descSection = document.querySelector('.csv-description-section');
    this.container = document.querySelector('.csv-split-container');

    if (!this.divider || !this.tableSection || !this.descSection) {
      console.warn('❌ CSV 面板分割器未找到必要元素');
      return;
    }

    this.isDragging = false;
    this.startY = 0;
    this.startHeight = 0;

    this.bindEvents();
    console.log('✅ CSV 面板分割線調整器已初始化');
  }

  bindEvents() {
    // 鼠標按下
    this.divider.addEventListener('mousedown', (e) => this.onMouseDown(e));

    // 鼠標移動
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));

    // 鼠標抬起
    document.addEventListener('mouseup', () => this.onMouseUp());

    // 觸控支持
    this.divider.addEventListener('touchstart', (e) => this.onTouchStart(e));
    document.addEventListener('touchmove', (e) => this.onTouchMove(e));
    document.addEventListener('touchend', () => this.onTouchEnd());
  }

  onMouseDown(e) {
    this.isDragging = true;
    this.startY = e.clientY;
    this.startHeight = this.tableSection.offsetHeight;
    this.divider.classList.add('dragging');
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  onMouseMove(e) {
    if (!this.isDragging) return;

    const delta = e.clientY - this.startY;
    const containerHeight = this.container.offsetHeight;
    const minHeight = 150; // 最小高度

    // 計算新的表格高度
    const newTableHeight = Math.max(
      minHeight,
      Math.min(
        this.startHeight + delta,
        containerHeight - minHeight  // 保證下部至少 150px
      )
    );

    // 設置百分比
    const percent = (newTableHeight / containerHeight * 100).toFixed(1);
    this.tableSection.style.flex = `0 0 ${percent}%`;

    // 存儲用戶偏好
    this.savePanelRatio(percent);
  }

  onMouseUp() {
    this.isDragging = false;
    this.divider.classList.remove('dragging');
    document.body.style.userSelect = '';
  }

  // 觸控支持
  onTouchStart(e) {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.startY = e.touches[0].clientY;
      this.startHeight = this.tableSection.offsetHeight;
      this.divider.classList.add('dragging');
      document.body.style.userSelect = 'none';
    }
  }

  onTouchMove(e) {
    if (!this.isDragging || e.touches.length !== 1) return;

    const delta = e.touches[0].clientY - this.startY;
    const containerHeight = this.container.offsetHeight;
    const minHeight = 150;

    const newTableHeight = Math.max(
      minHeight,
      Math.min(
        this.startHeight + delta,
        containerHeight - minHeight
      )
    );

    const percent = (newTableHeight / containerHeight * 100).toFixed(1);
    this.tableSection.style.flex = `0 0 ${percent}%`;

    this.savePanelRatio(percent);
  }

  onTouchEnd() {
    this.isDragging = false;
    this.divider.classList.remove('dragging');
    document.body.style.userSelect = '';
  }

  /**
   * 保存面板比例到本地存儲
   */
  savePanelRatio(percent) {
    try {
      localStorage.setItem('csvPanelTableRatio', percent);
    } catch (e) {
      // 本地存儲不可用，靜默失敗
    }
  }

  /**
   * 恢復保存的面板比例
   */
  restorePanelRatio() {
    try {
      const saved = localStorage.getItem('csvPanelTableRatio');
      if (saved) {
        this.tableSection.style.flex = `0 0 ${saved}%`;
        console.log(`✅ 已恢復面板比例: ${saved}%`);
      }
    } catch (e) {
      // 本地存儲不可用，使用默認值
    }
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const resizer = new CSVPanelResizer();
  resizer.restorePanelRatio();
  window.csvPanelResizer = resizer;
});
