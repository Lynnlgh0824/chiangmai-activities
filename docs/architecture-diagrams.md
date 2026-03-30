# Chiengmai 项目架构图

> **生成时间**: 2026-02-27
> **项目版本**: v2.0.0

---

## 🏗️ 系统整体架构

```mermaid
graph TB
    subgraph "用户层"
        U1[前台用户]
        U2[管理员]
    end

    subgraph "前端层"
        FE1[index.html<br/>活动展示]
        FE2[admin.html<br/>管理后台]
        FE3[调试工具]
    end

    subgraph "API层"
        API1[GET /api/activities<br/>获取活动列表]
        API2[POST /api/activities<br/>创建活动]
        API3[PUT /api/activities/:id<br/>更新活动]
        API4[DELETE /api/activities/:id<br/>删除活动]
        API5[POST /api/upload<br/>图片上传]
    end

    subgraph "业务逻辑层"
        BL1[数据验证模块]
        BL2[状态管理模块]
        BL3[图片处理模块]
        BL4[搜索过滤模块]
    end

    subgraph "数据层"
        DB1[(items.json<br/>活动数据)]
        DB2[(guide.json<br/>指南数据)]
        DB3[(LocalStorage<br/>缓存)]
        BK[自动备份系统]
    end

    subgraph "外部服务"
        S1[小红书爬虫<br/>Puppeteer]
        S2[Excel 导入导出<br/>XLSX]
        S3[飞书集成]
    end

    U1 --> FE1
    U2 --> FE2
    FE1 --> API1
    FE2 --> API2
    FE2 --> API3
    FE2 --> API4
    FE2 --> API5

    API1 --> BL1
    API2 --> BL1
    API3 --> BL2
    API4 --> BL2
    API5 --> BL3

    BL1 --> DB1
    BL2 --> DB1
    BL3 --> DB1
    BL4 --> DB1

    DB1 --> BK
    S1 --> DB1
    S2 --> DB1
```

---

## 🔄 数据流向图

```mermaid
sequenceDiagram
    participant User as 👤 用户
    participant UI as 🖼️ 前端界面
    participant API as 🔄 Express API
    participant Validator as ✅ 数据验证
    participant DB as 💾 JSON 数据库
    participant Backup as 📦 备份系统

    User->>UI: 查看活动列表
    UI->>API: GET /api/activities
    API->>DB: 读取 items.json
    DB-->>API: 返回数据
    API-->>UI: JSON 响应
    UI-->>User: 渲染活动列表

    User->>UI: 创建新活动
    UI->>API: POST /api/activities
    API->>Validator: 验证数据
    Validator-->>API: 验证通过
    API->>DB: 写入 items.json
    DB->>Backup: 触发自动备份
    Backup-->>DB: 备份完成
    API-->>UI: 保存成功
    UI-->>User: 显示成功提示
```

---

## 🎯 模块依赖关系

```mermaid
graph LR
    subgraph "前端模块"
        M1[活动展示模块]
        M2[管理后台模块]
        M3[搜索过滤模块]
        M4[状态管理模块]
    end

    subgraph "后端模块"
        M5[路由处理]
        M6[数据验证]
        M7[文件上传]
        M8[爬虫系统]
    end

    subgraph "数据模块"
        M9[JSON 存储]
        M10[备份系统]
        M11[Excel 导入导出]
    end

    M1 --> M3
    M1 --> M4
    M2 --> M5
    M3 --> M5
    M4 --> M5

    M5 --> M6
    M5 --> M7
    M5 --> M8

    M6 --> M9
    M7 --> M9
    M8 --> M9

    M9 --> M10
    M9 --> M11
```

---

## 🎨 UI 组件结构

```mermaid
graph TB
    subgraph "前台 (index.html)"
        UI1[导航栏]
        UI2[搜索栏]
        UI3[分类标签]
        UI4[活动卡片列表]
        UI5[活动详情弹窗]
    end

    subgraph "后台 (admin.html)"
        UI6[活动列表表格]
        UI7[编辑表单]
        UI8[图片上传区]
        UI9[状态切换按钮]
        UI10[保存/发布按钮]
    end

    UI1 --> UI2
    UI1 --> UI3
    UI2 --> UI4
    UI4 --> UI5

    UI6 --> UI7
    UI7 --> UI8
    UI7 --> UI9
    UI7 --> UI10
```

---

## 🔐 状态机流程

```mermaid
stateDiagram-v2
    [*] --> 草稿
    草稿 --> 待审核: 提交审核
    待审核 --> 进行中: 审核通过
    待审核 --> 草稿: 审核拒绝
    进行中 --> 已结束: 活动结束
    进行中 --> 已暂停: 暂停活动
    已暂停 --> 进行中: 恢复活动
    已结束 --> [*]
    草稿 --> [*]: 删除
```

---

**使用说明**：

1. **在 GitHub/GitLab 中查看**：直接复制代码到 Markdown 文件，平台会自动渲染
2. **在 VS Code 中查看**：安装 "Markdown Preview Mermaid Support" 插件
3. **导出为图片**：使用 Mermaid Live Editor (https://mermaid.live) 导出 PNG/SVG

---

**文档版本**: v1.0.0
**生成工具**: Claude Code
**最后更新**: 2026-02-27
