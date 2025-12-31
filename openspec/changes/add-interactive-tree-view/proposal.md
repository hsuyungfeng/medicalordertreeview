# Change: Add interactive tree view

## Why
目前專案主要以資料檔與後端 API 為主，缺乏能直觀探索與快速匯出的前端介面。新增一個互動式樹狀檢視可以讓使用者更快速地查找給付項目、比對支付標準並匯出所需資料。

## What Changes
- **ADDED** 一個前端互動式樹狀檢視（搜尋、過濾、節點詳情、CSV/JSON 匯出）
- **ADDED** 後端 API：支援節點搜尋、篩選與匯出端點
- **ADDED** 對應的測試（單元、整合、E2E）
- **BREAKING?**: 無（此為新增功能）

## Impact
- Affected specs: `ui` capability (新增交互檢視)
- Affected code: 前端 (React)；後端 (API endpoints for search & export)
- Deployment: 需要在 CI 中加入前端構建與 E2E 工作流程
