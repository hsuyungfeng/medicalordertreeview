"""
後端 API 服務 - 服務給付項目樹狀檢視
提供搜尋、篩選、匯出、全文搜索等功能
"""

from fastapi import FastAPI, HTTPException, Query, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
from typing import List, Optional, Dict, Any
import json
import io
import logging
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
import asyncio

# 導入新模組
from parsers.doc_parser import DocParser
from indexer.builder import IndexBuilder
from indexer.searcher import SearchEngine
from models import DocumentContent, IndexStatus

# 設定日誌
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="服務給付項目 API",
    description="提供服務給付項目樹狀檢視的搜尋、篩選與匯出功能",
    version="1.0.0"
)

# CORS 設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生產環境應限制來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 初始化文檔解析和搜索引擎
BACKEND_DIR = Path(__file__).parent
CACHE_DIR = BACKEND_DIR / "cache"
DOC_DIR = BACKEND_DIR.parent / "doc"
INDEX_DIR = CACHE_DIR / "index"

parser = DocParser(CACHE_DIR)
index_builder = IndexBuilder(INDEX_DIR)
search_engine = None
documents_cache: Dict[str, DocumentContent] = {}
is_indexing = False
index_status = {
    "total_documents": 0,
    "indexed_documents": 0,
    "total_terms": 0,
    "last_update": None
}

# 模擬資料庫
# 實際專案中應從資料庫或檔案載入
SAMPLE_DATA = [
    {
        "id": "1",
        "code": "01001",
        "name": "門診診察費",
        "level": 1,
        "parent_id": None,
        "payment_standard": "300",
        "description": "一般門診診察"
    },
    {
        "id": "2",
        "code": "01002",
        "name": "急診診察費",
        "level": 1,
        "parent_id": None,
        "payment_standard": "500",
        "description": "急診診察"
    },
    {
        "id": "3",
        "code": "02001",
        "name": "一般血液檢查",
        "level": 2,
        "parent_id": "1",
        "payment_standard": "150",
        "description": "常規血液檢查"
    },
    {
        "id": "4",
        "code": "02002",
        "name": "生化檢查",
        "level": 2,
        "parent_id": "1",
        "payment_standard": "200",
        "description": "生化項目檢查"
    },
    {
        "id": "5",
        "code": "03001",
        "name": "一般X光攝影",
        "level": 3,
        "parent_id": "3",
        "payment_standard": "300",
        "description": "胸部X光攝影"
    }
]

def build_tree(items: List[Dict]) -> List[Dict]:
    """將扁平列表轉換為樹狀結構"""
    tree = []
    item_dict = {item["id"]: {**item, "children": []} for item in items}

    for item in items:
        if item["parent_id"] is None:
            tree.append(item_dict[item["id"]])
        else:
            parent = item_dict.get(item["parent_id"])
            if parent:
                parent["children"].append(item_dict[item["id"]])

    return tree


def parse_and_index_documents():
    """解析所有文檔並構建索引"""
    global search_engine, documents_cache, is_indexing, index_status

    if is_indexing:
        logger.warning("索引構建已在進行中")
        return False

    is_indexing = True
    try:
        logger.info("開始解析文檔...")

        # 掃描文檔目錄
        if not DOC_DIR.exists():
            logger.error(f"文檔目錄不存在: {DOC_DIR}")
            return False

        doc_files = sorted([f for f in DOC_DIR.glob("*") if f.suffix in [".doc", ".docx", ".xlsx", ".csv"]])
        logger.info(f"找到 {len(doc_files)} 個文檔")

        # 並行解析文檔
        documents = []
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(parser.parse_file, f): f for f in doc_files}
            completed = 0

            for future in as_completed(futures):
                completed += 1
                doc_path = futures[future]
                try:
                    doc = future.result()
                    if doc:
                        documents.append(doc)
                        documents_cache[doc.doc_id] = doc
                        logger.info(f"已解析 {completed}/{len(doc_files)}: {doc_path.name}")
                    else:
                        logger.warning(f"解析失敗: {doc_path.name}")
                except Exception as e:
                    logger.error(f"解析 {doc_path.name} 時出錯: {e}")

        if not documents:
            logger.error("沒有成功解析任何文檔")
            return False

        logger.info(f"成功解析 {len(documents)} 個文檔，開始構建索引...")

        # 構建索引
        if not index_builder.build_index(documents):
            logger.error("構建索引失敗")
            return False

        # 初始化搜索引擎
        search_engine = SearchEngine(INDEX_DIR, documents_cache)

        # 更新索引狀態
        index_status["total_documents"] = len(documents)
        index_status["indexed_documents"] = len(documents)
        index_status["total_terms"] = len(index_builder.index)
        index_status["last_update"] = pd.Timestamp.now().isoformat()

        logger.info(f"索引構建完成！文檔數: {len(documents)}, 詞數: {len(index_builder.index)}")
        return True

    except Exception as e:
        logger.error(f"解析和索引文檔失敗: {e}", exc_info=True)
        return False
    finally:
        is_indexing = False


@app.on_event("startup")
async def startup_event():
    """應用啟動事件"""
    logger.info("應用啟動，初始化文檔索引...")
    parse_and_index_documents()

@app.get("/")
async def root():
    """根端點"""
    return {"message": "服務給付項目 API 服務", "version": "1.0.0"}

@app.get("/api/v1/health")
async def health_check():
    """健康檢查"""
    return {"status": "healthy", "timestamp": pd.Timestamp.now().isoformat()}

@app.get("/api/v1/items")
async def get_items(
    search: Optional[str] = Query(None, description="搜尋關鍵字"),
    level: Optional[int] = Query(None, description="層級篩選"),
    parent_id: Optional[str] = Query(None, description="父節點ID"),
    page: int = Query(1, ge=1, description="頁碼"),
    per_page: int = Query(20, ge=1, le=100, description="每頁筆數")
):
    """取得項目列表（支援搜尋、篩選、分頁）"""
    filtered_items = SAMPLE_DATA.copy()
    
    # 搜尋篩選
    if search:
        search_lower = search.lower()
        filtered_items = [
            item for item in filtered_items
            if search_lower in item["name"].lower() or search_lower in item["code"].lower()
        ]
    
    # 層級篩選
    if level is not None:
        filtered_items = [item for item in filtered_items if item["level"] == level]
    
    # 父節點篩選
    if parent_id is not None:
        filtered_items = [item for item in filtered_items if item["parent_id"] == parent_id]
    
    # 分頁
    total = len(filtered_items)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    paginated_items = filtered_items[start_idx:end_idx]
    
    return {
        "data": paginated_items,
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "total_pages": (total + per_page - 1) // per_page
        }
    }

@app.get("/api/v1/items/{item_id}")
async def get_item(item_id: str):
    """取得單一項目詳情"""
    for item in SAMPLE_DATA:
        if item["id"] == item_id:
            return {"data": item}
    raise HTTPException(status_code=404, detail="項目不存在")

@app.get("/api/v1/tree")
async def get_tree(max_level: Optional[int] = Query(None, description="最大層級")):
    """取得樹狀結構"""
    items = SAMPLE_DATA.copy()
    
    if max_level is not None:
        items = [item for item in items if item["level"] <= max_level]
    
    tree = build_tree(items)
    return {"data": {"tree": tree}}

@app.get("/api/v1/export/csv")
async def export_csv(
    search: Optional[str] = Query(None, description="搜尋關鍵字"),
    level: Optional[int] = Query(None, description="層級篩選")
):
    """匯出 CSV"""
    filtered_items = SAMPLE_DATA.copy()
    
    if search:
        search_lower = search.lower()
        filtered_items = [
            item for item in filtered_items
            if search_lower in item["name"].lower() or search_lower in item["code"].lower()
        ]
    
    if level is not None:
        filtered_items = [item for item in filtered_items if item["level"] == level]
    
    # 轉換為 DataFrame
    df = pd.DataFrame(filtered_items)
    
    # 建立 CSV 內容
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False, encoding='utf-8-sig')
    csv_buffer.seek(0)
    
    return StreamingResponse(
        csv_buffer,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=export.csv"}
    )

@app.get("/api/v1/export/json")
async def export_json(
    search: Optional[str] = Query(None, description="搜尋關鍵字"),
    level: Optional[int] = Query(None, description="層級篩選")
):
    """匯出 JSON"""
    filtered_items = SAMPLE_DATA.copy()
    
    if search:
        search_lower = search.lower()
        filtered_items = [
            item for item in filtered_items
            if search_lower in item["name"].lower() or search_lower in item["code"].lower()
        ]
    
    if level is not None:
        filtered_items = [item for item in filtered_items if item["level"] == level]
    
    return JSONResponse(
        content={"data": filtered_items},
        headers={"Content-Disposition": "attachment; filename=export.json"}
    )

@app.get("/api/v1/documents")
async def get_documents():
    """取得文檔列表（/doc 目錄下的文件）"""
    import os
    from pathlib import Path

    doc_path = Path(__file__).parent.parent / "doc"

    if not doc_path.exists():
        return {"data": [], "error": "文檔目錄不存在"}

    documents = []
    for file in sorted(doc_path.glob("*")):
        if file.is_file() and file.suffix in ['.doc', '.docx', '.xlsx', '.csv']:
            # 從緩存獲取額外信息
            file_id = file.stem
            doc_info = {
                "name": file_id,
                "filename": file.name,
                "size": file.stat().st_size,
                "ext": file.suffix,
                "path": f"/doc/{file.name}",
                "has_content": file_id in documents_cache
            }

            # 添加解析後的元數據
            if file_id in documents_cache:
                cached_doc = documents_cache[file_id]
                doc_info.update({
                    "word_count": cached_doc.metadata.get("word_count", 0),
                    "section_count": cached_doc.metadata.get("section_count", 0),
                    "last_parsed": cached_doc.parsed_at.isoformat()
                })

            documents.append(doc_info)

    return {
        "data": documents,
        "total": len(documents)
    }


@app.get("/api/v1/search")
async def search(
    q: str = Query(..., description="搜尋關鍵字"),
    limit: int = Query(20, ge=1, le=100, description="結果數量上限")
):
    """全文搜索"""
    if not search_engine:
        raise HTTPException(status_code=503, detail="搜索引擎尚未初始化")

    try:
        results, total = search_engine.search(q, limit=limit)
        return {
            "query": q,
            "total": total,
            "results": [r.dict() for r in results]
        }
    except Exception as e:
        logger.error(f"搜索失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/suggest")
async def suggest(
    q: str = Query(..., min_length=1, description="搜尋前綴"),
    limit: int = Query(10, ge=1, le=20, description="建議數量")
):
    """獲取搜索建議"""
    if not search_engine:
        raise HTTPException(status_code=503, detail="搜索引擎尚未初始化")

    try:
        suggestions = search_engine.suggest(q, limit=limit)
        return {
            "suggestions": [s.dict() for s in suggestions]
        }
    except Exception as e:
        logger.error(f"生成建議失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/documents/{doc_id}/content")
async def get_document_content(doc_id: str):
    """獲取文檔內容"""
    if doc_id not in documents_cache:
        raise HTTPException(status_code=404, detail="文檔不存在")

    try:
        doc = documents_cache[doc_id]
        return {
            "doc_id": doc.doc_id,
            "title": doc.title,
            "filename": doc.filename,
            "sections": [
                {
                    "id": s.id,
                    "heading": s.heading,
                    "level": s.level,
                    "content": s.content,
                    "tables": [{"headers": t.headers, "rows": t.rows} for t in s.tables],
                    "position": s.position
                }
                for s in doc.sections
            ],
            "metadata": doc.metadata,
            "parsed_at": doc.parsed_at.isoformat()
        }
    except Exception as e:
        logger.error(f"獲取文檔內容失敗: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/index/status")
async def get_index_status():
    """獲取索引狀態"""
    return index_status


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
