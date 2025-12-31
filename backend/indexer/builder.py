"""
索引構建器 - 構建倒排索引用於全文搜索
"""

import json
import logging
from pathlib import Path
from typing import Dict, List, Set, Tuple
from datetime import datetime
from collections import defaultdict
import jieba

from models import DocumentContent, IndexMetadata

logger = logging.getLogger(__name__)

# 異體字映射表
VARIANT_MAP = {
    "腫廇": "腫瘤",
    "檢驗": "檢查",
    # 可以添加更多映射
}

# 停用詞集合
STOP_WORDS = {
    "的", "一", "是", "在", "了", "和", "人", "這", "中", "大",
    "為", "上", "個", "國", "我", "以", "要", "他", "時", "來",
    "用", "們", "生", "到", "作", "地", "于", "出", "就", "分",
    "對", "成", "會", "可", "主", "發", "年", "動", "同", "工",
    "也", "能", "下", "過", "子", "說", "產", "樣", "配", "知",
    "三", "之", "長", "其", "又", "多", "然", "前", "並", "完",
    "由", "與", "及", "各", "既", "無", "當", "根", "如", "或",
}


class IndexBuilder:
    """倒排索引構建器"""

    def __init__(self, index_dir: Path):
        """
        初始化構建器

        Args:
            index_dir: 索引存儲目錄
        """
        self.index_dir = Path(index_dir)
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.index: Dict = {}
        self.doc_index: Dict = {}  # 文檔 ID 到內容的映射
        self.term_frequencies: Dict = defaultdict(int)  # 詞頻統計

    def build_index(self, documents: List[DocumentContent]) -> bool:
        """
        構建倒排索引

        Args:
            documents: 已解析的文檔列表

        Returns:
            成功返回 True，失敗返回 False
        """
        logger.info(f"開始構建索引，文檔數: {len(documents)}")

        try:
            # 清空現有索引
            self.index.clear()
            self.doc_index.clear()
            self.term_frequencies.clear()

            # 處理每個文檔
            for doc in documents:
                if not doc:
                    continue

                # 存儲文檔元數據
                self.doc_index[doc.doc_id] = {
                    "title": doc.title,
                    "filename": doc.filename,
                    "word_count": doc.metadata.get("word_count", 0),
                    "section_count": doc.metadata.get("section_count", 0),
                    "parsed_at": doc.parsed_at.isoformat()
                }

                # 處理文檔的所有章節
                for section in doc.sections:
                    self._index_section(doc.doc_id, section)

            # 保存索引到磁盤
            self._save_index()

            logger.info(f"索引構建完成，總詞數: {len(self.index)}")
            return True

        except Exception as e:
            logger.error(f"構建索引失敗: {e}", exc_info=True)
            return False

    def _index_section(self, doc_id: str, section) -> None:
        """
        索引文檔的單個章節

        Args:
            doc_id: 文檔 ID
            section: 章節對象
        """
        # 索引標題
        if section.heading:
            self._index_text(
                section.heading,
                doc_id,
                section.id,
                section.position,
                is_title=True
            )

        # 索引內容
        if section.content:
            self._index_text(
                section.content,
                doc_id,
                section.id,
                section.position,
                is_title=False
            )

        # 索引表格內容
        for table in section.tables:
            for header in table.headers:
                self._index_text(header, doc_id, section.id, section.position, is_title=False)
            for row in table.rows:
                for cell in row:
                    self._index_text(cell, doc_id, section.id, section.position, is_title=False)

    def _index_text(
        self,
        text: str,
        doc_id: str,
        section_id: str,
        position: int,
        is_title: bool = False
    ) -> None:
        """
        索引文本內容

        Args:
            text: 文本內容
            doc_id: 文檔 ID
            section_id: 章節 ID
            position: 在文檔中的位置
            is_title: 是否為標題
        """
        # 標準化文本
        text = self._normalize_text(text)

        # 分詞
        words = jieba.cut(text)

        # 處理每個詞
        char_pos = position
        for word in words:
            if not word or len(word) < 2 or word in STOP_WORDS:
                char_pos += len(word)
                continue

            # 確保索引條目存在
            if word not in self.index:
                self.index[word] = {}

            if doc_id not in self.index[word]:
                self.index[word][doc_id] = {
                    "frequency": 0,
                    "positions": [],
                    "sections": set(),
                    "title_frequency": 0
                }

            # 更新頻率和位置
            entry = self.index[word][doc_id]
            entry["frequency"] += 1
            entry["positions"].append(char_pos)
            entry["sections"].add(section_id)

            if is_title:
                entry["title_frequency"] += 1

            self.term_frequencies[word] += 1
            char_pos += len(word)

    def _normalize_text(self, text: str) -> str:
        """
        標準化文本（處理異體字等）

        Args:
            text: 原始文本

        Returns:
            標準化後的文本
        """
        # 處理異體字
        for variant, standard in VARIANT_MAP.items():
            text = text.replace(variant, standard)

        return text.lower()

    def _save_index(self) -> None:
        """將索引保存到磁盤"""
        try:
            # 轉換 set 為 list 以便 JSON 序列化
            serializable_index = {}
            for term, docs in self.index.items():
                serializable_index[term] = {}
                for doc_id, entry in docs.items():
                    serializable_index[term][doc_id] = {
                        "frequency": entry["frequency"],
                        "positions": entry["positions"],
                        "sections": list(entry["sections"]),
                        "title_frequency": entry["title_frequency"]
                    }

            # 保存索引
            index_path = self.index_dir / "terms_index.json"
            with open(index_path, "w", encoding="utf-8") as f:
                json.dump(serializable_index, f, ensure_ascii=False, indent=2)

            # 保存文檔索引
            doc_index_path = self.index_dir / "documents_index.json"
            with open(doc_index_path, "w", encoding="utf-8") as f:
                json.dump(self.doc_index, f, ensure_ascii=False, indent=2)

            # 保存元數據
            metadata = IndexMetadata(
                total_documents=len(self.doc_index),
                total_terms=len(self.index),
                last_update=datetime.now().isoformat()
            )
            metadata_path = self.index_dir / "metadata.json"
            with open(metadata_path, "w", encoding="utf-8") as f:
                json.dump(metadata.dict(), f, ensure_ascii=False, indent=2)

            logger.info(f"索引已保存到 {self.index_dir}")

        except Exception as e:
            logger.error(f"保存索引失敗: {e}", exc_info=True)

    def load_index(self) -> bool:
        """
        從磁盤加載索引

        Returns:
            成功返回 True，失敗返回 False
        """
        try:
            index_path = self.index_dir / "terms_index.json"
            if not index_path.exists():
                logger.warning(f"索引文件不存在: {index_path}")
                return False

            with open(index_path, "r", encoding="utf-8") as f:
                self.index = json.load(f)

            doc_index_path = self.index_dir / "documents_index.json"
            if doc_index_path.exists():
                with open(doc_index_path, "r", encoding="utf-8") as f:
                    self.doc_index = json.load(f)

            logger.info(f"索引已加載，詞數: {len(self.index)}")
            return True

        except Exception as e:
            logger.error(f"加載索引失敗: {e}", exc_info=True)
            return False

    def get_all_terms(self) -> List[str]:
        """獲取所有索引的詞"""
        return list(self.index.keys())

    def get_term_frequency(self, term: str) -> int:
        """獲取詞的總頻率"""
        return self.term_frequencies.get(term, 0)

    def get_doc_titles(self) -> Dict[str, str]:
        """獲取所有文檔 ID 到標題的映射"""
        return {doc_id: info["title"] for doc_id, info in self.doc_index.items()}
