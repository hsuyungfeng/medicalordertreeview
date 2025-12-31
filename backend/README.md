# 服務給付項目後端 API

互動式樹狀檢視系統的後端服務，提供搜尋、篩選與匯出功能。

## 功能

- ✅ RESTful API 端點
- ✅ 項目搜尋與篩選（按名稱、代號、層級、支付標準）
- ✅ 樹狀結構檢視與導航
- ✅ CSV/JSON 匯出（支援篩選）
- ✅ 分頁支援
- ✅ CORS 支援
- ✅ 完整的單元與 E2E 測試

## 技術棧

| 組件 | 版本 |
|-----|------|
| Python | 3.10+ |
| FastAPI | 0.104.0+ |
| Uvicorn | 0.24.0+ |
| Pandas | 2.0.0+ |
| Pytest | 7.4.0+ |
| Playwright | 1.40+（E2E 測試） |

## 快速開始

### 1. 使用 uv 同步環境

```bash
cd backend
uv sync --dev
```

### 2. 啟動開發伺服器

```bash
uv run uvicorn app:app --reload --host 0.0.0.0 --port 5000
```

API 將在 `http://localhost:5000` 啟動。

### 3. 訪問 API 文件

- **Swagger UI：** http://localhost:5000/docs
- **ReDoc：** http://localhost:5000/redoc

---

## 執行測試

### 後端單元測試

```bash
uv run pytest test_backend.py -v
```

**結果：** ✅ 17/17 測試通過

### E2E 整合測試（需 Playwright）

```bash
# 首次執行，安裝 Playwright 瀏覽器
uv run playwright install chromium

# 執行 E2E 測試
uv run pytest test_e2e.py -v
```

**結果：** ✅ 6/6 測試通過

### 所有測試

```bash
uv run pytest test_backend.py test_e2e.py -v
```

**結果：** ✅ 23/23 測試通過

---

## API 端點概覽

| 方法 | 端點 | 說明 |
|-----|------|------|
| GET | `/api/v1/health` | 健康檢查 |
| GET | `/api/v1/items` | 取得項目列表（支援搜尋、篩選、分頁） |
| GET | `/api/v1/items/{id}` | 取得單一項目詳情 |
| GET | `/api/v1/tree` | 取得樹狀結構 |
| GET | `/api/v1/export/csv` | 匯出 CSV |
| GET | `/api/v1/export/json` | 匯出 JSON |

### 查詢參數

取得項目列表和匯出時支援以下查詢參數：

| 參數 | 類型 | 說明 | 範例 |
|-----|------|------|------|
| `search` | string | 搜尋關鍵字（名稱或代號） | `?search=門診` |
| `level` | integer | 按層級篩選 | `?level=2` |
| `parent_id` | string | 按父節點 ID 篩選 | `?parent_id=1` |
| `page` | integer | 頁碼（預設：1） | `?page=2` |
| `per_page` | integer | 每頁筆數（預設：20，最多：100） | `?per_page=50` |
| `max_level` | integer | 樹狀結構最大層級（`/tree` 端點） | `?max_level=2` |

### 範例請求

```bash
# 搜尋"門診"
curl "http://localhost:5000/api/v1/items?search=門診"

# 取得層級 2 的項目
curl "http://localhost:5000/api/v1/items?level=2"

# 匯出層級 1 的 CSV
curl "http://localhost:5000/api/v1/export/csv?level=1" -o export.csv

# 取得樹狀結構（深度限制於 2）
curl "http://localhost:5000/api/v1/tree?max_level=2"
```

---

## 依賴管理

### 新增套件

```bash
# 新增生產依賴
uv add package-name

# 新增開發依賴
uv add --group dev package-name
```

### 更新鎖定檔

```bash
uv lock
```

### 查看依賴樹

```bash
uv pip list
```

---

## 項目結構

```
backend/
├── app.py                 # FastAPI 主應用
├── test_backend.py        # 後端單元測試（17 個測試）
├── test_e2e.py           # E2E 整合測試（6 個測試）
├── pyproject.toml        # Python 項目配置
├── uv.lock               # 依賴鎖定檔
└── README.md             # 本檔案
```

---

## 部署

### Docker 部署

```bash
docker build -t medicalorder-api .
docker run -p 5000:5000 medicalorder-api
```

---

## OpenSpec 變更關聯

此項目實現了 OpenSpec 變更提案：**`add-interactive-tree-view`**

- **提案路徑：** `openspec/changes/add-interactive-tree-view/`
- **規格文件：** `openspec/changes/add-interactive-tree-view/specs/ui/spec.md`
- **實裝狀態：** ✅ 完成（後端、前端、測試）

---

## 授權

專案內部使用

**最後更新：** 2025-12-18 | **版本：** 1.0.0
