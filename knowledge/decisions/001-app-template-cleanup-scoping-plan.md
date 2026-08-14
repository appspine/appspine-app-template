---
type: decision
scope: appspine-app-template
status: active
supersedes: null
superseded_by: null
created: 2026-08-14
updated: 2026-08-14
---

# 001 - `appspine-app-template` 範本清理計畫（第二階段：範圍界定與盤點交接）

> 狀態：範圍界定、盤點與第 7 節待確認事項均已於 2026-08-14 由使用者確認；同日已完成
> 深度清理與驗證，執行結果見第 9 節。
> 本文件**不是**深度程式碼稽核，只做了結構／版本／下游消費面的盤點，格式比照
> `appspine-packages` 的
> `appspine-packages/knowledge/decisions/048-shared-packages-cleanup-scoping-plan.md`。
> 動機：使用者的套件／範本／業務 app 三層清理計畫，第一階段（套件層）已於 048 完成——盤點
> 15 個套件、補測試、升級有漏洞的依賴、發布新版本。本文件是第二階段，換範本層
> （`appspine-app-template`）。
> 範圍：`appspine-app-template` 本身的結構盤點、對 `@appspine/*` 套件的版本落後盤點（對照
> 048 完成後套件層目前最新版本）；下游（8 個業務 app）僅做「誰 fork 了範本、偏離範本多少」
> 的唯讀查核，**不含**下游程式碼本身的異動。
> 盤點方法：檔案數／目錄分層靜態掃描 + `package.json`/`pnpm-workspace.yaml` 版本比對 + 跨
> 8 個業務 app 的 `package.json`/`docs/template-sync.md`/少數共用檔案唯讀 diff，沒有逐檔讀
> 程式碼內容找重複/死碼，沒有 Opus 二次審查，沒有實跑 build/test 驗證健康度（詳見第 8 節）。

---

## 1. 背景

`appspine` 先前已有兩輪全庫規模的清理（029、036，橫向涵蓋套件與全部業務 app）。這次使用者
明確要求「分層次來」：套件層（`appspine-packages`）已於
`appspine-packages/knowledge/decisions/048-shared-packages-cleanup-scoping-plan.md`
完成盤點與深度清理（15 個套件、521 tests 全綠、`pnpm audit` 從 20 個漏洞清到 0）。本文件是
第二階段——範本層（`appspine-app-template`）的範圍界定與盤點交接，目的是把範本目前的結構
現況、對套件層新版本的落後程度、下游 8 個業務 app 的偏離狀況整理清楚，交給 codex 做實際的
深度清理。業務 app 層（第三階段）留待這輪範本清理有結論後另外排期。

`appspine-app-template` 自己的 `knowledge/decisions/` 目前是空的（只有一份 `knowledge/topics/
002-app-dev-conventions.md`），依 002 已定案的「知識庫文件編號獨立計算」規則，各 repo 各自
維護編號、不共用全域序號，本文件編號為 `001`。

## 2. 範本盤點總覽

### 2.1 結構與檔案數

`appspine-app-template` 是一個 pnpm workspace，`backend/`、`frontend/` 為 workspace 成員，`e2e/`
是獨立的 pnpm workspace（`pnpm install --dir e2e --ignore-workspace`，故意跟主 workspace 分開，
避免 e2e 測試依賴污染 app 的 production 依賴樹）。

| 區塊 | 檔案數 | 測試檔 | 備註 |
|---|---|---|---|
| `backend/src` | 8 個 `.ts` | 2 個 `.spec.ts` | 只有 2 個 scaffold 模組：`notifications/`（controller + service + module + 2 個 spec，已補測試）與 `domain-events/`（僅 1 個接線用 module，handler registry 是空的，無 spec）。業務模組由各 fork 自行新增，範本本身刻意不含業務邏輯。 |
| `frontend/src` | 110 個 `.ts`/`.tsx` | 0 | 無 vitest/jest 設定，`frontend/package.json` 沒有 `test` script。細分見下表。 |
| `e2e/` | 7 個 `.ts`（不含 `node_modules`） | 4 個 `.spec.ts` | 只覆蓋框架層路徑：`auth`、`rbac`、`m2m-api-key`、`notification-contract`。依賴 `@appspine/e2e-kit ^1.0.1`。 |

`frontend/src` 細分：

| 子目錄 | 檔案數 | 說明 |
|---|---|---|
| `components/` | 60 | 其中 59 個是 `components/ui/` 下 vendored shadcn 元件，1 個是 `simple-icon.tsx`——這塊幾乎全是第三方樣板程式碼，不是範本自己的業務邏輯。 |
| `app/` | 22 | Next.js App Router 頁面/layout/server actions（登入、dashboard、admin 的 api-keys/roles/users）。 |
| `lib/` | 10 | |
| `server/` | 6 | 含 `auth-actions.ts`、`api-client.ts`、`current-user.ts` 等——每個 fork 都會直接繼承的邏輯層。 |
| `i18n/` | 4 | |
| `stores/` | 2 | |
| `scripts/` | 2 | |
| `config/`、`hooks/`、`navigation/` | 各 1 | |
| `styles/`、`types/` | 各 0 | 空目錄。 |

CI（`.github/workflows/e2e.yml`，唯一一個 workflow）依序跑：knowledge lint → 安裝依賴 →
`prisma:generate` → `check:integration-contracts` → workspace `typecheck`（backend + frontend）
→ workspace `check`（biome）→ `check:enum-i18n` → **backend** unit tests → e2e typecheck →
對 Keycloak service container 跑完整 e2e。**沒有** frontend 單元測試步驟（跟 frontend 沒有
測試基礎設施一致）。

### 2.2 `@appspine/*` 依賴版本落後（對照套件層 048 完成後的最新版本）

版本來源：本機同工作區內 `appspine-packages` checkout 的 `package.json`（假設 048 §8.2 記錄
的 changeset 發版流程已跑完並發布到 GitHub Packages；本文件沒有另外查詢 registry 確認，見
第 8 節）。

| 套件 | 範本目前 pin | 套件層目前最新 | 落後 | 備註 |
|---|---|---|---|---|
| `common` | 0.3.2 | 0.3.3 | 1 patch | |
| `auth` | 6.2.1 | 6.2.2 | 1 patch | 048 這輪把 `bcrypt` 升到 6.x、清掉 vulnerable 依賴鏈。 |
| `audit-log` | 1.0.0 | 1.0.1 | 1 patch | |
| `health-check` | 0.1.4 | 0.1.8 | 4 patches | 048 §8.1 這輪才幫這個套件從零測試補上 characterization tests，並收斂 Terminus adapter 的 `any` 型別。 |
| `m2m-api-key` | 4.0.5 | 4.0.7 | 2 patches | |
| `rbac` | 4.0.0 | 4.0.7 | 7 patches | 落後幅度最大的第 3 層套件。 |
| `mcp-server` | 0.6.1 | 0.6.7 | 6 patches | 048 §8.1 這輪動過 Hono peer dependency／override，範本升級時不能只改版號（見第 4 節風險）。 |
| `metadata-schema` | backend `^0.2.14` / frontend `^0.2.13` | 0.2.21 | 7–8 patches | 範本自己 backend／frontend 兩處版本**不一致**（見第 4 節）。 |
| `domain-events` | 7.1.5（精確 pin，無 override） | 7.1.5 | 已是最新 | |
| `integration-contracts` | 0.3.1 | 0.3.1 | 已是最新 | |
| `notification` | 0.2.1 | 0.2.2 | 1 patch | |
| `frontend-shell` | `^0.14.0` | 0.14.1 | 1 patch | |
| `e2e-kit` | `^1.0.1`（獨立 workspace） | 1.0.2 | 1 patch | |
| `oidc-delegation` | 未使用 | 0.3.1 | — | 跟 048 §3 一致：零下游消費，範本本身也沒用，不是缺口。 |
| `master-data-client` | 未使用 | 0.1.4 | — | 範本本身不依賴；8 個業務 app 中只有 `approve` 用（`^0.1.3`）。 |

`pnpm-workspace.yaml` 對 8 個套件設了 `overrides`（精確版號），而 `backend/package.json` 的
`dependencies` 大多寫 `^` range——**實際鎖死版本的是 `overrides` 區塊，不是 `package.json`
的 range**，升級時第一個要動的是 `pnpm-workspace.yaml`。

### 2.3 既有管理工具

- **`scripts/scaffold-init.mjs`**：fork 時重寫 app 名稱、port、CORS 等設定，`README.md`「Forking
  this template」章節有完整 Day 0 步驟。
- **`scripts/list-template-changes.mjs`** + **`docs/template-sync.md`**：下游同步追蹤機制——
  前者列出範本某個 commit 之後有哪些變更待 fork 回放，後者是各 fork 自己記錄「同步到範本
  哪個 commit」的日誌。第 3 節會提到這套機制目前有實際失準案例。
- **`scripts/check-generated-integration-contracts.mjs`**：CI 門檻，檢查生成的 integration
  contract 產物沒有 drift。
- **`scripts/lint-knowledge.js`**：`knowledge/` 文件 lint 工具，跟套件層共用同一套規則。
- 版本管理：範本是套件的**消費端**，不是套件本身，升級 `@appspine/*` 版本只是改
  `pnpm-workspace.yaml`／`package.json` 的版本號，不涉及套件層的 changeset 流程（changeset
  只在 `appspine-packages` repo 內套用）。

## 3. 下游業務 app 唯讀查核

8 個業務 app（各自獨立 git repo，與範本同層目錄）：`approve`、`calendar`、`chat`、`drive`、
`master-data`、`mcp-gateway`、`projects`、`wiki`。全部在今天（2026-08-14）都同步過一筆跨
repo 的 `fix(knowledge): correctly parse escaped pipes in wikilinks` commit，代表工具鏈層面
是有在維護的；但業務／依賴層面明顯分成兩個世代：

**舊世代（5 個）：`calendar`、`chat`、`drive`、`master-data`、`mcp-gateway`**
- `docs/template-sync.md` 全部停在同一個 commit `76b07e6`（"038 MCP canary propagation..."）。
- `@appspine/*` 版本明顯落後：`domain-events` 精確釘在 `4.0.0`（範本現在是 `7.1.5`，中間跨了
  **3 個 major version**）、`auth ^6.0.0`、`frontend-shell ^0.12.0`。
- 都沒有 `backend/src/notifications/` 模組——這是範本比較晚才加入的 scaffold，這 5 個 app fork
  的時間點更早，之後也沒有回補。
- 都沒有 `@appspine/integration-contracts` 依賴。
- `biome.json` 都少一行 `!backend/src/generated/**` ignore glob（範本後補的）。
- commit 數：`calendar` 89、`chat` 84、`drive` 89、`master-data` 37、`mcp-gateway` 89——規模
  差異大，`master-data` 明顯是較新／較小的專案。

**新世代（2 個）：`approve`、`projects`**
- `@appspine/*` 版本幾乎貼齊範本目前 pin（`auth 6.2.1`、`domain-events 7.1.5`、
  `integration-contracts 0.3.1`、`notification 0.2.1`、`frontend-shell ^0.14.0`）。
- 都有 `backend/src/notifications/` 模組：`projects` 逐位元組與範本相同；`approve` 有 5 行小
  改動。
- `projects` 的 `docs/template-sync.md` 精確指向範本目前 HEAD 前 4 個 commit（`8dcad27`，這 4 個
  commit 都是 knowledge/CI 文件變更，非程式碼），是唯一記錄「同步到接近最新」的 app。
- `approve` 的 `docs/template-sync.md` 卻寫 `76b07e6`——跟舊世代同一個同步點，但依賴版本是新
  世代規格，屬於文件與實際狀態不一致（見第 4 節）。

**異常個案：`wiki`**
- `docs/template-sync.md` 寫 `76b07e6`（跟舊世代 5 個 app 相同），但 `@appspine/*` 依賴版本
  卻是新世代規格（`auth 6.2.1`、`domain-events 7.1.5`、`integration-contracts 0.3.1`、
  `notification 0.2.1`、`frontend-shell ^0.14.0`），`biome.json` 也已跟範本一致。代表有人手動
  升級過 `wiki` 的套件版本／同步過部分範本檔案，但沒有同步更新 `docs/template-sync.md`。

其他觀察：8 個 app 的 `.github/workflows/` 檔名清單跟範本完全一致（CI 骨架沒有分岔）；
`docker-compose.yml`、`domain-events.module.ts` 每個 app 都跟範本不同——這兩者屬於預期內的
per-app 客製（container 命名/port、各自註冊的 domain event handler），不是範本落後的訊號。

本節查核方式全程唯讀：`diff`/`git log`/`package.json` 靜態比對，**沒有修改任何業務 app 的
任何檔案**，也沒有讀過任何一個業務 app 的業務邏輯程式碼內容。

## 4. 已知風險／待查項

- **`domain-events` 3 個 major version 的落差**：舊世代 5 個 app 停在 `4.0.0`，範本／新世代已到
  `7.1.5`。這是 048 盤點時第 4 層（依賴最深）的套件，major version 跳號代表期間很可能有
  breaking change——這 5 個 app 之後若要接上範本清理的成果，`domain-events` 升級需要人工驗證，
  不是單純改版號。
- **`docs/template-sync.md` 與實際依賴版本不一致**（`wiki` 確認、`approve` 疑似）：這份文件是
  「下游同步進度」的唯一事實來源，一旦跟實際 `package.json` 脫鉤，之後任何人（包含 codex）
  想知道某個 app 落後範本多少都會被誤導。本輪已實際觀察到失準案例，值得留意這套機制本身的
  可靠度。
- **`pnpm-workspace.yaml` 的 `overrides` 是版本落後的根因**：`backend/package.json` 多用 `^`
  range，理論上允許自動吃到新版，但 workspace-level `overrides` 用精確版號覆蓋，實際鎖死在
  舊版。8 個套件的 override 都要對照 048 後的最新版本重新評估；`mcp-server` 升級尤其要注意
  048 §8.1 動過的 Hono peer dependency／override，不能只改版號數字。
- **`metadata-schema` 範本自己內部版本不一致**：backend `^0.2.14` 跟 frontend `^0.2.13` 不同步，
  即使目前可能相容，也是清理時第一個該處理的「小但明確」落差。
- **frontend 完全沒有測試基礎設施**：110 個 TS/TSX 檔案、0 個測試檔，也沒裝 vitest/jest。對照
  `knowledge/topics/002` 已定案的兩層測試規範——業務系統 app 這層本來就不強制單元測試覆蓋率，
  主力驗證是 E2E golden path + typecheck/lint + 人工瀏覽器驗證，所以這**不是規範違反**；但範本
  是所有業務 app 的起點，`frontend/src/lib`（10 檔）、`frontend/src/server`（6 檔，含
  `auth-actions.ts` 這類每個 fork 都會直接繼承的邏輯層）目前完全沒有 characterization test，
  範本清理若要動這幾個檔案，沒有回歸安全網。
- **`backend/src/domain-events/domain-events.module.ts` 零測試**：目前是空 handler registry 的
  接線模組，沒有 spec 檔——還沒有邏輯可測，但也代表「接線本身正確」目前沒有驗證手段。
- **e2e 只覆蓋框架層 4 條路徑**（`auth`、`rbac`、`m2m-api-key`、`notification-contract}），沒有
  業務模組（因為範本本身沒有業務模組，符合定位）——清理範本時，這 4 條 e2e 是唯一能自動驗證
  「改動沒有破壞下游行為」的防線。
- **`frontend/src/components/ui`（59 個 vendored shadcn 元件）** 是最大宗檔案量，但屬於「vendored
  第三方樣板」性質——範本裡看起來未被引用的元件，不代表下游 fork 不會用到，跟一般死碼清理的
  判斷邏輯不同（見第 7 節待確認事項）。

## 5. 非目標（本輪不做）

- 不修改任何業務 app（8 個）的程式碼——下游查核只是唯讀比對版本、`template-sync.md` 記錄、
  少數共用檔案 diff，供範本清理排序參考；業務 app 各自的清理排期留待範本這輪有結論後另外處理。
- 不逐檔閱讀 `backend` 8 檔或 `frontend` 110 檔的程式碼內容找重複/死碼/死 export——本文件只做
  結構/版本面盤點，深查工作留給 codex。
- 不實跑 `pnpm build`/`pnpm typecheck`/`pnpm test`/`pnpm check`/`pnpm audit` 驗證範本目前的真實
  健康度（見第 8 節）。
- 不變更 `pnpm-workspace.yaml` 的 `overrides` 版本號或任何 `@appspine/*` 依賴版本——版本升級屬於
  本輪清理的執行內容，待第 7 節有結論後再由 codex 動手。

## 6. 建議執行順序（交給 codex）

1. **`metadata-schema` 內部版本不一致對齊到套件層最新版 `0.2.21`**（backend `^0.2.14`、frontend
   `^0.2.13` 統一成 `0.2.21`）——風險最低、最單純，適合當第一步順手處理。
2. **`pnpm-workspace.yaml` overrides 整批升級**到套件層 048 後的最新版本（`common 0.3.3`、
   `auth 6.2.2`、`audit-log 1.0.1`、`health-check 0.1.8`、`m2m-api-key 4.0.7`、`rbac 4.0.7`、
   `mcp-server 0.6.7`、`metadata-schema 0.2.21`、`notification 0.2.2`、`frontend-shell 0.14.1`、
   `e2e-kit 1.0.2`）——每次升級後跑 `pnpm install` + `pnpm typecheck` + `pnpm -C backend test` +
   CI 那組 e2e 檢查，確認沒有 breaking change。
3. **`mcp-server` 升級時特別檢查 Hono peer dependency**：048 §8.1 這輪套件層動過
   `@hono/node-server` override，範本自己的 workspace overrides 若也鎖了相關套件版本，要對照
   套件新版的 `peerDependencies` 重新檢查。
4. **`health-check` 升級時檢查呼叫端型別**：048 §8.1 把 Terminus adapter 的 `any` 改成精確的
   `pingCheck` 參數型別，範本消費端若有依賴原本的 `any` 寬鬆型別，這步要順手修正。
5. **`backend/src/domain-events/domain-events.module.ts` 現在就補一個最小接線驗證測試**——目前
   零測試，這步順便完成，不等實際 handler 邏輯出現。
6. **`frontend/src/lib`、`frontend/src/server` 不建立正式測試框架**（不裝 vitest/jest）——維持
   `knowledge/topics/002` 定案的業務 app 層測試規範；只有這輪清理若實際改動到這兩個目錄的檔案，
   才視情況為該次改動補 characterization test，不是本輪的獨立任務。
7. **`frontend/src/components/ui`（59 檔 vendored shadcn 元件）不做死元件清查，全部保留**——已
   確認不是本輪範圍，不需要花時間掃描。
8. **`docs/template-sync.md` 下游脫鉤問題不處理**——已確認只在本文件第 3、4 節記錄發現，範本本身
   不新增防呆機制，也不去改任何下游 app 的文件。
9. **留一筆 follow-up 記錄**：舊世代 5 個業務 app（`calendar`/`chat`/`drive`/`master-data`/
   `mcp-gateway`）落後範本版本（`domain-events` 4.0.0 vs 7.1.5 跨 3 個 major）——寫進本文件或另立
   一筆 knowledge 記錄即可，本輪不動這 5 個 app 的程式碼。

## 7. 待確認事項（已於 2026-08-14 由使用者確認）

1. **`pnpm-workspace.yaml` overrides 整批升級**到套件層 048 後的最新版本（見 6.2 清單），不分批。
2. **`metadata-schema` backend/frontend 版本不一致，對齊到套件層最新版 `0.2.21`**（而非只求兩處
   一致的舊版本）。
3. **`frontend/src/lib`、`frontend/src/server` 維持現有測試規範，不裝正式測試框架**——只在這輪
   清理實際改動到這兩個目錄時，視情況補 characterization test。
4. **`frontend/src/components/ui`（59 個 vendored shadcn 元件）不做死元件清查，全部保留**——這些
   是提供給下游 fork 選用的元件庫，範本裡「未使用」不代表下游不會用，清理效益小於風險。
5. **`docs/template-sync.md` 記錄與實際依賴版本脫鉤（`wiki` 確認、`approve` 疑似）不處理**——這是
   下游 app 自己的文件，範本清理不去改下游，也不在範本這邊另外補強防呆機制；只在本文件記錄發現。
6. **`backend/src/domain-events/domain-events.module.ts` 空 handler registry 現在就補一個最小
   接線驗證測試**，不等實際 handler 邏輯出現再補。
7. **舊世代 5 個業務 app 落後範本版本，留一筆 follow-up 記錄**（見 6.9），避免這個發現之後被
   遺忘；本輪明確不修改這 5 個 app 的程式碼。

## 8. 盤點方法侷限

本文件的盤點方法：`find`/`ls` 統計檔案數與目錄分層、讀 `package.json`/`pnpm-workspace.yaml`
比對 `@appspine/*` 版本（範本 vs 套件層目前最新版本，透過本機同工作區內的 `appspine-packages`
checkout 直接讀 `package.json` 取得，**沒有**查詢 GitHub Packages registry 確認 048 §8.2 記錄
的發版流程是否已真的跑完）、對 8 個業務 app 的 `package.json`/`docs/template-sync.md`/
`biome.json`/`docker-compose.yml`/`domain-events.module.ts`/`notifications/` 做唯讀 `diff`／grep
比對、讀 `.github/workflows/e2e.yml` 確認 CI 實際跑哪些檢查、讀 `docs/agent-guide.md`／
`docs/conventions.md`／`knowledge/topics/002` 確認既有規範。

**沒有**做到：

- 逐檔讀 `backend` 8 檔／`frontend` 110 檔的程式碼內容找重複/死碼/死 export（跟 048 §7 同樣的
  侷限，深查工作留給 codex）。
- 實跑 `pnpm build`/`pnpm typecheck`/`pnpm test`/`pnpm check`/`pnpm audit`——本文件的版本落後與
  風險判斷全部基於靜態檔案比對，沒有實際驗證範本升級套件版本後是否會跑不過。
- Opus 或其他模型的二次獨立審查。
- 對 8 個業務 app 做任何超出「`package.json`／`template-sync.md`／少數共用檔案 diff」以外的
  程式碼層級查核——沒有讀過任何一個業務 app 的業務邏輯程式碼。
- CVE／依賴安全性掃描（`pnpm audit` 未執行）。
- 確認 `appspine-packages` 端讀到的版本號是否已實際發布到 GitHub Packages registry——本文件
  假設 048 §8.2 記錄的 changeset 發版流程已跑完；若尚未發布，範本這邊 bump 版本會直接失敗於
  `pnpm install`。

## 9. 執行結果（2026-08-14）

### 9.1 已完成變更

- backend、frontend 與獨立 e2e workspace 的 `@appspine/*` 版本已依第 6 節清單完成升級；
  backend/frontend 的 `metadata-schema` 均精確對齊 `0.2.21`，lockfile 已重建。
- `pnpm-workspace.yaml` 已補上 `@modelcontextprotocol/node>@hono/node-server ^1.19.15` 的
  parent-scoped override，實際解析為套件層 048 已驗證的 Hono `4.13.2` + node-server `1.19.17`；
  `pnpm peers check` 無 peer dependency 問題。
- `health-check 0.1.8` 的精確 `pingCheck` adapter 型別封裝在套件內；範本沒有直接依賴舊 `any`
  邊界的呼叫點，因此不需修改消費端程式碼。
- 新增 `backend/src/domain-events/domain-events.module.spec.ts`，驗證空 registry、dispatcher options
  provider、dispatcher/service providers 與公開 exports；backend 測試由 5 增為 6 個。
- 安全掃描另外發現範本既有 production dependency 漏洞，因此把 Next.js 升至 `16.3.1`、以
  parent-scoped override 將 Multer 升至 `2.2.x`，並把只供 scaffold 開發使用的 `shadcn` CLI 移至
  `devDependencies`。主 workspace 的 production audit 與 e2e workspace audit 均為 0 個已知漏洞。
- 依第 7 節決策，沒有新增 frontend 測試框架、沒有刪除或掃描 vendored shadcn 元件，也沒有修改
  `docs/template-sync.md` 防呆機制。使用者後續明確把執行範圍擴大到 8 個下游 app；同步結果見 9.3。

### 9.2 驗證結果

- `pnpm install`、e2e 獨立 workspace install、`prisma:generate` 與 integration-contract drift check
  通過。
- workspace typecheck/Biome、enum i18n、schema docs、domain-events/notification schema drift、
  domain-event subscriber checks 全部通過。
- backend 3 個 test files／6 tests、backend build、frontend production build、e2e typecheck/Biome
  全部通過。
- 使用 CI 同款隔離 Keycloak image、範本 Postgres migration/seed 與實際前後端服務執行 Playwright：
  9/9 tests 通過（auth、RBAC、M2M API Key、notification contract）。
- `pnpm audit --prod --audit-level=low` 與 e2e audit 均為 0。主 workspace 不加 `--prod` 時仍會列出
  Nest CLI、Vitest、shadcn CLI 等 build/scaffold 工具鏈的 dev-only advisories；它們不進 production
  dependency graph，本輪未跨 major 升級整套開發工具鏈。

### 9.3 下游 8 個 app 同步結果

使用者在範本清理完成後明確將範圍擴大為同步修改 `approve`、`calendar`、`chat`、`drive`、
`master-data`、`mcp-gateway`、`projects`、`wiki`。8 個 repo 的共通套件、Next.js、
frontend-shell、metadata-schema、e2e-kit、shadcn CLI 分類與安全 overrides 均已同步，root 與獨立
e2e lockfile 也已重建。

`calendar`、`chat`、`drive`、`master-data`、`mcp-gateway` 的 domain-events 不是只改版號：

- `@appspine/domain-events` 由 `4.0.0` 升至 `7.1.5`。
- Prisma `DomainEvent` 補上 7.x 要求的 nullable integration pin/payload 欄位，新增
  `IntegrationEventReceipt`，並為每個 repo 新增 forward-only migration。
- dispatcher 補上 `DOMAIN_EVENTS_DISABLED_BINDINGS` kill switch；既有 handler registry、
  webhook routing 與 app-specific module wiring 全部保留。
- 5 個 repo 的 Prisma generate、schema drift、subscriber gate、型別檢查、backend build 與既有
  domain-event probe／unit tests 均通過。

production audit 另外發現並修正 downstream 特有依賴鏈：直接 Multer、Socket.IO parser、
bcrypt/node-tar、Excalidraw 的 nanoid/lodash-es、undici/fast-uri，以及 Mermaid/DOMPurify。
最終 8 個 root production audit 與 8 個 e2e audit 均為 0 個已知漏洞。

驗證涵蓋 8 個 repo 的 frozen-lockfile install、Prisma generate、domain-events schema/subscriber
drift、workspace typecheck/Biome、backend build、frontend production build、e2e typecheck/Biome，
以及共 366 個 backend unit tests；`approve` 的 notification ownership DB probe 亦在隔離啟動的
Postgres 上通過。完整瀏覽器 Playwright golden paths 未逐 repo 重跑，因本輪變更未修改業務 UI/API，
且範本本身的 9/9 Playwright 已於 9.2 通過。

`docs/template-sync.md` 尚未填入這批同步紀錄：目前範本與 8 個 app 都是未提交 working tree，
沒有可追溯的 upstream/downstream commit pair。各 repo 建立 commit 後，應再以實際 commit hash
補登同步列，避免寫入虛構或暫時的 hash。
