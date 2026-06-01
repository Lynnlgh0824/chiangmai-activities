#!/usr/bin/env python3
"""
批量替换品牌名称
清迈指南/清迈指南/清迈指南 → 清迈指南
Chiang Mai Guide → Chiang Mai Guide
"""

import os
import re
from pathlib import Path

# 定义替换映射
REPLACEMENTS = [
    ("清迈指南", "清迈指南"),
    ("清迈指南", "清迈指南"),
    ("清迈指南", "清迈指南"),
    ("Chiang Mai Guide", "Chiang Mai Guide"),
    ("chiangmai-guide", "chiangmai-guide"),  # package name
]

# 需要排除的目录和文件
EXCLUDE_DIRS = {
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '.vercel',
    'archive',
    'test-results',
    'logs',
}

EXCLUDE_PATTERNS = [
    '*.log',
    '*.lock',
    'rename-brand.py',
    'BRAND-NAME-OPTIMIZATION.md',
]

def should_process_file(filepath):
    """判断文件是否需要处理"""
    # 检查是否在排除目录中
    parts = Path(filepath).parts
    for part in parts:
        if part in EXCLUDE_DIRS:
            return False

    # 检查文件扩展名
    extensions = {'.md', '.html', '.js', '.json', '.jsx', '.ts', '.tsx',
                  '.cjs', '.mjs', '.py', '.sh', '.yml', '.yaml', '.txt',
                  '.css', '.scss', '.xml'}
    if Path(filepath).suffix not in extensions:
        return False

    return True

def replace_in_file(filepath):
    """在文件中执行替换"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        original_content = content

        # 执行所有替换
        for old, new in REPLACEMENTS:
            if old in content:
                content = content.replace(old, new)

        # 如果有替换，写回文件
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return sum(original_content.count(old) for old, _ in REPLACEMENTS)

        return 0

    except Exception as e:
        return 0

def main():
    """主函数"""
    print("=" * 60)
    print("🏝️  清迈指南 - 品牌名称批量替换工具")
    print("=" * 60)
    print()

    # 获取项目根目录
    root_dir = Path.cwd()
    if not (root_dir / 'public').exists():
        print("❌ 错误：请在项目根目录运行此脚本")
        return

    print(f"📁 项目目录: {root_dir}")
    print(f"🔄 替换规则:")
    for old, new in REPLACEMENTS:
        print(f"   '{old}' → '{new}'")
    print()
    print("-" * 60)
    print()

    # 遍历所有文件
    total_files = 0
    modified_files = 0
    total_replacements = 0

    for filepath in root_dir.rglob('*'):
        if not filepath.is_file():
            continue

        if not should_process_file(filepath):
            continue

        total_files += 1
        replace_count = replace_in_file(filepath)

        if replace_count > 0:
            modified_files += 1
            total_replacements += replace_count
            relative_path = filepath.relative_to(root_dir)
            print(f"✅ {relative_path} ({replace_count} 处替换)")

    print()
    print("-" * 60)
    print()
    print(f"📊 统计结果:")
    print(f"   扫描文件: {total_files} 个")
    print(f"   修改文件: {modified_files} 个")
    print(f"   替换次数: {total_replacements} 处")
    print()
    print("✅ 品牌名称替换完成！")
    print("=" * 60)

if __name__ == '__main__':
    main()
