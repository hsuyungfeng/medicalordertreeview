# Project Context

## Purpose
提供一個可瀏覽、搜尋與匯出「服務給付項目及支付標準樹狀圖」資料的工具與維運平台。目標是把政府/健保公布的給付項目整理成可視化樹狀結構，提供 API、CLI 與前端介面供查詢、比對與匯出（CSV/JSON）。此專案同時支援版本追蹤與變更提案流程（OpenSpec）。

## Tech Stack
- Backend: Python 3.10+, FastAPI（API）、SQLAlchemy（ORM）（可選，視部署需求）
- Data: PostgreSQL 或 SQLite（依部署環境）、Pandas（資料處理）
- Frontend: HTML5, CSS3, Vanilla JavaScript（無框架，嵌入式組件策略）
- 文件解析: Python docx-parser 或 JavaScript mammoth.js（依執行環境選擇）
- DevOps: Docker、GitHub Actions（CI）、pre-commit
- Testing: PyTest（後端）、Jest（前端 JavaScript 測試）、Cypress（E2E，可選）
- Spec & Workflow: OpenSpec（規格、變更提案與驗證）

## Project Conventions

### Code Style
- Python: Black、isort、flake8；使用 type hints（PEP 484）
- JavaScript: ESLint + Prettier；遵循 AirBnB/Recommended 規則為基礎，使用現代 ES6+ 語法
- HTML/CSS: 語意化標記、BEM 命名慣例（可選）、響應式設計
- Commit: 使用 conventional commits（feat/fix/chore/docs/refactor）並在 PR 描述中註明相關 `openspec` change-id
- PR: 每個功能以單一 change-id 對應一個 PR（若跨多個能力，請在 proposal.md 註明）

### Architecture Patterns
- 單一後端 API（FastAPI）提供資料與導出（CSV/JSON）端點（可選，視部署需求）
- 前端為模組化嵌入式組件，使用純 HTML/CSS/JavaScript，可獨立運作或嵌入其他系統
- 清晰分層：資料層（解析與轉換）→ 業務邏輯層 → 呈現層（UI 組件）
- 小而簡潔的 capability（spec 為單一責任），在 `openspec/specs/` 下維護

### Testing Strategy
- Unit tests：覆蓋核心資料處理與驗證邏輯（Python 使用 PyTest，JavaScript 使用 Jest）
- Integration tests：API endpoint 與 DB 的行為驗證（若使用後端）
- 前端組件測試：使用 Jest 測試 JavaScript 功能，配合 jsdom 模擬 DOM 環境
- End-to-end（選用）：使用 Cypress 驗證使用者流程（搜尋、匯出、文件解析）
- 所有新增變更需搭配相應的測試，並在 `tasks.md` 中列出測試項目

### Git Workflow
- main（保護分支）、develop（或直接以 feature branches PR → main）
- branch naming: `feat/<change-id>`、`fix/<issue-id>`（change-id 對應 openspec change）
- PR 範本要求：關聯的 `openspec` change-id、設計文件、測試計畫

## Domain Context
- 資料為醫療服務給付項目（含代碼、名稱、支付標準與階層關係）
- 資料應保持政府來源（如健保署）更新的對照；資料變更需能被稽核與回溯
- 多為中文內容，注意字元編碼與版本日期格式（YYYY-MM-DD）

## Important Constraints
- 若包含任何個資或病歷資料（PHI），需遵守相關法規（在本專案內原則上不儲存 PHI）
- 資料正確性、來源可溯性為首要考量
- 對檔案格式（CSV/JSON）與編碼（UTF-8）保持一致性

## External Dependencies
- 可能的資料來源：政府公開資料集（健保署／衛福部）、現有 CSV/Excel 檔案
- 可選視覺化函式庫：d3.js、react-viz 或 visx
- 監控/錯誤回報：Sentry（可選）
