#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chiengmai 项目自动化浏览器测试
使用 Playwright 自动打开浏览器并验证页面
"""

import asyncio
import subprocess
import sys
from datetime import datetime
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

# 配置
FRONTEND_URL = "http://localhost:5173"
ADMIN_URL = "http://localhost:5173/admin.html"
API_URL = "http://localhost:3000/api/health"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
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
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")

def test_with_curl():
    """使用 curl 快速测试（不需要浏览器）"""
    print_header("🌐 快速访问测试 (Curl)")

    import requests

    tests_passed = 0
    tests_failed = 0

    test_urls = [
        (FRONTEND_URL, "前端主页"),
        (ADMIN_URL, "管理页面"),
        (API_URL, "后端 API"),
    ]

    for url, name in test_urls:
        print(f"\n🔍 测试: {name}")
        print(f"   URL: {url}")

        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print_success(f"{name} 可访问 (HTTP {response.status_code})")

                # 检查内容
                if 'html' in response.headers.get('content-type', '').lower():
                    content = response.text
                    if '清迈活动' in content:
                        print_success("   标题验证通过")

                tests_passed += 1
            else:
                print_error(f"{name} 返回异常状态 (HTTP {response.status_code})")
                tests_failed += 1
        except requests.exceptions.RequestException as e:
            print_error(f"{name} 无法访问: {str(e)}")
            tests_failed += 1

    return tests_passed, tests_failed

def test_with_playwright():
    """使用 Playwright 自动打开浏览器测试"""
    if not PLAYWRIGHT_AVAILABLE:
        print_info("Playwright 未安装，跳过浏览器测试")
        return 0, 0

    print_header("🌐 浏览器自动化测试 (Playwright)")

    passed = 0
    failed = 0

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)  # 无头模式，不显示浏览器窗口

        try:
            # 测试前端主页
            print_info("测试前端主页...")
            page = browser.new_page()
            page.goto(FRONTEND_URL, timeout=10000)

            # 等待页面加载
            page.wait_for_load_state('load', timeout=10000)

            # 验证标题
            title = page.title()
            if '清迈' in title or '活动' in title:
                print_success(f"前端主页加载成功 - 标题: {title}")
                passed += 1
            else:
                print_error(f"前端主页标题异常: {title}")
                failed += 1

            # 截图
            screenshot_path = Path("logs") / f"homepage-{datetime.now().strftime('%Y%m%d-%H%M%S')}.png"
            screenshot_path.parent.mkdir(exist_ok=True)
            page.screenshot(path=str(screenshot_path))
            print_info(f"截图已保存: {screenshot_path}")

            page.close()

        except PlaywrightTimeoutError as e:
            print_error(f"前端主页加载超时: {str(e)}")
            failed += 1
        except Exception as e:
            print_error(f"前端主页测试失败: {str(e)}")
            failed += 1

        browser.close()

    return passed, failed

def main():
    """主测试函数"""
    print_header("🌐 Chiengmai 自动化浏览器访问测试")
    print(f"⏰ 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    total_passed = 0
    total_failed = 0

    # 1. Curl 快速测试
    curl_passed, curl_failed = test_with_curl()
    total_passed += curl_passed
    total_failed += curl_failed

    # 2. Playwright 浏览器测试（可选）
    if PLAYWRIGHT_AVAILABLE:
        playwright_passed, playwright_failed = test_with_playwright()
        total_passed += playwright_passed
        total_failed += playwright_failed

    # 生成报告
    print_header("📊 测试报告")
    print(f"⏰ 完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print(f"✅ 通过: {total_passed}")
    print(f"❌ 失败: {total_failed}")
    print()

    if total_failed == 0:
        print_success("🎉 所有测试通过！系统运行正常！")
        print()
        print("🌐 访问地址:")
        print(f"   主页: {FRONTEND_URL}")
        print(f"   管理: {ADMIN_URL}")
        print(f"   API:  {API_URL}")
        return 0
    else:
        print_error(f"⚠️  有 {total_failed} 个测试失败")
        print()
        print("💡 建议操作:")
        print("   1. 检查服务: npm run dev")
        print("   2. 重启服务: ./restart-fixed.sh")
        print("   3. 查看日志: cat logs/auto-browser-*.log")
        return 1

if __name__ == "__main__":
    sys.exit(main())
