---
type: topic
scope: cross-repo
status: active
created: 2026-08-21
updated: 2026-08-21
---

# 應用範本 (App Template) 清理與開發起點規格

本文件記錄 `appspine-app-template` 的核心架構清理成果與開發起點規格。

---

## 一、 範本定位與結構

`appspine-app-template` 作為所有新增業務 App（如人資、 Wiki、日曆等）的統一骨架。新 App 通過 `git clone` 或「Use this template」獲取統一的起點。

### 1.1 資料夾架構
- **`frontend/`**：Next.js + Tailwind CSS + shadcn/ui。
- **`backend/`**：NestJS + Prisma，配置了基礎的 OIDC、Prisma CLI 機制。
- **`specs/`**：本專案的規格目錄，包含本機開發 Conventions。
- **`docs/`**：存放由 Prisma schema 自動生成的 `data-dictionary.md`。

---

## 二、 套件清理與發版安全

在經過 **001 (Template Cleanup)** 與 **048 (Packages Scoping)** 階段後，範本移除了所有冗餘的本地 `sync` 模組以及未使用的 `@auranest/*` 遺留代碼，全面改為依賴發布於 GitHub Packages 的 `@appspine/*` 核心包：
- **`@appspine/common`**：底層共用 utils。
- **`@appspine/oidc-auth`**：SSO JWT 單一登入。
- **`@appspine/rbac`**：權限管理器。
- **`@appspine/mcp-server`**：MCP 端點。
- **`@appspine/metadata-schema`**：Runtime 數據字典端點。
