#!/bin/bash

################################################################################
# 每日自动提交脚本（安全版本）
# 功能：每天0点自动检查代码变更、运行测试、提交到dev分支
# 安全机制：不直接推送到main，而是推送到dev分支
################################################################################

set -e

PROJECT_DIR="/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai"
LOG_DIR="$PROJECT_DIR/logs"
LOG_FILE="$LOG_DIR/daily-auto-commit-safe-$(date '+%Y%m%d').log"
COMMIT_MSG_PREFIX="auto: 每日自动提交"
TARGET_BRANCH="dev"  # 推送到dev分支，而不是main

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================================
# 日志函数
# ============================================================

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

# ============================================================
# 初始化
# ============================================================

init() {
    log "=========================================="
    log "每日自动提交脚本启动（安全版本）"
    log "=========================================="

    mkdir -p "$LOG_DIR"
    cd "$PROJECT_DIR" || {
        error "无法切换到项目目录: $PROJECT_DIR"
        exit 1
    }

    log "工作目录: $PROJECT_DIR"
    log "目标分支: $TARGET_BRANCH"
    log "日志文件: $LOG_FILE"
}

# ============================================================
# 检查Git状态
# ============================================================

check_git_status() {
    log "----------------------------------------"
    log "检查Git状态"
    log "----------------------------------------"

    if git diff --quiet && git diff --cached --quiet; then
        log "✅ 没有未提交的更改"
        return 1
    else
        log "⚠️  发现未提交的更改"
        git status --short | tee -a "$LOG_FILE"
        return 0
    fi
}

# ============================================================
# 检查并创建dev分支
# ============================================================

ensure_dev_branch() {
    log "----------------------------------------"
    log "检查dev分支"
    log "----------------------------------------"

    # 检查dev分支是否存在
    if git rev-parse --verify "$TARGET_BRANCH" >/dev/null 2>&1; then
        log "✅ $TARGET_BRANCH 分支已存在"
    else
        info "创建 $TARGET_BRANCH 分支..."
        git checkout -b "$TARGET_BRANCH" || {
            error "无法创建 $TARGET_BRANCH 分支"
            exit 1
        }
        log "✅ $TARGET_BRANCH 分支创建成功"
    fi

    # 切换到dev分支
    git checkout "$TARGET_BRANCH" 2>/dev/null || {
        warn "无法切换到 $TARGET_BRANCH 分支，可能是因为有未提交的更改"
    }
}

# ============================================================
# 运行测试
# ============================================================

run_tests() {
    log "----------------------------------------"
    log "运行测试"
    log "----------------------------------------"

    local tests_passed=0
    local tests_failed=0

    # 测试1: 音乐Tab测试
    log "运行音乐Tab测试..."
    if [ -f "test-music-tab.cjs" ]; then
        if node test-music-tab.cjs >> "$LOG_FILE" 2>&1; then
            log "✅ 音乐Tab测试通过"
            ((tests_passed++))
        else
            error "❌ 音乐Tab测试失败"
            ((tests_failed++))
        fi
    else
        warn "test-music-tab.cjs 不存在，跳过"
    fi

    # 测试2: 检查时间排序函数
    log "检查时间排序函数..."
    if grep -q "function compareTimes" public/index.html; then
        log "✅ compareTimes函数存在"
        ((tests_passed++))
    else
        error "❌ compareTimes函数不存在"
        ((tests_failed++))
    fi

    if grep -q "function extractEndTime" public/index.html; then
        log "✅ extractEndTime函数存在"
        ((tests_passed++))
    else
        error "❌ extractEndTime函数不存在"
        ((tests_failed++))
    fi

    # 测试3: 检查音乐Tab
    log "检查音乐Tab..."
    local music_tab_count=$(grep -c "音乐" public/index.html || true)
    if [ "$music_tab_count" -gt 10 ]; then
        log "✅ 音乐Tab存在 ($music_tab_count 处引用)"
        ((tests_passed++))
    else
        error "❌ 音乐Tab可能缺失 ($music_tab_count 处引用)"
        ((tests_failed++))
    fi

    log "测试结果: $tests_passed 通过, $tests_failed 失败"

    if [ $tests_failed -gt 0 ]; then
        error "有测试失败，跳过自动提交"
        return 1
    fi

    return 0
}

# ============================================================
# 生成提交信息
# ============================================================

generate_commit_message() {
    local msg="$COMMIT_MSG_PREFIX - $(date '+%Y-%m-%d %H:%M')"

    msg+="

⚠️ 这是自动提交到 $TARGET_BRANCH 分支
⚠️ 请审查后再合并到 main 分支

自动提交的更改:
"

    local changed_files=$(git status --short | awk '{print $2}')
    for file in $changed_files; do
        case "$file" in
            public/index.html)
                msg+="✓ 主应用文件更新
"
                ;;
            *.md)
                msg+="✓ 文档更新: $(basename $file)
"
                ;;
            test-*.html|test-*.cjs)
                msg+="✓ 测试文件更新: $(basename $file)
"
                ;;
            *)
                msg+="✓ $file
"
                ;;
        esac
    done

    msg+="

测试状态: 所有测试通过
触发方式: 定时任务（每天0点）
目标分支: $TARGET_BRANCH（安全分支）

📋 下一步:
1. 查看更改: git diff main...$TARGET_BRANCH
2. 测试功能: 访问 http://localhost:3000
3. 审查代码: 确认没有问题
4. 合并到main: git checkout main && git merge $TARGET_BRANCH
"

    echo "$msg"
}

# ============================================================
# 提交更改
# ============================================================

commit_changes() {
    log "----------------------------------------"
    log "提交更改到 $TARGET_BRANCH 分支"
    log "----------------------------------------"

    # 确保在dev分支
    ensure_dev_branch

    # 生成提交信息
    local commit_msg=$(generate_commit_message)

    log "提交信息:"
    echo "$commit_msg" | tee -a "$LOG_FILE"

    # 添加所有更改
    log "添加文件到暂存区..."
    git add -A

    # 提交
    log "创建提交..."
    if git commit -m "$commit_msg"; then
        log "✅ 提交成功"

        # 推送到远程dev分支
        log "推送到远程 $TARGET_BRANCH 分支..."
        if git push origin "$TARGET_BRANCH"; then
            log "✅ 推送到 $TARGET_BRANCH 分支成功"
            info "⚠️ 代码已提交到 $TARGET_BRANCH 分支，请审查后再合并到 main"
            return 0
        else
            error "❌ 推送到 $TARGET_BRANCH 分支失败"
            return 1
        fi
    else
        error "❌ 提交失败"
        return 1
    fi
}

# ============================================================
# 生成每日报告
# ============================================================

generate_daily_report() {
    log "----------------------------------------"
    log "生成每日报告"
    log "----------------------------------------"

    local report_file="$LOG_DIR/daily-report-safe-$(date '+%Y%m%d').md"

    cat > "$report_file" << EOF
# 每日自动提交报告（安全版本）

**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')
**触发方式**: 定时任务（每天0点）
**目标分支**: $TARGET_BRANCH（安全分支）

---

## ⚠️ 重要提醒

此自动提交已推送到 **$TARGET_BRANCH** 分支，**不是 main 分支**。

**请手动审查后再合并到 main**！

---

## 📊 代码状态

### Git状态
\`\`\`
$(git status --short)
\`\`\`

### 最新提交
- **Commit**: $(git log -1 --pretty=format:'%h')
- **分支**: $TARGET_BRANCH
- **消息**: $(git log -1 --pretty=format:'%s')
- **作者**: $(git log -1 --pretty=format:'%an')
- **时间**: $(git log -1 --pretty=format:'%ad')

---

## ✅ 测试结果

### 功能检查
- ✅ compareTimes函数: $(grep -q "function compareTimes" public/index.html && echo "存在" || echo "缺失")
- ✅ extractEndTime函数: $(grep -q "function extractEndTime" public/index.html && echo "存在" || echo "缺失")
- ✅ 音乐Tab: $(grep -c "音乐" public/index.html || echo "0") 处引用

---

## 📝 下一步操作

### 1. 查看更改
\`\`\`bash
# 查看main和$TARGET_BRANCH分支的差异
git diff main...$TARGET_BRANCH

# 或查看最近的提交
git log main..$TARGET_BRANCH --oneline
\`\`\`

### 2. 测试功能
访问以下页面测试功能：
- 主应用: http://localhost:3000
- 排序测试: http://localhost:3000/test-time-sorting.html

### 3. 审查代码
确认：
- [ ] 代码更改正确
- [ ] 功能测试通过
- [ ] 没有引入新的bug
- [ ] 文档已更新（如果需要）

### 4. 合并到main（如果确认无误）
\`\`\`bash
# 切换到main分支
git checkout main

# 合并$TARGET_BRANCH分支
git merge $TARGET_BRANCH

# 推送到远程
git push origin main

# 删除$TARGET_BRANCH分支（可选）
git branch -d $TARGET_BRANCH
git push origin --delete $TARGET_BRANCH
\`\`\`

### 5. 如果有问题
\`\`\`bash
# 拒绝合并，保留$TARGET_BRANCH分支进行修复
git checkout $TARGET_BRANCH
# 修复问题...
git add .
git commit -m "fix: 修复自动提交中的问题"
git push origin $TARGET_BRANCH
\`\`\`

---

## 🔗 相关链接

- **GitHub**: [查看$TARGET_BRANCH分支](https://github.com/Lynnlgh0824/Chiengmai/tree/$TARGET_BRANCH)
- **Pull Request**: [创建PR合并到main](https://github.com/Lynnlgh0824/Chiengmai/compare/main...$TARGET_BRANCH)
- **测试页面**: http://localhost:3000/test-time-sorting.html

---

**报告生成**: 自动化脚本（安全版本）
**日志文件**: \`$LOG_FILE\`
**目标分支**: \`$TARGET_BRANCH\`（安全分支，不是main）
EOF

    log "报告已生成: $report_file"
}

# ============================================================
# 主流程
# ============================================================

main() {
    init

    if ! check_git_status; then
        log "没有需要提交的更改，脚本结束"
        generate_daily_report
        exit 0
    fi

    if ! run_tests; then
        error "测试失败，跳过自动提交"
        exit 1
    fi

    if commit_changes; then
        generate_daily_report
        log "=========================================="
        log "✅ 每日自动提交完成"
        log "⚠️  代码已提交到 $TARGET_BRANCH 分支"
        log "⚠️  请审查后再合并到 main 分支"
        log "=========================================="
        exit 0
    else
        error "提交失败"
        exit 1
    fi
}

trap 'error "脚本执行失败 (行号: $LINENO)"' ERR
main
