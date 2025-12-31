/**
 * 文檔內容智能提取器
 * 自動識別關鍵段落（通則、說明等）並支持展開/收合
 */

class DocumentContentExtractor {
  constructor(options = {}) {
    this.maxPreviewLength = options.maxPreviewLength || 500;
    this.keywordPatterns = [
      /^通則[：:]/m,
      /^說明[：:]/m,
      /^注意事項[：:]/m,
      /^一、/m,
      /^二、/m,
      /^總則/m,
      /^原則/m
    ];
  }

  /**
   * 智能提取文檔核心內容
   * @param {string} fullContent - 完整文檔內容
   * @returns {Object} { preview, fullContent, hasMore }
   */
  extractCoreContent(fullContent) {
    if (!fullContent || fullContent.trim().length === 0) {
      return { preview: '', fullContent: '', hasMore: false };
    }

    // 策略 1: 查找關鍵段落（通則、說明等）
    const keySection = this.findKeySection(fullContent);
    if (keySection && keySection.length > 0) {
      const preview = this.truncateToLength(keySection, this.maxPreviewLength);
      return {
        preview: preview,
        fullContent: fullContent,
        hasMore: fullContent.length > preview.length
      };
    }

    // 策略 2: 提取前 N 個條目（一、二、三...）
    const firstItems = this.extractFirstItems(fullContent, 3);
    if (firstItems && firstItems.length > 0) {
      return {
        preview: firstItems,
        fullContent: fullContent,
        hasMore: fullContent.length > firstItems.length
      };
    }

    // 策略 3: 簡單截斷
    const preview = this.truncateToLength(fullContent, this.maxPreviewLength);
    return {
      preview: preview,
      fullContent: fullContent,
      hasMore: fullContent.length > this.maxPreviewLength
    };
  }

  /**
   * 查找關鍵段落（通則、說明等）
   */
  findKeySection(content) {
    for (const pattern of this.keywordPatterns) {
      const match = content.match(pattern);
      if (match) {
        const startIdx = match.index;
        // 提取從關鍵字到下一個主要標題或更長長度的內容
        const section = this.extractUntilNextSection(content, startIdx);
        if (section && section.length > 50) { // 至少 50 個字符
          return section;
        }
      }
    }
    return null;
  }

  /**
   * 從指定位置提取到下一個段落或達到字符限制
   */
  extractUntilNextSection(content, startIdx) {
    const remaining = content.substring(startIdx);

    // 查找下一個主要標題（例如：一、、第一項、等）
    // 但要跳過當前的標題
    const nextSectionMatch = remaining.substring(10).match(/\n([第一二三四五六七八九十０-９0-9]+[、\.。]|[（(][\w\d]+[）)])/);

    if (nextSectionMatch && nextSectionMatch.index > 50) {
      return remaining.substring(0, nextSectionMatch.index + 10);
    }

    // 如果沒找到，返回前 800 字符
    return remaining.substring(0, 800);
  }

  /**
   * 提取前 N 個條目（一、二、三...）
   */
  extractFirstItems(content, count = 3) {
    // 匹配中文數字 + 頓號的條目
    const itemPattern = /^([一二三四五六七八九十零]+[、．。]|[（(][\w\d]+[）)])/gm;
    const matches = [...content.matchAll(itemPattern)];

    if (matches.length >= 2) {
      // 找到第 N 個條目的位置
      const nthItemIndex = matches[Math.min(count, matches.length - 1)].index;
      return content.substring(0, nthItemIndex);
    }

    return null;
  }

  /**
   * 智能截斷到指定長度（避免截斷句子）
   */
  truncateToLength(text, maxLength) {
    if (!text || text.length <= maxLength) {
      return text;
    }

    // 在最大長度附近查找句子結尾
    const nearEnd = text.substring(0, maxLength);
    const sentenceEndings = [
      nearEnd.lastIndexOf('。'),
      nearEnd.lastIndexOf('；'),
      nearEnd.lastIndexOf('\n'),
      nearEnd.lastIndexOf('，')
    ];

    const bestCut = Math.max(...sentenceEndings);
    if (bestCut > maxLength * 0.7) {
      return text.substring(0, bestCut + 1);
    }

    return text.substring(0, maxLength);
  }

  /**
   * 生成帶有展開按鈕的 HTML
   */
  renderContent(extractedContent) {
    const { preview, fullContent, hasMore } = extractedContent;

    // 如果沒有更多內容，直接顯示全部
    if (!hasMore) {
      return `
        <div class="document-content">
          <div class="content-text">
            ${this.escapeHtml(fullContent).replace(/\n/g, '<br/>')}
          </div>
        </div>
      `;
    }

    // 有更多內容時，提供展開/收合按鈕
    return `
      <div class="document-content">
        <div class="content-text content-preview" data-state="collapsed">
          ${this.escapeHtml(preview).replace(/\n/g, '<br/>')}
        </div>
        <div class="content-text content-full" style="display: none;">
          ${this.escapeHtml(fullContent).replace(/\n/g, '<br/>')}
        </div>
        <button class="expand-content-btn" data-expanded="false">
          <span class="expand-icon">▼</span>
          <span class="expand-text">展開全文</span>
        </button>
      </div>
    `;
  }

  /**
   * HTML 特殊字符轉義，防止 XSS
   */
  escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
  }
}

// 全局導出
window.DocumentContentExtractor = DocumentContentExtractor;

console.log('✅ 文檔內容提取器已加載');
