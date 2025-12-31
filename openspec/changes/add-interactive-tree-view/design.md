## Context
新增互動式樹狀檢視，需支援大量節點的渲染效能、搜尋與匯出。變更會影響前後端，需要協調 API 規格與 UI 行為。

## Goals
- 快速載入並可搜尋數千筆節點
- 提供節點層級展開/收合、節點詳情與匯出功能

## Decisions
- 使用 React + 虛擬化 (e.g., react-window 或 react-virtualized) 以處理大量資料呈現
- Backend 提供 paginated search 與一個 export endpoint（支持 filter query）
- 前端儘量在 client-side 做交互，export 由 server 產生以確保格式與編碼一致

## Risks / Trade-offs
- 若資料量極大，需考慮 server-side 搜尋與分頁（較複雜但可控）
- 視覺化套件會增加前端依賴

## Migration Plan
1. 提供 API mock 與前端 prototype
2. 完成後端搜尋/匯出 API 與測試
3. 串接前端並加入 E2E 測試
