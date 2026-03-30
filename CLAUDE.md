# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Identity

**Project Name:** Chiengmai Activities Platform (清迈活动策划管理系统)

This is an **independent project**.

Claude must **NEVER** reference files, code, or context from other projects.

Claude must **ONLY** operate within this directory (`/Users/yuzhoudeshengyin/Documents/my_project/Chiengmai/`).

---

## Architecture Rules

Claude MUST **NOT**:
- Modify folder structure without permission
- Rename files without permission
- Move files without permission
- Delete files without permission

Claude MUST:
- Preserve existing structure
- Follow established patterns
- Extend code without breaking structure

---

## Memory Scope

Claude memory is **LIMITED** to this project directory.

Do **NOT** assume context from:
- Other folders in `/Users/yuzhoudeshengyin/Documents/my_project/`
- Other repositories
- Other projects

---

## Coding Rules

Before coding, Claude must:
1. Read `README.md`
2. Read architecture
3. Follow existing patterns

---

## Workflow Rules

⚠️ **CRITICAL**: Every task MUST follow this workflow:

### Step 1: Understand (Required)
- Rephrase the requirement in your own words
- Identify constraints and boundaries
- Check related docs (memory/, docs/)
- **Output**: "我理解您的需求是..." (confirm understanding)

### Step 2: Design (Required)
- Analyze possible solutions
- Identify risks and dependencies
- Create execution plan
- **Output**: Show complete plan with rationale

### Step 3: Confirm (Required)
- Present the plan to user
- Explain why this approach
- List potential risks
- **WAIT**: Do NOT execute until user approves

### Step 4: Execute (After Approval)
- Follow the approved plan
- Verify each step
- Update relevant docs

### ⛔ Forbidden
- ❌ Execute without showing plan
- ❌ Assume understanding
- ❌ Skip risk assessment

### ✅ Required
- ✅ Rephrase requirements
- ✅ Show complete plan
- ✅ Wait for approval
- ✅ Consider long-term impact

**See**: `docs/WORKFLOW.md` for detailed guide

---

## Safety Rule

If unsure, Claude must **ASK** instead of modifying.

---

## Git Rule

Claude must **NEVER**:
- Expose secrets
- Commit `.env`
- Commit private keys

---

## Project Overview

Chiengmai Activities Platform is an event planning management system built with Express.js, providing comprehensive event management tools with Feishu (Lark) integration.

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 4.x
- **Dev Tool**: Nodemon for development

## Project Structure

```
Chiengmai/
├── server.js              # Main application entry point
├── config/                # Configuration files
├── docs/                  # Documentation
├── memory/                # Project memory system
└── tests/                 # Test files
```

## Getting Started

1. Install dependencies: `npm install`
2. Start in development: `npm run dev`
3. Server will be available at `http://localhost:3000`

---

**Last Updated**: 2026-02-27
