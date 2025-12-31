"""
資料模型定義
提供類型安全的數據結構用於文檔解析、索引構建和搜索
"""

from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class TableData(BaseModel):
    """表格數據結構"""
    headers: List[str]
    rows: List[List[str]]


class Section(BaseModel):
    """文檔章節結構"""
    id: str                          # 唯一標識符（如 sec_0, sec_1）
    heading: str                     # 章節標題
    level: int                       # 層級 (1-6，對應 HTML h1-h6)
    content: str                     # 純文本內容
    tables: List[TableData] = []     # 表格數據
    position: int                    # 在文檔中的字符位置


class DocumentContent(BaseModel):
    """解析後的完整文檔內容"""
    doc_id: str                      # 文檔 ID（如 "2-2-1"）
    title: str                       # 文檔標題
    filename: str                    # 原始文件名
    sections: List[Section]          # 章節列表
    metadata: Dict[str, Any]         # 元數據（頁數、字數等）
    parsed_at: datetime              # 解析時間
    file_hash: str                   # 文件 SHA256 哈希值


class SearchMatch(BaseModel):
    """搜索結果中的單個匹配"""
    section_id: str                  # 所在章節 ID
    section_title: str               # 所在章節標題
    snippet: str                     # 上下文片段（包含 <mark> 標籤）
    position: int                    # 在文檔中的位置
    score: float                     # 該匹配的相關性評分


class SearchResult(BaseModel):
    """單個文檔的搜索結果"""
    doc_id: str                      # 文檔 ID
    doc_title: str                   # 文檔標題
    total_score: float               # 文檔的總相關性評分
    matches: List[SearchMatch]       # 該文檔中的所有匹配項


class SuggestionItem(BaseModel):
    """搜索建議項"""
    text: str                        # 建議文本
    frequency: int                   # 在索引中出現的頻率
    doc_id: Optional[str] = None     # 首次出現的文檔 ID


class IndexStatus(BaseModel):
    """索引狀態信息"""
    total_documents: int             # 總文檔數
    indexed_documents: int           # 已索引文檔數
    total_terms: int                 # 索引中的總詞數
    last_update: datetime            # 最後更新時間
    index_size_mb: float             # 索引文件大小（MB）


class IndexMetadata(BaseModel):
    """索引元數據"""
    total_documents: int
    total_terms: int
    last_update: str
    format_version: str = "1.0"


# 倒排索引結構（不通過 Pydantic，用於高效存儲）
# {
#   "term": "血液檢查",
#   "documents": [
#     {
#       "doc_id": "2-2-1",
#       "frequency": 45,
#       "positions": [234, 567, ...],
#       "sections": ["2.2.1.1", "2.2.1.3"]
#     }
#   ],
#   "total_frequency": 156
# }
