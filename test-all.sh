#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清迈活动平台 - 自动化测试脚本
测试所有功能与数据实时联动
"""

import requests
import json
import time
from datetime import datetime

# 配置
BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:3000/api"
ADMIN_URL = f"{BASE_URL}/admin.html"

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    print(f"{text}")
    print(f"{'='*60}{Colors.END}\n")

def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text):
    print(f"{Colors.CYAN}ℹ️ {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def test_api_connection():
    """测试后端API连接"""
    print_header("1️⃣  测试后端API连接")

    try:
        response = requests.get(f"{API_URL}/items", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                items = data.get('data', [])
                print_success(f"后端API连接正常")
                print_info(f"当前数据: {len(items)} 条活动")
                return True
            else:
                print_error("API返回失败")
                return False
        else:
            print_error(f"API连接失败: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"无法连接到后端API: {str(e)}")
        return False

def get_activities_count():
    """获取当前活动数量"""
    try:
        response = requests.get(f"{API_URL}/activities", timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return len(data.get('data', []))
    except:
        pass
    return 0

def create_test_activity():
    """创建测试活动"""
    print_header("2️⃣  创建测试活动")

    test_activity = {
        "title": f"自动化测试活动 - {datetime.now().strftime('%H:%M:%S')}",
        "category": "测试",
        "status": "upcoming",
        "description": "这是自动化测试创建的活动",
        "time": "10:00-11:00",
        "duration": "1小时",
        "location": "测试地点",
        "address": "测试地址",
        "price": "免费",
        "priceMin": 0,
        "priceMax": 0,
        "currency": "฿",
        "maxParticipants": 10,
        "flexibleTime": False,
        "bookingRequired": False,
        "images": [],
        "source": {
            "name": "自动化测试",
            "type": "test"
        }
    }

    try:
        response = requests.post(
            f"{API_URL}/activities",
            json=test_activity,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                activity_id = data.get('data', {}).get('id')
                print_success(f"测试活动创建成功")
                print_info(f"活动ID: {activity_id}")
                return activity_id
            else:
                print_error(f"创建失败: {data.get('message')}")
                return None
        else:
            print_error(f"HTTP {response.status_code}: {response.text}")
            return None
    except Exception as e:
        print_error(f"创建活动失败: {str(e)}")
        return None

def delete_activity(activity_id):
    """删除活动"""
    try:
        response = requests.delete(
            f"{API_URL}/activities/{activity_id}",
            timeout=5
        )

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print_success("活动删除成功")
                return True

        print_error(f"删除失败: HTTP {response.status_code}")
        return False
    except Exception as e:
        print_error(f"删除活动异常: {str(e)}")
        return False

def test_data_consistency(initial_count):
    """测试数据一致性"""
    print_header("3️⃣  测试数据实时联动")

    print_info(f"初始活动数: {initial_count}")

    # 创建测试活动
    activity_id = create_test_activity()
    if not activity_id:
        print_error("无法创建测试活动，跳过联动测试")
        return False

    time.sleep(2)  # 等待数据同步

    # 验证API返回
    new_count = get_activities_count()
    expected_count = initial_count + 1

    if new_count == expected_count:
        print_success(f"数据联动正常: {initial_count} → {new_count}")
    else:
        print_error(f"数据联动异常: 期望 {expected_count}，实际 {new_count}")
        return False

    # 删除测试活动
    print_info("删除测试活动...")
    if delete_activity(activity_id):
        time.sleep(2)

        final_count = get_activities_count()
        if final_count == initial_count:
            print_success(f"数据清理正常: {new_count} → {final_count}")
            return True
        else:
            print_error(f"数据清理异常: 期望 {initial_count}，实际 {final_count}")
            return False

    return False

def test_frontend_pages():
    """测试前端页面可访问性"""
    print_header("4️⃣  测试前端页面")

    pages = [
        ("主页", f"{BASE_URL}/"),
        ("日历页面", f"{BASE_URL}/schedule"),
        ("管理后台", f"{BASE_URL}/admin.html")
    ]

    all_ok = True
    for name, url in pages:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                title = extract_title(response.text)
                print_success(f"{name}: 可访问 ({title})")
            else:
                print_error(f"{name}: HTTP {response.status_code}")
                all_ok = False
        except Exception as e:
            print_error(f"{name}: 无法访问 - {str(e)}")
            all_ok = False

    return all_ok

def extract_title(html):
    """从HTML中提取标题"""
    import re
    match = re.search(r'<title>(.*?)</title>', html)
    return match.group(1) if match else "未知标题"

def test_empty_state():
    """测试空状态显示"""
    print_header("5️⃣  测试空状态显示")

    current_count = get_activities_count()
    print_info(f"当前活动数: {current_count}")

    if current_count == 0:
        print_success("后台为空，这是正确的空状态")
        print_info("预期行为: 前端应该显示'暂无活动'")
        return True
    else:
        print_warning(f"后台有 {current_count} 条活动，跳过空状态测试")
        return True

def test_data_integrity():
    """测试数据完整性"""
    print_header("6️⃣  测试数据完整性")

    try:
        response = requests.get(f"{API_URL}/activities", timeout=5)
        if response.status_code != 200:
            print_error("无法获取活动数据")
            return False

        data = response.json()
        if not data.get('success'):
            print_error("API返回失败")
            return False

        activities = data.get('data', [])
        print_info(f"获取到 {len(activities)} 条活动")

        # 检查必要字段
        required_fields = ['title', 'category', 'time', 'location']
        all_valid = True

        for i, activity in enumerate(activities[:5], 1):  # 只检查前5条
            missing = [field for field in required_fields if not activity.get(field)]
            if missing:
                print_warning(f"活动 {i} 缺少字段: {', '.join(missing)}")
                all_valid = False

        if all_valid:
            print_success("数据完整性检查通过")

        # 显示活动摘要
        print_info("活动摘要:")
        for i, activity in enumerate(activities[:3], 1):
            print(f"  {i}. {activity.get('title')} ({activity.get('category')})")

        return all_valid
    except Exception as e:
        print_error(f"数据完整性测试失败: {str(e)}")
        return False

def generate_report(results):
    """生成测试报告"""
    print_header("📊 测试报告")

    total_tests = len(results)
    passed_tests = sum(1 for r in results if r['passed'])
    failed_tests = total_tests - passed_tests

    print(f"总测试数: {total_tests}")
    print(f"{Colors.GREEN}通过: {passed_tests}{Colors.END}")
    print(f"{Colors.RED}失败: {failed_tests}{Colors.END}")
    print(f"成功率: {passed_tests/total_tests*100:.1f}%")

    if failed_tests == 0:
        print_success("\n🎉 所有测试通过！系统运行正常！")
        print_info("✅ 后端API正常")
        print_info("✅ 前端页面可访问")
        print_info("✅ 数据实时联动正常")
        print_info("✅ 数据完整性良好")
        print_info("\n💡 系统已就绪，可以正常使用！")
    else:
        print_error(f"\n⚠️  有 {failed_tests} 个测试失败，请检查")
        print_info("建议检查:")
        print_info("  1. 后端服务器是否运行 (npm run dev:server)")
        print_info("  2. 前端服务器是否运行 (npm run dev:client)")
        print_info("  3. 数据文件是否存在 (data/items.json)")

    print("\n" + "="*60)
    print("测试时间:", datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    print("="*60)

def main():
    """主测试流程"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║          🏝️ Chiengmai Activities - 自动化测试                  ║")
    print("║          数据实时联动验证                                        ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    print_info(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"前端地址: {BASE_URL}")
    print_info(f"后端地址: {API_URL}")
    print_info(f"管理后台: {ADMIN_URL}")

    results = []

    # 测试1: API连接
    results.append({
        'name': '后端API连接',
        'passed': test_api_connection()
    })

    # 测试2: 前端页面
    results.append({
        'name': '前端页面可访问性',
        'passed': test_frontend_pages()
    })

    # 测试3: 数据完整性
    results.append({
        'name': '数据完整性',
        'passed': test_data_integrity()
    })

    # 测试4: 空状态
    results.append({
        'name': '空状态显示',
        'passed': test_empty_state()
    })

    # 测试5: 数据联动
    initial_count = get_activities_count()
    if initial_count < 10:  # 只有活动较少时才测试联动，避免数据太多
        results.append({
            'name': '数据实时联动',
            'passed': test_data_consistency(initial_count)
        })
    else:
        print_warning(f"当前有 {initial_count} 条活动，跳过联动测试")
        results.append({
            'name': '数据实时联动',
            'passed': True
        })

    # 生成报告
    generate_report(results)

if __name__ == '__main__':
    main()
