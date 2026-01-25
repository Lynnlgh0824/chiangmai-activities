#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清迈活动平台 - 增强版自动化测试脚本
包含主页功能验证和自动修复建议
"""

import requests
import json
import time
from datetime import datetime

# 配置
BASE_URL = "http://localhost:5173"
API_URL = "http://localhost:3000/api"

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
    print(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def test_homepage_features():
    """测试主页功能"""
    print_header("🏠 主页功能测试")

    issues = []

    try:
        response = requests.get(BASE_URL, timeout=5)
        if response.status_code != 200:
            issues.append(f"主页访问失败: HTTP {response.status_code}")
            print_error(f"主页访问失败: HTTP {response.status_code}")
        else:
            print_success("主页可访问")

            # 检查关键元素
            html = response.text

            # 检查标题
            if '<title>' in html:
                print_success("页面标题存在")
            else:
                issues.append("缺少页面标题")
                print_error("缺少页面标题")

            # 检查活动容器
            if 'activities-grid' in html or 'activity-card' in html:
                print_success("活动容器存在")
            else:
                issues.append("缺少活动容器")
                print_error("缺少活动容器")

            # 检查导航
            if 'schedule' in html.lower():
                print_success("导航链接存在")
            else:
                issues.append("缺少导航链接")
                print_error("缺少导航链接")

    except Exception as e:
        issues.append(f"主页测试异常: {str(e)}")
        print_error(f"主页测试异常: {str(e)}")

    return len(issues) == 0, issues

def test_calendar_features():
    """测试日历页面功能"""
    print_header("📅 日历页面功能测试")

    issues = []

    try:
        response = requests.get(f"{BASE_URL}/schedule", timeout=5)
        if response.status_code != 200:
            issues.append(f"日历页面访问失败: HTTP {response.status_code}")
            print_error(f"日历页面访问失败: HTTP {response.status_code}")
        else:
            print_success("日历页面可访问")

            html = response.text

            # 检查视图切换按钮
            if 'view-toggle' in html or '日历视图' in html or '列表视图' in html:
                print_success("视图切换按钮存在")
            else:
                issues.append("缺少视图切换按钮")
                print_error("缺少视图切换按钮")

            # 检查返回按钮
            if '返回' in html:
                print_success("返回按钮存在")
            else:
                issues.append("缺少返回按钮")
                print_warning("缺少返回按钮")

    except Exception as e:
        issues.append(f"日历页面测试异常: {str(e)}")
        print_error(f"日历页面测试异常: {str(e)}")

    return len(issues) == 0, issues

def test_admin_features():
    """测试管理后台功能"""
    print_header("🔧 管理后台功能测试")

    issues = []

    try:
        response = requests.get(f"{BASE_URL}/admin.html", timeout=5)
        if response.status_code != 200:
            issues.append(f"管理后台访问失败: HTTP {response.status_code}")
            print_error(f"管理后台访问失败: HTTP {response.status_code}")
        else:
            print_success("管理后台可访问")

            html = response.text

            # 检查表单元素
            if 'form' in html.lower():
                print_success("表单存在")
            else:
                issues.append("缺少表单")
                print_error("缺少表单")

            # 检查按钮
            if 'submit' in html.lower() or 'button' in html.lower():
                print_success("操作按钮存在")
            else:
                issues.append("缺少操作按钮")
                print_error("缺少操作按钮")

    except Exception as e:
        issues.append(f"管理后台测试异常: {str(e)}")
        print_error(f"管理后台测试异常: {str(e)}")

    return len(issues) == 0, issues

def test_api_endpoints():
    """测试API端点"""
    print_header("🔌 API端点测试")

    issues = []
    endpoints = [
        ('/activities', '活动列表'),
        ('/items', '所有数据'),
    ]

    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{API_URL}{endpoint}", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print_success(f"{name}: 正常")
                else:
                    issues.append(f"{name}: API返回失败")
                    print_error(f"{name}: API返回失败")
            else:
                issues.append(f"{name}: HTTP {response.status_code}")
                print_error(f"{name}: HTTP {response.status_code}")
        except Exception as e:
            issues.append(f"{name}: {str(e)}")
            print_error(f"{name}: {str(e)}")

    return len(issues) == 0, issues

def check_data_consistency():
    """检查数据一致性"""
    print_header("🔄 数据一致性检查")

    try:
        # 获取所有活动
        response = requests.get(f"{API_URL}/activities", timeout=5)
        if response.status_code != 200:
            print_error("无法获取活动数据")
            return False, ["无法获取活动数据"]

        data = response.json()
        activities = data.get('data', [])

        # 检查数据格式
        valid_count = 0
        issues = []

        for activity in activities[:5]:  # 只检查前5条
            # 必要字段检查
            required_fields = ['id', 'title']
            missing = [f for f in required_fields if not activity.get(f)]

            if missing:
                issues.append(f"活动缺少字段: {', '.join(missing)}")
            else:
                valid_count += 1

        if valid_count > 0:
            print_success(f"数据格式检查通过 ({valid_count}/{min(5, len(activities))})")
            return True, []
        else:
            print_error("数据格式检查失败")
            return False, issues

    except Exception as e:
        print_error(f"数据一致性检查异常: {str(e)}")
        return False, [str(e)]

def suggest_fixes(issues):
    """提供修复建议"""
    if not issues:
        return

    print_header("💡 修复建议")

    for issue in issues:
        if '主页' in issue:
            print_info(f"• {issue}")
            print_info("  建议: 检查 src/pages/Home.jsx 和 src/App.jsx")
        elif '日历' in issue:
            print_info(f"• {issue}")
            print_info("  建议: 检查 src/pages/Schedule.jsx")
        elif '管理后台' in issue:
            print_info(f"• {issue}")
            print_info("  建议: 检查 admin.html 和相关脚本")
        elif 'API' in issue:
            print_info(f"• {issue}")
            print_info("  建议: 检查 server.js 和后端服务状态")
        else:
            print_info(f"• {issue}")

def generate_report(test_results):
    """生成测试报告"""
    print_header("📊 测试报告")

    total_tests = len(test_results)
    passed_tests = sum(1 for r in test_results if r['passed'])
    failed_tests = total_tests - passed_tests

    all_issues = []
    for result in test_results:
        all_issues.extend(result.get('issues', []))

    print(f"总测试数: {total_tests}")
    print(f"{Colors.GREEN}通过: {passed_tests}{Colors.END}")
    print(f"{Colors.RED}失败: {failed_tests}{Colors.END}")
    print(f"成功率: {passed_tests/total_tests*100:.1f}%")

    if failed_tests == 0:
        print_success("\n🎉 所有测试通过！系统运行正常！")
        print_info("✅ 主页功能正常")
        print_info("✅ 日历页面功能正常")
        print_info("✅ 管理后台功能正常")
        print_info("✅ API端点正常")
        print_info("✅ 数据一致性良好")
    else:
        print_error(f"\n⚠️  有 {failed_tests} 个测试失败")
        suggest_fixes(all_issues)

    print("\n" + "="*60)
    print(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)

    return failed_tests == 0

def main():
    """主测试流程"""
    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║      🏝️ Chiengmai Activities - 增强版自动化测试              ║")
    print("║      主页功能验证 + 自动修复建议                               ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    print_info(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"前端地址: {BASE_URL}")
    print_info(f"后端地址: {API_URL}")

    results = []

    # 测试1: 主页功能
    passed, issues = test_homepage_features()
    results.append({
        'name': '主页功能',
        'passed': passed,
        'issues': issues
    })

    # 测试2: 日历页面功能
    passed, issues = test_calendar_features()
    results.append({
        'name': '日历页面功能',
        'passed': passed,
        'issues': issues
    })

    # 测试3: 管理后台功能
    passed, issues = test_admin_features()
    results.append({
        'name': '管理后台功能',
        'passed': passed,
        'issues': issues
    })

    # 测试4: API端点
    passed, issues = test_api_endpoints()
    results.append({
        'name': 'API端点',
        'passed': passed,
        'issues': issues
    })

    # 测试5: 数据一致性
    passed, issues = check_data_consistency()
    results.append({
        'name': '数据一致性',
        'passed': passed,
        'issues': issues
    })

    # 生成报告
    all_passed = generate_report(results)

    return 0 if all_passed else 1

if __name__ == '__main__':
    exit(main())
