/**
 * 集成測試套件 - Integration Test Suite
 * 完整的系統功能、性能、壓力測試
 */

/**
 * 測試框架
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      duration: 0,
      details: []
    };
    this.beforeHooks = [];
    this.afterHooks = [];
  }

  /**
   * 註冊測試用例
   */
  test(name, fn, options = {}) {
    this.tests.push({
      name,
      fn,
      skip: options.skip || false,
      timeout: options.timeout || 5000,
      category: options.category || 'general'
    });
  }

  /**
   * 添加 Before Hook
   */
  before(fn) {
    this.beforeHooks.push(fn);
  }

  /**
   * 添加 After Hook
   */
  after(fn) {
    this.afterHooks.push(fn);
  }

  /**
   * 執行所有測試
   */
  async run() {
    const startTime = performance.now();
    console.log(`🧪 開始執行測試套件 (${this.tests.length} 個測試)\n`);

    for (const test of this.tests) {
      if (test.skip) {
        this.results.skipped++;
        this.results.details.push({
          name: test.name,
          status: 'SKIP',
          duration: 0
        });
        console.log(`⊘ SKIP: ${test.name}`);
        continue;
      }

      try {
        // 執行 before hooks
        for (const hook of this.beforeHooks) {
          await hook();
        }

        // 執行測試
        const testStart = performance.now();
        await Promise.race([
          test.fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Test timeout')), test.timeout)
          )
        ]);
        const testDuration = performance.now() - testStart;

        this.results.passed++;
        this.results.details.push({
          name: test.name,
          status: 'PASS',
          duration: testDuration
        });
        console.log(`✓ PASS: ${test.name} (${testDuration.toFixed(2)}ms)`);

        // 執行 after hooks
        for (const hook of this.afterHooks) {
          await hook();
        }
      } catch (error) {
        this.results.failed++;
        this.results.details.push({
          name: test.name,
          status: 'FAIL',
          error: error.message,
          duration: 0
        });
        console.error(`✗ FAIL: ${test.name}`);
        console.error(`  錯誤: ${error.message}`);
      }
    }

    this.results.total = this.tests.length;
    this.results.duration = performance.now() - startTime;

    this.printSummary();
    return this.results;
  }

  /**
   * 打印測試摘要
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 測試結果摘要');
    console.log('='.repeat(50));
    console.log(`總計: ${this.results.total} 個測試`);
    console.log(`✓ 通過: ${this.results.passed}`);
    console.log(`✗ 失敗: ${this.results.failed}`);
    console.log(`⊘ 跳過: ${this.results.skipped}`);
    console.log(`⏱️  總耗時: ${(this.results.duration / 1000).toFixed(2)}s`);
    console.log(`成功率: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    console.log('='.repeat(50) + '\n');
  }

  /**
   * 獲取結果
   */
  getResults() {
    return this.results;
  }

  /**
   * 導出為 JSON
   */
  exportJSON() {
    return JSON.stringify(this.results, null, 2);
  }

  /**
   * 導出為 HTML 報告
   */
  exportHTML() {
    let html = `
      <html>
        <head>
          <title>測試報告</title>
          <style>
            body { font-family: Arial; padding: 20px; }
            h1 { color: #333; }
            .summary { background: #f0f0f0; padding: 15px; border-radius: 5px; }
            .pass { color: green; }
            .fail { color: red; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #667eea; color: white; }
          </style>
        </head>
        <body>
          <h1>🧪 測試報告</h1>
          <div class="summary">
            <p>總計: <strong>${this.results.total}</strong> 個測試</p>
            <p class="pass">✓ 通過: <strong>${this.results.passed}</strong></p>
            <p class="fail">✗ 失敗: <strong>${this.results.failed}</strong></p>
            <p>⊘ 跳過: <strong>${this.results.skipped}</strong></p>
            <p>⏱️  總耗時: <strong>${(this.results.duration / 1000).toFixed(2)}s</strong></p>
          </div>
          <table>
            <tr>
              <th>測試名稱</th>
              <th>狀態</th>
              <th>耗時 (ms)</th>
              <th>錯誤信息</th>
            </tr>
    `;

    for (const detail of this.results.details) {
      const statusClass = detail.status === 'PASS' ? 'pass' : detail.status === 'FAIL' ? 'fail' : '';
      html += `
        <tr>
          <td>${detail.name}</td>
          <td class="${statusClass}"><strong>${detail.status}</strong></td>
          <td>${detail.duration.toFixed(2)}</td>
          <td>${detail.error || '-'}</td>
        </tr>
      `;
    }

    html += `
          </table>
        </body>
      </html>
    `;
    return html;
  }
}

/**
 * 斷言函數
 */
class Assert {
  static equal(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Assertion failed'}: ${actual} !== ${expected}`);
    }
  }

  static deepEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`${message || 'Assertion failed'}: Objects not equal`);
    }
  }

  static ok(value, message) {
    if (!value) {
      throw new Error(message || 'Assertion failed: value is falsy');
    }
  }

  static throws(fn, message) {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (e) {
      if (e.message === (message || 'Expected function to throw')) {
        throw e;
      }
    }
  }

  static async rejects(fn, message) {
    try {
      await fn();
      throw new Error(message || 'Expected promise to reject');
    } catch (e) {
      if (e.message === (message || 'Expected promise to reject')) {
        throw e;
      }
    }
  }
}

/**
 * 性能測試工具
 */
class PerformanceBenchmark {
  constructor(name) {
    this.name = name;
    this.measurements = [];
  }

  /**
   * 測量同步函數
   */
  measure(fn, iterations = 1000) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      fn();
      const end = performance.now();
      times.push(end - start);
    }

    return this.analyze(times);
  }

  /**
   * 測量非同步函數
   */
  async measureAsync(fn, iterations = 100) {
    const times = [];
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    return this.analyze(times);
  }

  /**
   * 分析性能數據
   */
  analyze(times) {
    const sorted = times.sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    const avg = sum / times.length;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    const result = {
      name: this.name,
      min,
      max,
      avg,
      median,
      p95,
      p99,
      samples: times.length
    };

    this.measurements.push(result);
    return result;
  }

  /**
   * 打印結果
   */
  printResults() {
    for (const result of this.measurements) {
      console.log(`\n📊 性能測試: ${result.name}`);
      console.log(`  樣本數: ${result.samples}`);
      console.log(`  最小值: ${result.min.toFixed(3)}ms`);
      console.log(`  最大值: ${result.max.toFixed(3)}ms`);
      console.log(`  平均值: ${result.avg.toFixed(3)}ms`);
      console.log(`  中位數: ${result.median.toFixed(3)}ms`);
      console.log(`  P95: ${result.p95.toFixed(3)}ms`);
      console.log(`  P99: ${result.p99.toFixed(3)}ms`);
    }
  }

  /**
   * 導出結果
   */
  exportResults() {
    return this.measurements;
  }
}

/**
 * 內存使用監測
 */
class MemoryMonitor {
  static getMemoryInfo() {
    if (performance.memory) {
      return {
        usedMemory: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
        totalMemory: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
        limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
      };
    }
    return null;
  }

  static trackMemory(fn, name = '操作') {
    if (!performance.memory) {
      console.warn('⚠️ 此瀏覽器不支持內存監測');
      return null;
    }

    const before = performance.memory.usedJSHeapSize;
    fn();
    const after = performance.memory.usedJSHeapSize;
    const delta = (after - before) / 1024 / 1024;

    console.log(`💾 ${name} 內存變化: ${delta > 0 ? '+' : ''}${delta.toFixed(2)} MB`);

    return {
      name,
      before: (before / 1048576).toFixed(2) + ' MB',
      after: (after / 1048576).toFixed(2) + ' MB',
      delta: delta.toFixed(2) + ' MB'
    };
  }
}

/**
 * 數據生成工具
 */
class DataGenerator {
  static generateMedicalData(count) {
    const categories = ['檢查', '治療', '手術', '藥物', '檢驗'];
    const statuses = ['有效', '停用', '待審', '修訂中'];
    const names = [
      '血液檢查', '心電圖', '超音波檢查', '注射治療', '拔牙',
      '根管治療', '洗牙', '補牙', '配藥', '掛號'
    ];

    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        category: categories[Math.floor(Math.random() * categories.length)],
        name: names[Math.floor(Math.random() * names.length)],
        points: Math.floor(Math.random() * 1000) + 100,
        date: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        coverage: Math.floor(Math.random() * 100) + 50
      });
    }
    return data;
  }

  static generateLargeDataset(count) {
    const data = [];
    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        value: Math.random() * 10000,
        text: `Item ${i}`,
        timestamp: Date.now() + i
      });
    }
    return data;
  }
}

// 導出供全局使用
window.TestRunner = TestRunner;
window.Assert = Assert;
window.PerformanceBenchmark = PerformanceBenchmark;
window.MemoryMonitor = MemoryMonitor;
window.DataGenerator = DataGenerator;
