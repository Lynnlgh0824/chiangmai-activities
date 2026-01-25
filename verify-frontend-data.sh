#!/bin/bash
# 验证前端实际会显示的数据

echo "========================================="
echo "🔍 前端数据显示验证"
echo "========================================="
echo ""

# 获取前端实际请求的数据
echo "📡 获取前端API数据..."
API_DATA=$(curl -s "http://localhost:3000/api/activities?status=active&limit=1000")

# 使用Python处理JSON
python3 << 'PYTHON'
import json
import sys

data = json.loads(sys.argv[1]) if len(sys.argv) > 1 else {'data': []}
activities = data.get('data', [])

print(f"\n✅ API返回活动总数: {len(activities)}")

# 分类统计
with_date = [a for a in activities if a.get('date')]
without_date = [a for a in activities if not a.get('date') and a.get('weekdays')]
no_date_no_weekdays = [a for a in activities if not a.get('date') and not a.get('weekdays')]

print(f"📅 有具体日期的活动: {len(with_date)} 个")
print(f"🔄 固定频率的活动(无date有weekdays): {len(without_date)} 个")
print(f"⚠️  无日期无星期的活动: {len(no_date_no_weekdays)} 个")

print(f"\n📊 前端会显示的活动数: {len(with_date) + len(without_date)} 个")

if without_date:
    print(f"\n📌 固定频率活动示例（前5个）:")
    for i, activity in enumerate(without_date[:5], 1):
        weekdays = activity.get('weekdays', [])
        print(f"  {i}. {activity['title']}")
        print(f"     时间: {activity.get('time', 'N/A')}")
        print(f"     星期: {', '.join(weekdays) if weekdays else 'N/A'}")
        print(f"     地点: {activity.get('location', 'N/A')}")

if with_date:
    print(f"\n📅 有具体日期的活动示例（前3个）:")
    for i, activity in enumerate(with_date[:3], 1):
        print(f"  {i}. {activity['title']}")
        print(f"     日期: {activity.get('date', 'N/A')}")
        print(f"     时间: {activity.get('time', 'N/A')}")

print(f"\n✅ 验证完成！")
print(f"💡 前端主页 http://localhost:5173/ 应该显示 {len(with_date) + len(without_date)} 个活动")
PYTHON

echo ""
echo "========================================="
echo "💡 打开浏览器访问: http://localhost:5173/"
echo "========================================="
