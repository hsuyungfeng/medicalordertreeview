# 醫療服務給付項目及支付標準樹狀圖導航系統

## 📋 專案概述

本系統是一個針對台灣全民健康保險藥物給付項目及支付標準的互動式樹狀檢視平台。提供醫療從業人員、保險相關人員和政策制定者快速查詢、篩選和分析醫療服務給付項目的完整解決方案。

### 核心功能

- **樹狀結構導航**：9個部分（Part 0-9）的完整醫療給付項目架構
- **多層級檢視**：支援Part → Chapter → Section → Item的多層次查詢
- **動態表格渲染**：實時顯示每個項目的詳細表格數據
- **全文搜尋**：快速搜索診療項目代碼、名稱等信息
- **表格多視角**：支持多個表格頁簽切換
- **CSV數據源**：整合42,776個醫療服務給付項目

## 🛠 技術棧

### 前端技術
- **HTML5 + CSS3**：界面佈局與樣式
- **JavaScript (Vanilla)**：交互邏輯與DOM操作
- **組件化架構**：模塊化的前端設計
  - `tree-loader.js` - 樹狀結構加載與渲染
  - `doc-table-adapter.js` - 文檔表格適配層
  - `table-renderer.js` - 表格動態渲染引擎
  - `filter-engine.js` - 篩選和搜尋功能

### 後端技術
- **FastAPI** (Python 3.10+)：高性能RESTful API框架
- **Pandas**：數據處理與分析
- **python-docx**：Word文檔解析
- **Jieba**：中文分詞
- **Diskcache**：高速緩存層
- **Uvicorn**：ASGI應用伺服器

### 數據源
- **Word文檔 (.doc/.docx)**：醫療給付標準原始文檔
  - 0目錄1-114.09.01.doc
  - 1第一部總則-114.05.01.doc
  - 2系列：西醫診療標準（共10個文檔）
  - 3第三部牙醫-114.05.01.doc
  - 4第四部中醫-114.05.01.doc
  - 5第五部居家照護-113.09.01.doc
  - 6-9部：其他給付標準

- **JSON配置**：
  - `doc-table-mapping.json` - 文檔與表格映射配置
  - `tree-structure.json` - 樹狀結構定義

### 開發工具
- **uv** (Python包管理器)：依賴管理
- **Git**：版本控制
- **Python HTTP Server**：開發伺服器

## 📦 系統要求

### 硬體要求
- **CPU**：四核或以上
- **記憶體**：4GB以上
- **磁碟**：500MB可用空間（用於文檔與數據）
- **網路**：無特殊要求

### 軟體要求
- **Python**：3.10 或更高版本
- **Node.js**：可選（如需構建工具支持）
- **瀏覽器**：現代瀏覽器（Chrome、Firefox、Safari、Edge）
  - 需支援 ES6 JavaScript
  - 需啟用 JavaScript

## 📂 專案結構

```
服務給付項目及支付標準樹狀圖-114.09.01/
├── backend/                      # 後端服務
│   ├── app.py                   # FastAPI主應用
│   ├── models.py                # 數據模型
│   ├── parsers/                 # 文檔解析模塊
│   │   └── doc_parser.py        # Word文檔解析器
│   ├── indexer/                 # 索引與搜尋模塊
│   │   ├── builder.py           # 索引構建器
│   │   └── searcher.py          # 搜尋引擎
│   ├── cache/                   # 快速緩存目錄
│   ├── pyproject.toml           # Python依賴配置
│   └── uv.lock                  # 依賴鎖定文件
│
├── static/                       # 前端資源
│   ├── index.html               # 主頁面
│   ├── css/                     # 樣式表
│   ├── js/                      # JavaScript模塊
│   │   ├── tree-loader.js       # 樹狀加載器
│   │   ├── doc-table-adapter.js # 表格適配器
│   │   ├── table-renderer.js    # 表格渲染器
│   │   └── filter-engine.js     # 篩選引擎
│   └── data/                    # 數據文件
│       ├── doc-table-mapping.json      # 文檔表格映射
│       ├── tree-structure.json         # 樹狀結構
│       └── ...其他數據文件
│
├── doc/                          # 源文檔目錄
│   ├── *.doc/*.docx             # 醫療給付標準文檔
│   └── ...其他源文檔
│
├── openspec/                     # OpenSpec規範驅動開發
│   ├── AGENTS.md                # AI助手工作流指南
│   └── project.md               # 項目約定與標準
│
├── CLAUDE.md                    # Claude Code專案指令
├── README_TW.md                 # 本文件（繁體中文）
└── README.md                    # 英文說明（如有）
```

## 🚀 部署指南

### 1. 環境準備

#### 安裝Python (3.10+)
```bash
# 檢查Python版本
python3 --version

# 若版本低於3.10，請升級Python
# Ubuntu/Debian:
sudo apt-get update
sudo apt-get install python3.12

# macOS:
brew install python@3.12
```

#### 安裝uv包管理器
```bash
# 官方推薦安裝方法
curl -LsSf https://astral.sh/uv/install.sh | sh

# 驗證安裝
uv --version
```

### 2. 後端部署

#### 2.1 進入後端目錄
```bash
cd backend
```

#### 2.2 安裝依賴
```bash
# 使用uv安裝項目依賴
uv pip install -e .

# 或直接使用uv sync
uv sync
```

#### 2.3 啟動FastAPI伺服器
```bash
# 方式1：直接運行（生產環境需配置）
uv run python app.py

# 方式2：使用uvicorn（推薦）
uv run uvicorn app:app --host 0.0.0.0 --port 5000 --reload

# 方式3：後台運行
nohup uv run python app.py > server.log 2>&1 &
```

伺服器啟動後，你應該看到類似輸出：
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:__main__:應用啟動，初始化文檔索引...
INFO:__main__:開始解析文檔...
```

### 3. 前端部署

#### 3.1 啟動靜態伺服器
```bash
# 方式1：Python HTTP Server（開發用）
cd static
python3 -m http.server 8000

# 方式2：使用Node.js http-server
npx http-server static -p 8000

# 方式3：nginx配置（生產用）
# 配置nginx的server块指向static目錄
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/static;
    index index.html;

    location /api {
        proxy_pass http://localhost:5000;
    }
}
```

#### 3.2 驗證部署
訪問以下URL驗證系統運行：
- **前端UI**：http://localhost:8000/index.html
- **API健康檢查**：http://localhost:5000/api/v1/health
- **API文檔**：http://localhost:5000/docs

### 4. 生產環境部署

#### 4.1 Docker部署（可選）
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/ ./backend/
WORKDIR ./backend

RUN pip install -e .

EXPOSE 5000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "5000"]
```

#### 4.2 Systemd服務配置（Linux）
```ini
# /etc/systemd/system/medical-order.service
[Unit]
Description=Medical Service Payment Standards API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/medical-order/backend
ExecStart=/usr/local/bin/uv run python app.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

啟動服務：
```bash
sudo systemctl start medical-order
sudo systemctl enable medical-order
```

## 🎯 快速開始

### 本地開發

#### 步驟1：克隆或進入項目
```bash
cd /path/to/服務給付項目及支付標準樹狀圖-114.09.01
```

#### 步驟2：啟動後端
```bash
cd backend
uv run python app.py
# 伺服器運行在 http://localhost:5000
```

#### 步驟3：啟動前端（新終端）
```bash
cd static
python3 -m http.server 8000
# 前端運行在 http://localhost:8000
```

#### 步驟4：打開瀏覽器
訪問 **http://localhost:8000/index.html**

### 首次使用

1. **瀏覽樹狀結構**
   - 左側導航顯示9個部分的完整醫療給付項目
   - 點擊▶展開部分或章節
   - 點擊項目查看詳細信息

2. **搜尋功能**
   - 在上方搜尋框輸入代碼、名稱或關鍵詞
   - 點擊"搜尋"或按Enter查詢
   - 點擊"清空"重置搜尋

3. **查看表格數據**
   - 右側面板顯示選中項目的表格
   - 使用表格頁簽 (1/12, 2/12...) 切換多個表格
   - 可在表格中查看支付標準、代碼等詳細信息

## 📡 API 使用說明

### 核心API端點

#### 1. 健康檢查
```bash
GET /api/v1/health

# 響應
{
  "status": "healthy",
  "timestamp": "2025-12-31T08:30:00Z"
}
```

#### 2. 索引狀態
```bash
GET /api/v1/index/status

# 響應
{
  "total_documents": 26,
  "indexed_documents": 26,
  "total_terms": 50000,
  "last_update": "2025-12-31T08:00:00Z"
}
```

#### 3. 搜尋（全文）
```bash
POST /api/v1/search
Content-Type: application/json

{
  "query": "針灸",
  "limit": 50
}

# 響應
{
  "results": [
    {
      "doc_id": "4第四部中醫-114.05.01",
      "section": "第五章 針灸治療處置費",
      "relevance": 0.95,
      "snippet": "..."
    }
  ],
  "total": 145
}
```

#### 4. 獲取文檔內容
```bash
GET /api/v1/documents/4第四部中醫-114.05.01

# 響應 (JSON)
{
  "id": "4第四部中醫-114.05.01",
  "title": "第四部中醫",
  "sections": [...],
  "metadata": {...}
}
```

更多API詳情請訪問：**http://localhost:5000/docs** (Swagger UI)

## 🔧 故障排除

### 常見問題

#### Q1：後端啟動失敗 - "ModuleNotFoundError: No module named 'fastapi'"
**解決方案：**
```bash
cd backend
uv pip install -e .
# 或
uv sync
```

#### Q2：前端無法連接後端 API
**檢查清單：**
- ✓ 後端伺服器是否運行在 http://localhost:5000
- ✓ 檢查瀏覽器控制台是否有CORS錯誤
- ✓ 確認防火牆允許5000端口訪問

**CORS配置已在FastAPI中啟用，應允許跨域請求。**

#### Q3：表格數據無法顯示
**檢查步驟：**
```bash
# 檢查映射文件是否存在
ls -la static/data/doc-table-mapping.json

# 檢查後端日誌中的表格加載信息
# 查看瀏覽器開發者工具 > 控制台 > 網路標籤
```

#### Q4：搜尋功能不工作
**解決方案：**
```bash
# 重啟後端以重建索引
# 確保doc目錄中有.doc/.docx文件
ls doc/

# 檢查索引構建日誌
curl http://localhost:5000/api/v1/index/status
```

#### Q5：記憶體使用過高
**優化方案：**
- 清除快速緩存：`rm -rf backend/cache/*`
- 限制搜尋結果：調整API的`limit`參數
- 優化表格渲染：在table-renderer.js中增加虛擬化

### 調試模式

#### 啟用詳細日誌
```bash
# 編輯 backend/app.py，修改日誌級別
logging.basicConfig(level=logging.DEBUG)

# 或設置環境變數
export LOG_LEVEL=DEBUG
```

#### 檢查性能
```bash
# 監控後端進程
ps aux | grep python

# 檢查內存使用
top -p $(pgrep -f "python.*app.py")

# 查看端口佔用
lsof -i :5000
```

## 📊 系統部分說明

### Part 0：目錄索引
- 全民健康保險醫療服務給付項目及支付標準總覽

### Part 1：總則
- 適用對象、給付範圍、醫療院所及人員資格等原則性規定

### Part 2：西醫（西醫診療）
- **子章節共10個**：基本診療、檢查、注射、復健、精神醫療等
- **含88+個詳細項目**

### Part 3：牙醫（牙科診療）
- **子章節4個**：掛號費、基本診療、根管、牙科手術
- **配置完整且運行正常**

### Part 4：中醫（中醫診療）
- **子章節8個**：門診、藥費、針灸、傷科治療等
- **含特定疾病代碼表**
- **配置完整且運行正常**

### Part 5：居家照護
- **子章節3個**：基本計價與護理、檢查與診療、特殊醫療項目
- **配置完整且運行正常**

### Part 6-9：其他給付
- 論病例計酬、Tw-DRGs支付制度、品質支付服務、護理人員診療項目

## 📝 使用許可

本系統基於中華民國衛生福利部全民健康保險藥物給付項目及支付標準開發。

資料來源：**台灣全民健康保險開放資料** (健保署)
更新頻率：定期與官方資料同步

## 🤝 貢獻與反饋

### 報告問題
請提供以下信息：
1. 系統版本與環境信息
2. 複現步驟
3. 錯誤信息或截圖
4. 預期行為 vs 實際行為

### 性能優化建議
- 表格虛擬化：對大型表格實施延遲渲染
- 索引優化：使用倒排索引加速全文搜尋
- 快速緩存：增加第二級緩存層

## 📚 相關資源

- **健保署開放資料**：https://www.nhi.gov.tw
- **FastAPI文檔**：https://fastapi.tianguo.com
- **uv包管理器**：https://docs.astral.sh/uv/
- **OpenSpec規範驅動開發**：見 `openspec/AGENTS.md`

## 📋 版本歷史

- **v3.0** (2025-12-31)：完整實現Parts 3/4/5，生產就緒
- **v2.0** (2025-12-30)：多部分支持與優化
- **v1.0** (2025-12-15)：初始版本，Parts 2完整實現

---

**最後更新**：2025年12月31日
**維護者**：Medical Order Navigation Team
**聯繫方式**：見項目GitHub倉庫
