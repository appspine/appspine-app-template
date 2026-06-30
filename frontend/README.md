# Next.js & Shadcn UI 後台管理系統空白範本

本專案是一個基於 `next-shadcn-admin-dashboard` 改裝而成的**乾淨空白後台管理系統範本**。
移除了所有原作者的展示用 Demo 頁面與組件，只保留核心佈局與基礎設定，讓您可以直接開始開發您的應用程式。

## 特色功能

- **最新技術棧**：使用 Next.js 16 (App Router)、TypeScript、Tailwind CSS v4 與 Shadcn UI。
- **預設滿版版面**：預設啟用 Full Width（滿版）佈局，給您最寬廣的開發視野。
- **動態調整側邊欄寬度**：支援滑鼠拖曳側邊欄右邊緣調整寬度 (160px ~ 480px)，調整結果會自動儲存於 `localStorage` 中。
- **極簡設計**：清除了 Quick Create、AppBar 的 GitHub 與大頭像按鈕，保留最簡潔的 Sidebar 與 Header 結構。
- **亮暗色主題與自訂字型**：保留了原專案精美的 Layout Controls 控制面板，支援主題（亮色/暗色/系統設定）、自訂字型等切換。

## 開始使用

### 1. 安裝依賴

```bash
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

啟動後，在瀏覽器中開啟 [http://localhost:3000](http://localhost:3000) 即可看到空白 Dashboard。

## 專案結構

- `src/app`: 應用程式路由（Next.js App Router）
  - `src/app/(main)/dashboard`: 主要管理後台路由
- `src/components`: 共用組件與 Shadcn UI 組件
- `src/navigation`: 導覽與側邊欄選單設定
- `src/lib/preferences`: 主題與版面配置設定
