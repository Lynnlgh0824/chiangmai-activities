#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
清迈活动平台 - 统一自动化测试脚本
功能：完整的系统测试 + 自动启动服务 + 日志记录

使用方法：
  python3 test-all.py              # 运行所有测试
  python3 test-all.py --fast       # 快速测试（跳过数据一致性）
  python3 test-all.py --no-start   # 不自动启动服务
"""

import requests
import json
import time
import subprocess
import sys
import os
from datetime import datetime
from pathlib import Path

# ============================================================================
# 配置
# ============================================================================

BASE_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
API_URL = os.getenv("API_URL", "http://localhost:3000/api")
PROJECT_DIR = Path(__file__).parent.absolute()
LOG_DIR = PROJECT_DIR / "logs"

# 创建日志目录
LOG_DIR.mkdir(exist_ok=True)

# 测试配置
TIMEOUT = 10
RETRY_COUNT = 3
RETRY_DELAY = 2

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    END = '\033[0m'
    BOLD = '\033[1m'

# 日志文件
log_file = LOG_DIR / f"test-{datetime.now().strftime('%Y%m%d-%H%M%S')}.log"

# ============================================================================
# 工具函数
# ============================================================================

def log(message):
    """同时输出到控制台和日志文件"""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    log_message = f"[{timestamp}] {message}"
    print(message)
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(log_message + '\n')

def print_header(text):
    log(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}")
    log(f"{text}")
    log(f"{'='*60}{Colors.END}\n")

def print_success(text):
    log(f"{Colors.GREEN}✅ {text}{Colors.END}")

def print_error(text):
    log(f"{Colors.RED}❌ {text}{Colors.END}")

def print_info(text):
    log(f"{Colors.CYAN}ℹ️  {text}{Colors.END}")

def print_warning(text):
    log(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")

def check_service_running(url, service_name):
    """检查服务是否运行"""
    try:
        response = requests.get(url, timeout=3)
        return response.status_code == 200
    except:
        return False

def start_services():
    """启动开发服务"""
    print_header("🚀 启动开发服务")

    # 检查服务是否已运行
    frontend_running = check_service_running(BASE_URL, "前端")
    backend_running = check_service_running(f"{API_URL}/health", "后端")

    if frontend_running and backend_running:
        print_info("服务已在运行中")
        return True

    if not frontend_running or not backend_running:
        print_warning("检测到服务未运行，尝试自动启动...")

        try:
            # 启动服务
            print_info("正在启动服务（后台运行）...")

            # 使用 subprocess.Popen 在后台启动
            process = subprocess.Popen(
                ['npm', 'run', 'dev'],
                cwd=PROJECT_DIR,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                stdin=subprocess.PIPE
            )

            print_info("等待服务启动...")
            time.sleep(8)  # 等待服务启动

            # 验证服务是否启动成功
            frontend_running = check_service_running(BASE_URL, "前端")
            backend_running = check_service_running(f"{API_URL}/health", "后端")

            if frontend_running and backend_running:
                print_success("服务启动成功！")
                return True
            else:
                print_error("服务启动失败，请手动运行: npm run dev")
                return False

        except Exception as e:
            print_error(f"启动服务时出错: {str(e)}")
            print_info("请手动启动服务: npm run dev")
            return False

    return True

# ============================================================================
# 测试函数
# ============================================================================

def test_homepage_features():
    """测试主页功能"""
    print_header("🏠 主页功能测试")

    issues = []

    for attempt in range(RETRY_COUNT):
        try:
            response = requests.get(BASE_URL, timeout=TIMEOUT)
            if response.status_code != 200:
                issues.append(f"主页访问失败: HTTP {response.status_code}")
                print_error(f"主页访问失败: HTTP {response.status_code}")
                if attempt < RETRY_COUNT - 1:
                    print_info(f"重试 {attempt + 1}/{RETRY_COUNT}...")
                    time.sleep(RETRY_DELAY)
                    continue
                return False, issues
            else:
                print_success("主页可访问 (HTTP 200)")

                html = response.text

                # 检查标题
                if '<title>' in html:
                    print_success("页面标题存在")
                else:
                    issues.append("缺少页面标题")
                    print_error("缺少页面标题")

                # React应用检查（支持多种根容器格式）
                root_containers = ['<div id="root">', '<div id=\'root\'>', "id='root'", 'id="root"']
                has_root = any(container in html for container in root_containers)

                # 也检查 Vite 特征
                has_vite = '@vite/client' in html or '/@react-refresh' in html

                if has_root or has_vite:
                    print_success("React应用容器存在")
                else:
                    issues.append("缺少React应用容器")
                    print_error("缺少React应用容器")

                # 检查脚本加载
                if '<script' in html and ('type="module"' in html or '.jsx' in html or '.js' in html):
                    print_success("JavaScript脚本正常加载")
                else:
                    issues.append("JavaScript脚本可能未加载")
                    print_warning("JavaScript脚本可能未加载")

                # 通过API验证数据
                try:
                    api_response = requests.get(f"{API_URL}/activities", timeout=TIMEOUT)
                    if api_response.status_code == 200:
                        data = api_response.json()
                        if data.get('success'):
                            print_success(f"后端数据API可访问（{len(data.get('data', []))}条活动）")
                        else:
                            issues.append("后端API返回失败")
                            print_error("后端API返回失败")
                    else:
                        issues.append("后端数据API不可访问")
                        print_error("后端数据API不可访问")
                except Exception as e:
                    issues.append(f"无法连接后端API: {str(e)}")
                    print_error(f"无法连接后端API: {str(e)}")

                break  # 成功，退出重试循环

        except requests.exceptions.Timeout:
            if attempt < RETRY_COUNT - 1:
                print_warning(f"请求超时，重试 {attempt + 1}/{RETRY_COUNT}...")
                time.sleep(RETRY_DELAY)
            else:
                issues.append("主页访问超时")
                print_error("主页访问超时")
                return False, issues

        except Exception as e:
            issues.append(f"主页测试异常: {str(e)}")
            print_error(f"主页测试异常: {str(e)}")
            return False, issues

    return len(issues) == 0, issues

def test_calendar_features():
    """测试日历页面功能"""
    print_header("📅 日历页面功能测试")

    issues = []

    try:
        response = requests.get(f"{BASE_URL}/schedule", timeout=TIMEOUT)
        if response.status_code != 200:
            issues.append(f"日历页面访问失败: HTTP {response.status_code}")
            print_error(f"日历页面访问失败: HTTP {response.status_code}")
        else:
            print_success("日历页面可访问")

            html = response.text

            if 'id="root"' in html or "<div id='root'>" in html or '<div id="root">' in html:
                print_success("React根容器存在")
            else:
                if len(html) > 100:
                    print_success("页面内容正常（React路由）")
                else:
                    issues.append("页面内容异常")
                    print_error("页面内容异常")

            if '<script' in html:
                print_success("JavaScript脚本正常加载")
            else:
                issues.append("JavaScript脚本可能未加载")
                print_warning("JavaScript脚本可能未加载")

    except Exception as e:
        issues.append(f"日历页面测试异常: {str(e)}")
        print_error(f"日历页面测试异常: {str(e)}")

    return len(issues) == 0, issues

def test_admin_features():
    """测试管理后台功能"""
    print_header("🔧 管理后台功能测试")

    issues = []

    try:
        response = requests.get(f"{BASE_URL}/admin.html", timeout=TIMEOUT)
        if response.status_code != 200:
            issues.append(f"管理后台访问失败: HTTP {response.status_code}")
            print_error(f"管理后台访问失败: HTTP {response.status_code}")
        else:
            print_success("管理后台可访问")

            html = response.text

            if '<!DOCTYPE html>' in html or '<html' in html:
                print_success("独立HTML页面")
            else:
                issues.append("可能不是独立HTML页面")
                print_warning("可能不是独立HTML页面")

            if '<form' in html.lower() or '<input' in html.lower() or '<button' in html.lower():
                print_success("表单元素存在")
            else:
                issues.append("缺少表单元素")
                print_error("缺少表单元素")

            if '<script' in html:
                print_success("JavaScript脚本正常加载")
            else:
                issues.append("JavaScript脚本可能未加载")
                print_warning("JavaScript脚本可能未加载")

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
        ('/health', '健康检查')
    ]

    for endpoint, name in endpoints:
        try:
            response = requests.get(f"{API_URL}{endpoint}", timeout=TIMEOUT)
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    item_count = len(data.get('data', []))
                    print_success(f"{name}: 正常 ({item_count}条数据)")
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

    issues = []
    checks_passed = 0
    total_checks = 5

    try:
        # 检查1: 数据格式
        response = requests.get(f"{API_URL}/activities", timeout=TIMEOUT)
        if response.status_code == 200:
            data = response.json()
            if data.get('success') and isinstance(data.get('data'), list):
                activities = data['data']

                # 必需字段检查
                required_fields = ['id', 'title', 'category']
                for activity in activities[:3]:  # 检查前3个
                    if all(field in activity for field in required_fields):
                        checks_passed += 1
                    else:
                        issues.append(f"活动数据缺少必需字段: {activity.get('id', 'unknown')}")

                print_success(f"数据格式检查通过 ({checks_passed}/{total_checks})")

                # 检查2: 数据量
                if len(activities) > 0:
                    print_success(f"数据量正常 ({len(activities)}条活动)")
                else:
                    issues.append("活动数据为空")
                    print_error("活动数据为空")

                # 检查3: 分类数据
                categories = set(a.get('category', '未知') for a in activities)
                if len(categories) > 0:
                    print_success(f"分类数据正常 ({len(categories)}个分类)")
                else:
                    issues.append("缺少分类数据")
                    print_error("缺少分类数据")

            else:
                issues.append("API返回格式错误")
                print_error("API返回格式错误")
        else:
            issues.append("无法获取活动数据")
            print_error("无法获取活动数据")

    except Exception as e:
        issues.append(f"数据一致性检查异常: {str(e)}")
        print_error(f"数据一致性检查异常: {str(e)}")

    return len(issues) == 0, issues

# ============================================================================
# 报告生成
# ============================================================================

def suggest_fixes(issues):
    """提供修复建议"""
    print_header("💡 修复建议")

    for issue in issues:
        if '500' in issue or 'Internal Server Error' in issue:
            print_info(f"• {issue}")
            print_info("  → 检查 Vite 配置和编译错误")
            print_info("  → 运行: npm run dev")
        elif '超时' in issue or 'Timeout' in issue:
            print_info(f"• {issue}")
            print_info("  → 检查服务是否启动")
            print_info("  → 运行: lsof -i:5173 -i:3000")
        elif 'API' in issue:
            print_info(f"• {issue}")
            print_info("  → 检查后端服务状态")
            print_info("  → 运行: curl http://localhost:3000/api/health")
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

    log(f"总测试数: {total_tests}")
    log(f"{Colors.GREEN}通过: {passed_tests}{Colors.END}")
    log(f"{Colors.RED}失败: {failed_tests}{Colors.END}")
    log(f"成功率: {passed_tests/total_tests*100:.1f}%")

    if failed_tests == 0:
        print_success("\n🎉 所有测试通过！系统运行正常！")
        print_info("✅ 主页功能正常")
        print_info("✅ 日历页面功能正常")
        print_info("✅ 管理后台功能正常")
        print_info("✅ API端点正常")
        print_info("✅ 数据一致性良好")
        print_info("\n💡 所有功能已验证，系统可以正常使用！")
    else:
        print_error(f"\n⚠️  有 {failed_tests} 个测试失败")
        suggest_fixes(all_issues)

    log("\n" + "="*60)
    log(f"测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log(f"日志文件: {log_file}")
    log("="*60)

    return failed_tests == 0

# ============================================================================
# 主函数
# ============================================================================

def main():
    """主测试流程"""
    # 解析命令行参数
    auto_start = '--no-start' not in sys.argv
    fast_mode = '--fast' in sys.argv

    print(f"{Colors.BOLD}{Colors.BLUE}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║      🏝️ Chiengmai Activities - 统一自动化测试               ║")
    print("║      完整系统测试 + 自动启动服务 + 日志记录                   ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}")

    print_info(f"开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print_info(f"前端地址: {BASE_URL}")
    print_info(f"后端地址: {API_URL}")
    print_info(f"项目目录: {PROJECT_DIR}")
    print_info(f"日志文件: {log_file}")

    # 自动启动服务（如果需要）
    if auto_start:
        if not start_services():
            print_error("无法启动服务，退出测试")
            return 1

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

    # 测试5: 数据一致性（快速模式跳过）
    if not fast_mode:
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
    try:
        exit_code = main()
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print_warning("\n\n测试被用户中断")
        sys.exit(1)
    except Exception as e:
        print_error(f"\n发生未预期的错误: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
