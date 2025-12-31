#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
完整文檔表格映射生成腳本

為所有 26 個 .doc/.docx 文件生成完整的表格映射配置，
包括每個節點的 table IDs、行數、列信息等元數據。
"""

import json
import logging
import sys
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# 添加父目錄到路徑，以便導入 parsers 和 models
sys.path.insert(0, str(Path(__file__).parent.parent))

from parsers.doc_parser import DocParser
from models import DocumentContent

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ComprehensiveDocTableMapper:
    """完整的文檔表格映射生成器"""

    def __init__(self):
        """初始化映射生成器"""
        self.project_root = Path(__file__).parent.parent.parent
        self.doc_dir = self.project_root / "doc"
        self.output_dir = self.project_root / "backend" / "cache" / "doc-tables"
        self.tree_structure_path = self.project_root / "static" / "data" / "tree-structure.json"
        self.mapping_output_path = self.project_root / "static" / "data" / "doc-table-mapping.json"

        # 創建輸出目錄
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 初始化解析器
        cache_dir = self.project_root / "backend" / "cache"
        self.parser = DocParser(cache_dir)

        # 用於存儲映射結果
        self.doc_table_mapping = {}  # doc_id -> {tables: [...], metadata: {...}}
        self.node_to_doc = {}  # node_id -> doc_id
        self.table_counter = 0

        logger.info(f"📁 文檔目錄: {self.doc_dir}")
        logger.info(f"📁 輸出目錄: {self.output_dir}")

    def process_all_documents(self):
        """處理所有文檔文件"""
        logger.info("🚀 開始處理所有文檔...")

        # 同時查找 .doc 和 .docx 文件
        doc_files = sorted(list(self.doc_dir.glob("*.doc")) + list(self.doc_dir.glob("*.docx")))

        if not doc_files:
            logger.warning("⚠️ 未找到任何 .doc/.docx 文件")
            return

        logger.info(f"📄 找到 {len(doc_files)} 個文檔文件")

        successful = 0
        failed = []

        for i, doc_file in enumerate(doc_files, 1):
            try:
                logger.info(f"[{i}/{len(doc_files)}] ➡️  處理: {doc_file.name}")
                self.process_document(doc_file)
                successful += 1
                logger.info(f"    ✅ 成功")
            except Exception as e:
                logger.error(f"    ❌ 失敗: {str(e)}")
                failed.append(doc_file.name)

        # 生成映射文件
        logger.info("\n📋 生成完整映射配置...")
        self.generate_comprehensive_mapping()

        # 摘要
        logger.info(f"\n{'='*60}")
        logger.info(f"✅ 處理完成!")
        logger.info(f"   - 成功: {successful} 個文檔")
        logger.info(f"   - 失敗: {len(failed)} 個文檔")
        if failed:
            logger.warning(f"   - 失敗列表: {', '.join(failed)}")
        logger.info(f"   - 總表格數: {self.table_counter}")
        logger.info(f"{'='*60}\n")

    def process_document(self, doc_path: Path):
        """
        處理單個文檔文件

        Args:
            doc_path: 文檔路徑
        """
        # 解析文檔
        doc_content = self.parser.parse_file(doc_path)
        if not doc_content:
            raise Exception(f"無法解析文檔: {doc_path.name}")

        doc_id = doc_content.doc_id
        table_ids = []
        total_tables = 0
        total_rows = 0

        # 構建輸出數據結構
        doc_data = {
            "doc_id": doc_id,
            "filename": doc_content.filename,
            "title": doc_content.title,
            "sections": []
        }

        # 提取表格數據
        for section in doc_content.sections:
            if section.tables:
                section_data = {
                    "id": section.id,
                    "heading": section.heading,
                    "level": section.level,
                    "tables": []
                }

                for table_idx, table in enumerate(section.tables):
                    table_id = f"{doc_id}-section-{section.id}-table-{table_idx}"
                    table_ids.append(table_id)
                    total_tables += 1
                    total_rows += len(table.rows)
                    self.table_counter += 1

                    section_data["tables"].append({
                        "id": table_id,
                        "headers": table.headers,
                        "rows": table.rows,
                        "row_count": len(table.rows),
                        "column_count": len(table.headers)
                    })

                doc_data["sections"].append(section_data)

        # 存儲映射信息
        self.doc_table_mapping[doc_id] = {
            "filename": doc_content.filename,
            "title": doc_content.title,
            "tables": table_ids,
            "total_tables": total_tables,
            "total_rows": total_rows,
            "sections": len(doc_data["sections"]),
            "metadata": {
                "file_size": doc_path.stat().st_size,
                "parsed_at": datetime.now().isoformat()
            }
        }

        # 寫入 JSON 文件
        output_path = self.output_dir / f"{doc_id}.json"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(doc_data, f, ensure_ascii=False, indent=2)

        logger.info(f"    📊 表格: {total_tables} 個, 行數: {total_rows}")
        logger.info(f"    💾 已保存: {output_path.name}")

    def generate_comprehensive_mapping(self):
        """
        生成完整的映射配置文件

        包含：
        - 所有文檔的表格映射
        - 節點到文檔的映射
        - 表格元數據
        """
        # 讀取樹結構
        try:
            with open(self.tree_structure_path, 'r', encoding='utf-8') as f:
                tree = json.load(f)
        except Exception as e:
            logger.error(f"❌ 無法讀取樹結構: {str(e)}")
            return

        # 構建節點到文檔的映射
        node_mappings = {}
        self._traverse_tree_for_mapping(tree["root"], node_mappings)

        # 生成完整的映射結構
        complete_mapping = {
            "version": "3.0.0",
            "description": "完整的文檔表格映射配置",
            "generated_at": datetime.now().isoformat(),
            "summary": {
                "total_documents": len(self.doc_table_mapping),
                "total_tables": self.table_counter,
                "node_mappings": len(node_mappings)
            },
            "documents": self.doc_table_mapping,
            "nodes": node_mappings
        }

        # 寫入映射文件
        try:
            with open(self.mapping_output_path, 'w', encoding='utf-8') as f:
                json.dump(complete_mapping, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ 完整映射已生成: {self.mapping_output_path.name}")
            logger.info(f"   📊 文檔總數: {complete_mapping['summary']['total_documents']}")
            logger.info(f"   📌 節點映射: {complete_mapping['summary']['node_mappings']}")
            logger.info(f"   📋 表格總數: {complete_mapping['summary']['total_tables']}")
        except Exception as e:
            logger.error(f"❌ 寫入映射文件失敗: {str(e)}")

    def _traverse_tree_for_mapping(self, node, node_mappings):
        """
        遞歸遍歷樹結構，生成節點映射

        Args:
            node: 當前節點
            node_mappings: 節點映射字典
        """
        node_id = node.get("id")
        node_type = node.get("type")
        node_label = node.get("label", "")

        # 嘗試找到該節點對應的文檔
        if "metadata" in node:
            metadata = node.get("metadata", {})
            doc_id = metadata.get("doc_id")

            # 根據 doc_id 查找對應的文檔
            if doc_id and doc_id in self.doc_table_mapping:
                doc_info = self.doc_table_mapping[doc_id]
                node_mappings[node_id] = {
                    "node_type": node_type,
                    "label": node_label,
                    "doc_id": doc_id,
                    "doc_title": doc_info["title"],
                    "tables": doc_info["tables"],
                    "total_tables": doc_info["total_tables"],
                    "total_rows": doc_info["total_rows"],
                    "sections": doc_info["sections"]
                }

                logger.info(f"   ✓ {node_id}: 已映射到 {doc_id} ({doc_info['total_tables']} 個表格)")

        # 遞歸處理子節點
        if "children" in node:
            for child in node["children"]:
                self._traverse_tree_for_mapping(child, node_mappings)


def main():
    """主函數"""
    try:
        mapper = ComprehensiveDocTableMapper()
        mapper.process_all_documents()
        return 0
    except Exception as e:
        logger.error(f"❌ 致命錯誤: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
