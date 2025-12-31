#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
文檔表格批量提取腳本

從所有 .doc 文件提取表格數據，生成前端可用的 JSON 文件
以及節點映射配置。
"""

import json
import logging
import sys
from pathlib import Path
from datetime import datetime

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


class DocTableExporter:
    """文檔表格導出器"""

    def __init__(self):
        """初始化導出器"""
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

        logger.info(f"📁 文檔目錄: {self.doc_dir}")
        logger.info(f"📁 輸出目錄: {self.output_dir}")

    def export_all(self):
        """批量導出所有文檔表格"""
        logger.info("🚀 開始批量提取文檔表格...")

        # 查找所有 .doc 文件
        doc_files = sorted(self.doc_dir.glob("*.doc"))
        if not doc_files:
            logger.warning("⚠️ 未找到任何 .doc 文件")
            return {}

        logger.info(f"📄 找到 {len(doc_files)} 個 .doc 文件")

        exported_docs = {}
        failed_docs = []

        for doc_file in doc_files:
            try:
                logger.info(f"➡️  處理: {doc_file.name}")
                doc_data = self.export_document(doc_file)
                if doc_data:
                    exported_docs[doc_data["doc_id"]] = doc_data
                    logger.info(f"✅ 成功提取: {doc_file.name}")
                else:
                    logger.warning(f"⚠️ 無法解析: {doc_file.name}")
                    failed_docs.append(doc_file.name)
            except Exception as e:
                logger.error(f"❌ 解析失敗 {doc_file.name}: {str(e)}")
                failed_docs.append(doc_file.name)

        # 生成映射文件
        logger.info("📋 生成節點映射文件...")
        self.generate_mapping(exported_docs)

        # 總結
        logger.info(f"\n{'='*50}")
        logger.info(f"✅ 提取完成!")
        logger.info(f"   - 成功: {len(exported_docs)} 個文檔")
        logger.info(f"   - 失敗: {len(failed_docs)} 個文檔")
        if failed_docs:
            logger.warning(f"   - 失敗的文檔: {', '.join(failed_docs)}")
        logger.info(f"{'='*50}\n")

        return exported_docs

    def export_document(self, doc_path: Path) -> dict:
        """
        導出單個文檔的表格

        Args:
            doc_path: 文檔路徑

        Returns:
            導出的文檔數據
        """
        # 解析文檔
        doc_content = self.parser.parse_file(doc_path)
        if not doc_content:
            logger.warning(f"⚠️ 無法解析文檔: {doc_path.name}")
            return None

        # 構建輸出數據
        doc_data = {
            "doc_id": doc_content.doc_id,
            "filename": doc_content.filename,
            "title": doc_content.title,
            "sections": []
        }

        # 提取包含表格的 sections
        table_count = 0
        for section in doc_content.sections:
            if section.tables:
                section_data = {
                    "id": section.id,
                    "heading": section.heading,
                    "level": section.level,
                    "tables": [
                        {
                            "headers": t.headers,
                            "rows": t.rows
                        }
                        for t in section.tables
                    ]
                }
                doc_data["sections"].append(section_data)
                table_count += len(section.tables)

        # 寫入 JSON 文件
        output_path = self.output_dir / f"{doc_content.doc_id}.json"
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(doc_data, f, ensure_ascii=False, indent=2)
            logger.info(f"   📊 提取表格: {table_count} 個 → {output_path.name}")
        except Exception as e:
            logger.error(f"   ❌ 寫入失敗: {str(e)}")
            return None

        return doc_data

    def generate_mapping(self, exported_docs: dict):
        """
        生成節點映射文件

        Args:
            exported_docs: 已導出的文檔數據
        """
        # 讀取樹結構
        try:
            with open(self.tree_structure_path, 'r', encoding='utf-8') as f:
                tree = json.load(f)
        except Exception as e:
            logger.error(f"❌ 無法讀取樹結構: {str(e)}")
            return

        # 構建映射
        mapping = {
            "version": "2.0.0",
            "description": "節點到文檔表格的映射",
            "generated_at": datetime.now().isoformat(),
            "mappings": {}
        }

        # 遍歷樹結構，建立映射
        self._traverse_tree(tree["root"], exported_docs, mapping["mappings"])

        # 寫入映射文件
        try:
            with open(self.mapping_output_path, 'w', encoding='utf-8') as f:
                json.dump(mapping, f, ensure_ascii=False, indent=2)
            logger.info(f"✅ 映射文件已生成: {self.mapping_output_path.name}")
            logger.info(f"   📍 包含 {len(mapping['mappings'])} 個節點映射")
        except Exception as e:
            logger.error(f"❌ 寫入映射文件失敗: {str(e)}")

    def _traverse_tree(self, node, exported_docs, mappings):
        """
        遞歸遍歷樹結構，建立映射

        Args:
            node: 當前節點
            exported_docs: 已導出的文檔數據
            mappings: 映射字典
        """
        node_id = node.get("id")
        node_label = node.get("label", "")

        # 檢查該節點是否有對應的文檔
        if "metadata" in node:
            metadata = node["metadata"]
            if "doc_id" in metadata:
                doc_id = metadata["doc_id"]
                # 查找對應的 .doc 文件
                doc_file = list(self.doc_dir.glob(f"{doc_id}*.doc"))
                if doc_file:
                    doc_filename = doc_file[0].stem
                    # 檢查是否已導出
                    if doc_filename in exported_docs:
                        doc_data = exported_docs[doc_filename]
                        has_tables = len(doc_data["sections"]) > 0

                        mappings[node_id] = {
                            "label": node_label,
                            "doc_id": doc_filename,
                            "has_tables": has_tables,
                            "doc_title": doc_data["title"],
                            "table_count": sum(
                                len(s["tables"]) for s in doc_data["sections"]
                            )
                        }

        # 遞歸處理子節點
        if "children" in node:
            for child in node["children"]:
                self._traverse_tree(child, exported_docs, mappings)


def main():
    """主函數"""
    try:
        exporter = DocTableExporter()
        exporter.export_all()
        return 0
    except Exception as e:
        logger.error(f"❌ 致命錯誤: {str(e)}", exc_info=True)
        return 1


if __name__ == "__main__":
    sys.exit(main())
