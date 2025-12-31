"""
搜索引擎 - 全文搜索、模糊匹配、評分排序
"""

import json
import logging
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from collections import defaultdict
import jieba
from rapidfuzz import fuzz

from models import SearchMatch, SearchResult, SuggestionItem, DocumentContent

logger = logging.getLogger(__name__)

# 異體字映射
VARIANT_MAP = {
    "腫廇": "腫瘤",
    "檢驗": "檢查",
}

# 停用詞
STOP_WORDS = {
    "的", "一", "是", "在", "了", "和", "人", "這", "中", "大",
    "為", "上", "個", "國", "我", "以", "要", "他", "時", "來",
    "用", "們", "生", "到", "作", "地", "于", "出", "就", "分",
    "對", "成", "會", "可", "主", "發", "年", "動", "同", "工",
    "也", "能", "下", "過", "子", "說", "產", "樣", "配", "知",
    "三", "之", "長", "其", "又", "多", "然", "前", "並", "完",
    "由", "與", "及", "各", "既", "無", "當", "根", "如", "或",
}

# 評分常數
SCORE_TITLE_EXACT = 200      # 標題完全匹配
SCORE_CONTENT_EXACT = 150    # 內容完全匹配
SCORE_TITLE_PARTIAL = 120    # 標題部分匹配
SCORE_CONTENT_PARTIAL = 80   # 內容部分匹配
SCORE_FUZZY = 60            # 模糊匹配
SCORE_MULTI_TERM_BONUS = 500 # 多詞匹配加權


class SearchEngine:
    """搜索引擎"""

    def __init__(self, index_dir: Path, documents_cache: Optional[Dict[str, DocumentContent]] = None):
        """
        初始化搜索引擎

        Args:
            index_dir: 索引目錄路徑
            documents_cache: 文檔內容緩存（用於提取上下文片段）
        """
        self.index_dir = Path(index_dir)
        self.index: Dict = {}
        self.doc_titles: Dict = {}
        self.documents_cache = documents_cache or {}
        self.load_index()

    def load_index(self) -> bool:
        """加載索引"""
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
                    doc_data = json.load(f)
                    self.doc_titles = {doc_id: info["title"] for doc_id, info in doc_data.items()}

            logger.info(f"搜索引擎已初始化，詞數: {len(self.index)}")
            return True

        except Exception as e:
            logger.error(f"加載索引失敗: {e}", exc_info=True)
            return False

    def set_documents_cache(self, documents: List[DocumentContent]) -> None:
        """
        設置文檔緩存（用於提取上下文）

        Args:
            documents: 文檔列表
        """
        self.documents_cache = {doc.doc_id: doc for doc in documents}

    def search(self, query: str, limit: int = 20) -> Tuple[List[SearchResult], int]:
        """
        執行全文搜索

        Args:
            query: 搜索查詢
            limit: 返回結果數量上限

        Returns:
            (搜索結果列表, 總匹配數)
        """
        if not query or not query.strip():
            return [], 0

        logger.info(f"執行搜索: {query}")

        try:
            # 標準化查詢
            normalized_query = self._normalize_text(query)

            # 分詞
            terms = list(jieba.cut(normalized_query))
            terms = [t for t in terms if t and t not in STOP_WORDS and len(t) >= 2]

            if not terms:
                logger.warning(f"查詢分詞後無有效詞: {query}")
                return [], 0

            logger.debug(f"分詞結果: {terms}")

            # 搜索每個詞
            doc_scores = defaultdict(lambda: {"score": 0, "matches": [], "matched_terms": set()})

            for term in terms:
                # 精確匹配
                if term in self.index:
                    self._score_exact_matches(term, doc_scores)
                else:
                    # 模糊匹配
                    self._score_fuzzy_matches(term, doc_scores)

                # 標記匹配的詞
                for doc_id in list(doc_scores.keys()):
                    doc_scores[doc_id]["matched_terms"].add(term)

            # 多詞匹配加權
            for doc_id in doc_scores:
                matched_count = len(doc_scores[doc_id]["matched_terms"])
                if matched_count == len(terms):
                    doc_scores[doc_id]["score"] += SCORE_MULTI_TERM_BONUS

            # 構建結果
            results = []
            total = len(doc_scores)

            for doc_id, data in sorted(
                doc_scores.items(),
                key=lambda x: x[1]["score"],
                reverse=True
            )[:limit]:
                result = SearchResult(
                    doc_id=doc_id,
                    doc_title=self.doc_titles.get(doc_id, doc_id),
                    total_score=data["score"],
                    matches=data["matches"]
                )
                results.append(result)

            logger.info(f"搜索完成，結果數: {len(results)}")
            return results, total

        except Exception as e:
            logger.error(f"搜索失敗: {e}", exc_info=True)
            return [], 0

    def _score_exact_matches(self, term: str, doc_scores: Dict) -> None:
        """評分精確匹配"""
        if term not in self.index:
            return

        for doc_id, entry in self.index[term].items():
            score = SCORE_CONTENT_EXACT + (entry["title_frequency"] * 50)
            doc_scores[doc_id]["score"] += score

            # 提取匹配片段
            matches = self._extract_matches(
                doc_id,
                term,
                entry.get("positions", [])[:3]  # 最多3個
            )
            doc_scores[doc_id]["matches"].extend(matches)

    def _score_fuzzy_matches(self, term: str, doc_scores: Dict) -> None:
        """評分模糊匹配"""
        for indexed_term in self.index.keys():
            # 計算相似度
            ratio = fuzz.ratio(term, indexed_term)
            if ratio < 80:  # 相似度閾值
                continue

            score = int(SCORE_FUZZY * (ratio / 100))

            for doc_id, entry in self.index[indexed_term].items():
                doc_scores[doc_id]["score"] += score

                # 提取匹配片段
                matches = self._extract_matches(
                    doc_id,
                    indexed_term,
                    entry.get("positions", [])[:1]  # 模糊匹配只取第一個
                )
                doc_scores[doc_id]["matches"].extend(matches)

    def _extract_matches(
        self,
        doc_id: str,
        term: str,
        positions: List[int],
        context_length: int = 60
    ) -> List[SearchMatch]:
        """
        提取匹配片段

        Args:
            doc_id: 文檔 ID
            term: 搜索詞
            positions: 匹配位置列表
            context_length: 上下文長度

        Returns:
            匹配項列表
        """
        matches = []

        # 嘗試從緩存獲取文檔內容
        doc = self.documents_cache.get(doc_id)
        if not doc:
            return matches

        # 合併所有內容
        full_content = ""
        section_map = {}  # 字符位置 -> 章節信息

        char_pos = 0
        for section in doc.sections:
            section_start = char_pos
            section_text = section.heading + " " + section.content
            full_content += section_text + "\n"
            section_map[(section_start, char_pos + len(section_text))] = (section.id, section.heading)
            char_pos += len(section_text) + 1

        # 提取每個位置的上下文
        for pos in positions:
            start = max(0, pos - context_length)
            end = min(len(full_content), pos + len(term) + context_length)
            snippet = full_content[start:end]

            # 高亮匹配詞
            snippet = snippet.replace(term, f"<mark>{term}</mark>")

            # 找到所在章節
            section_id = "unknown"
            section_title = ""
            for (sec_start, sec_end), (s_id, s_title) in section_map.items():
                if sec_start <= pos < sec_end:
                    section_id = s_id
                    section_title = s_title
                    break

            match = SearchMatch(
                section_id=section_id,
                section_title=section_title,
                snippet=f"...{snippet}...",
                position=pos,
                score=SCORE_CONTENT_EXACT
            )
            matches.append(match)

        return matches

    def suggest(self, query_prefix: str, limit: int = 10) -> List[SuggestionItem]:
        """
        生成搜索建議

        Args:
            query_prefix: 查詢前綴
            limit: 建議數量上限

        Returns:
            建議項列表
        """
        if not query_prefix or len(query_prefix) < 1:
            return []

        try:
            # 標準化
            query_prefix = self._normalize_text(query_prefix)

            # 分詞
            terms = list(jieba.cut(query_prefix))
            if not terms or not terms[-1]:
                return []

            prefix = terms[-1]  # 最後一個詞用於前綴匹配

            # 前綴匹配
            suggestions = []
            for indexed_term in self.index.keys():
                if indexed_term.startswith(prefix):
                    # 計算該詞的總頻率
                    frequency = sum(
                        entry.get("frequency", 0)
                        for entry in self.index[indexed_term].values()
                    )

                    suggestion = SuggestionItem(
                        text=indexed_term,
                        frequency=frequency
                    )
                    suggestions.append(suggestion)

            # 按頻率排序
            suggestions.sort(key=lambda x: x.frequency, reverse=True)

            return suggestions[:limit]

        except Exception as e:
            logger.error(f"生成建議失敗: {e}")
            return []

    def _normalize_text(self, text: str) -> str:
        """標準化文本"""
        for variant, standard in VARIANT_MAP.items():
            text = text.replace(variant, standard)
        return text.lower()
