#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
飞书多维表格CSV → 项目JSON转换工具
用于飞书个人版用户手动同步数据
"""

import csv
import json
import sys
import os
from datetime import datetime

def parse_weekdays(weekday_str):
    """解析星期字符串为数组"""
    if not weekday_str:
        return []

    weekday_map = {
        '周一': 1, '周二': 2, '周三': 3, '周四': 4,
        '周五': 5, '周六': 6, '周日': 0
    }

    weekdays = []
    for s in weekday_str.split(','):
        s = s.strip()
        if s in weekday_map:
            weekdays.append(weekday_map[s])

    return weekdays


def parse_images(url_str):
    """解析图片URL字符串"""
    if not url_str:
        return []

    # 支持换行符或逗号分隔
    urls = []
    for s in url_str.replace('\n', ',').split(','):
        s = s.strip()
        if s:
            urls.append(s)

    return urls


def map_status(status):
    """映射状态字段"""
    if not status:
        return 'active'

    status_map = {
        '草稿': 'draft',
        '待开始': 'upcoming',
        '进行中': 'ongoing',
        '已过期': 'expired'
    }
    return status_map.get(status, 'active')


def convert_csv_to_json(csv_file, json_file):
    """转换CSV到JSON格式"""

    items = []

    try:
        with open(csv_file, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            for row_num, row in enumerate(reader, start=2):
                # 跳过空行
                if not row.get('活动标题'):
                    print(f"⚠️  跳过第 {row_num} 行：缺少活动标题")
                    continue

                try:
                    # 判断活动类型
                    activity_type = row.get('活动类型', '固定频率')

                    item = {
                        'id': row.get('序号') or f"feishu_{int(datetime.now().timestamp() * 1000)}_{row_num}",
                        '_id': row.get('序号') or f"feishu_{int(datetime.now().timestamp() * 1000)}_{row_num}",
                        'title': row.get('活动标题', ''),
                        'category': row.get('分类', '其他'),
                        'status': map_status(row.get('状态')),
                        'description': row.get('活动描述', ''),
                        'time': row.get('时间', ''),
                        'duration': row.get('持续时间', ''),
                        'location': row.get('地点名称', ''),
                        'address': row.get('详细地址', ''),
                        'price': row.get('价格显示', ''),
                        'priceMin': int(row.get('最低价格') or 0),
                        'priceMax': int(row.get('最高价格') or 0),
                        'currency': '฿',
                        'maxParticipants': int(row.get('最大人数') or 0),
                        'flexibleTime': row.get('灵活时间') == '是',
                        'bookingRequired': row.get('需要预约') == '是',
                        'images': parse_images(row.get('图片URL', '')),
                        'source': {
                            'name': '飞书表格录入',
                            'url': row.get('来源链接', ''),
                            'type': 'feishu',
                            'lastUpdated': datetime.now().isoformat()
                        },
                        'createdAt': datetime.now().isoformat(),
                        'updatedAt': datetime.now().isoformat()
                    }

                    # 根据活动类型添加字段
                    if activity_type == '固定频率':
                        item['weekdays'] = parse_weekdays(row.get('星期/日期', ''))
                        item['frequency'] = 'weekly'
                    else:
                        item['date'] = row.get('星期/日期', '')
                        item['frequency'] = 'once'

                    items.append(item)
                    print(f"✅ 第 {row_num} 行：{item['title']}")

                except Exception as e:
                    print(f"❌ 第 {row_num} 行转换失败：{str(e)}")
                    continue

    except FileNotFoundError:
        print(f"❌ 错误：找不到文件 {csv_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 读取CSV失败：{str(e)}")
        sys.exit(1)

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


def main():
    """主函数"""
    print("="*60)
    print("🔄 飞书CSV → JSON 转换工具")
    print("="*60)

    # 获取参数
    csv_file = sys.argv[1] if len(sys.argv) > 1 else '活动数据.csv'
    json_file = sys.argv[2] if len(sys.argv) > 2 else 'data/items.json'

    print(f"📥 输入文件: {csv_file}")
    print(f"📤 输出文件: {json_file}")
    print(f"{'='*60}\n")

    # 执行转换
    items = convert_csv_to_json(csv_file, json_file)

    # 提示
    print("💡 提示：")
    print("   1. 请刷新前端页面查看更新")
    print("   2. 前端地址: http://localhost:5173")
    print("   3. 如果数据未更新，请重启服务器")
    print()


if __name__ == '__main__':
    main()
