#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书多维表格数据 → 项目JSON转换工具（支持Excel和CSV）
用于飞书个人版用户手动同步数据
"""

import json
import sys
import os
from datetime import datetime

# 尝试导入Excel处理库
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

try:
    import openpyxl
    HAS_OPENPYXL = True
except ImportError:
    HAS_OPENPYXL = False

import csv


def parse_weekdays(weekday_str):
    """解析星期字符串为数组"""
    if not weekday_str:
        return []

    weekday_map = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4,
        '周五': 5, '周六': 6, '周日': 0
    }

    weekdays = []
    for s in str(weekday_str).split(','):
        s = s.strip()
        if s in weekday_map:
            weekdays.append(weekday_map[s])

    return weekdays


def parse_images(url_str):
    """解析图片URL字符串"""
    if not url_str or pd.isna(url_str):
        return []

    # 支持换行符或逗号分隔
    urls = []
    url_str = str(url_str)
    for s in url_str.replace('\n', ',').split(','):
        s = s.strip()
        if s:
            urls.append(s)

    return urls


def map_status(status):
    """映射状态字段"""
    if not status or pd.isna(status):
        return 'active'

    status_map = {
        '草稿': 'draft',
        '待开始': 'upcoming',
        '进行中': 'ongoing',
        '已过期': 'expired'
    }
    return status_map.get(str(status), 'active')


def safe_int(value):
    """安全转换为整数"""
    try:
        if pd.isna(value) or value == '':
            return 0
        return int(float(value))
    except:
        return 0


def safe_str(value):
    """安全转换为字符串"""
    if pd.isna(value):
        return ''
    return str(value).strip()


def read_excel_file(file_path):
    """使用pandas读取Excel文件"""
    if not HAS_PANDAS:
        raise ImportError("缺少pandas库，请运行: pip install pandas openpyxl")

    if not HAS_OPENPYXL:
        raise ImportError("缺少openpyxl库，请运行: pip install openpyxl")

    # 读取Excel文件
    try:
        # 尝试读取所有工作表
        xl_file = pd.ExcelFile(file_path)
        print(f"📊 Excel文件包含 {len(xl_file.sheet_names)} 个工作表:")
        for i, sheet in enumerate(xl_file.sheet_names, 1):
            print(f"   {i}. {sheet}")

        # 询问使用哪个工作表（这里默认使用第一个）
        df = pd.read_excel(file_path, sheet_name=0)

        # 删除完全空的行
        df = df.dropna(how='all')

        return df

    except Exception as e:
        raise Exception(f"读取Excel文件失败: {str(e)}")


def read_csv_file(file_path):
    """读取CSV文件"""
    rows = []

    try:
        with open(file_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)
            for row in reader:
                rows.append(row)

        return rows

    except FileNotFoundError:
        raise Exception(f"找不到文件: {file_path}")
    except Exception as e:
        raise Exception(f"读取CSV失败: {str(e)}")


def convert_data_to_json(data, json_file):
    """转换数据（DataFrame或列表）到JSON格式"""

    items = []

    # 判断数据类型
    if HAS_PANDAS and isinstance(data, pd.DataFrame):
        # 处理pandas DataFrame
        for row_num, row in data.iterrows():
            try:
                item = process_row(row.to_dict(), row_num + 2)
                if item:
                    items.append(item)
                    print(f"✅ 第 {row_num + 2} 行：{item['title']}")
            except Exception as e:
                print(f"❌ 第 {row_num + 2} 行转换失败：{str(e)}")
                continue

    else:
        # 处理列表（CSV数据）
        for row_num, row in enumerate(data, start=2):
            try:
                item = process_row(row, row_num)
                if item:
                    items.append(item)
                    print(f"✅ 第 {row_num} 行：{item['title']}")
            except Exception as e:
                print(f"❌ 第 {row_num} 行转换失败：{str(e)}")
                continue

    # 保存为JSON
    try:
        # 确保目录存在
        os.makedirs(os.path.dirname(json_file), exist_ok=True)

        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)

        print(f"\n{'='*60}")
        print(f"✅ 转换完成!")
        print(f"📊 共处理 {len(items)} 条记录")
        print(f"📁 输出文件: {json_file}")
        print(f"{'='*60}\n")

        return items

    except Exception as e:
        print(f"❌ 保存JSON失败：{str(e)}")
        sys.exit(1)


def process_row(row, row_num):
    """处理单行数据"""

    # 处理pandas NaN值
    def get_field(field_name):
        value = row.get(field_name)
        if HAS_PANDAS and pd is not None and hasattr(pd, 'isna'):
            if pd.isna(value):
                return ''
        return safe_str(value) if value else ''

    # 跳过空行
    title = get_field('活动标题')
    if not title:
        print(f"⚠️  跳过第 {row_num} 行：缺少活动标题")
        return None

    # 判断活动类型
    activity_type = get_field('活动类型') or '固定频率'

    item = {
        'id': get_field('序号') or f"feishu_{int(datetime.now().timestamp() * 1000)}_{row_num}",
        '_id': get_field('序号') or f"feishu_{int(datetime.now().timestamp() * 1000)}_{row_num}",
        'title': title,
        'category': get_field('分类') or '其他',
        'status': map_status(get_field('状态')),
        'description': get_field('活动描述'),
        'time': get_field('时间'),
        'duration': get_field('持续时间'),
        'location': get_field('地点名称'),
        'address': get_field('详细地址'),
        'price': get_field('价格显示'),
        'priceMin': safe_int(row.get('最低价格')),
        'priceMax': safe_int(row.get('最高价格')),
        'currency': '฿',
        'maxParticipants': safe_int(row.get('最大人数')),
        'flexibleTime': get_field('灵活时间') == '是',
        'bookingRequired': get_field('需要预约') == '是',
        'images': parse_images(get_field('图片URL')),
        'source': {
            'name': '飞书表格录入',
            'url': get_field('来源链接'),
            'type': 'feishu',
            'lastUpdated': datetime.now().isoformat()
        },
        'createdAt': datetime.now().isoformat(),
        'updatedAt': datetime.now().isoformat()
    }

    # 根据活动类型添加字段
    if activity_type == '固定频率':
        item['weekdays'] = parse_weekdays(get_field('星期/日期'))
        item['frequency'] = 'weekly'
    else:
        item['date'] = get_field('星期/日期')
        item['frequency'] = 'once'

    return item


def main():
    """主函数"""
    print("="*60)
    print("🔄 飞书数据 → JSON 转换工具（支持Excel和CSV）")
    print("="*60)

    # 检查依赖
    if len(sys.argv) < 2:
        print("\n⚠️  使用方法:")
        print("   python excel-to-json.py <输入文件> [输出文件]")
        print("\n📁 支持的文件格式:")
        print("   - Excel文件: .xlsx, .xls")
        print("   - CSV文件:  .csv")
        print("\n💡 示例:")
        print("   python excel-to-json.py 清迈活动数据.xlsx")
        print("   python excel-to-json.py 清迈活动数据.xlsx data/items.json")
        print("   python excel-to-json.py 活动数据.csv")
        print("\n")
        sys.exit(1)

    # 获取参数
    input_file = sys.argv[1]
    json_file = sys.argv[2] if len(sys.argv) > 2 else 'data/items.json'

    print(f"📥 输入文件: {input_file}")
    print(f"📤 输出文件: {json_file}")
    print(f"{'='*60}\n")

    # 检查文件是否存在
    if not os.path.exists(input_file):
        print(f"❌ 错误：找不到文件 {input_file}")
        sys.exit(1)

    # 根据文件扩展名选择读取方式
    file_ext = os.path.splitext(input_file)[1].lower()

    try:
        if file_ext in ['.xlsx', '.xls']:
            print("📊 检测到Excel文件，使用pandas读取...")
            data = read_excel_file(input_file)

        elif file_ext == '.csv':
            print("📄 检测到CSV文件，使用csv模块读取...")
            data = read_csv_file(input_file)

        else:
            print(f"❌ 不支持的文件格式: {file_ext}")
            print("   请使用 .xlsx, .xls 或 .csv 文件")
            sys.exit(1)

        # 转换数据
        items = convert_data_to_json(data, json_file)

        # 提示
        print("💡 提示：")
        print("   1. 请刷新前端页面查看更新")
        print("   2. 前端地址: http://localhost:5173")
        print("   3. 如果数据未更新，请重启服务器")
        print()

    except ImportError as e:
        print(f"\n❌ 缺少依赖库: {str(e)}")
        print("\n📦 请安装所需依赖:")
        print("   pip install pandas openpyxl")
        print("\n   或使用国内镜像加速:")
        print("   pip install -i https://pypi.tuna.tsinghua.edu.cn/simple pandas openpyxl")
        print()
        sys.exit(1)

    except Exception as e:
        print(f"\n❌ 转换失败: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
