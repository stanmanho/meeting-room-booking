# 會議室預約系統：全端工程師面試作業

歡迎！這份作業模擬你剛加入一個團隊後的第一週：接手一個已經上線的系統，修 bug、做新功能。

- 預計時間：**1～1.5 小時，最多 2 小時**
- 可以使用任何 AI 工具
- 請先完整讀完這份 README

**目錄**

1. [情境與規則](#1-情境與規則)
2. [安裝需要的工具（Mac／Windows）](#2-安裝需要的工具)
3. [下載並啟動專案](#3-下載並啟動專案)
4. [題目](#4-題目)
5. [繳交方式](#5-繳交方式)
6. [專案說明](#6-專案說明)
7. [常見問題](#7-常見問題)

---

## 1. 情境與規則

你剛加入「會議室預約系統」團隊。這個系統已經上線半年，台北和東京辦公室的同事每天都在使用。下面第 4 節是排給你的工單。

- **時間**：建議 1～1.5 小時，**最多 2 小時**，從開始讀題目算起（安裝環境的時間不算）。超過 2 小時請停下來，把目前的進度和下一步寫進 `NOTES.md`。
- **AI 工具**：可以使用任何 AI 工具。我們在意的是你做了哪些判斷，不是你有沒有用 AI。
- **需求不清楚時**：可以把你的假設寫在 `NOTES.md` 後繼續做，也可以回信詢問寄這份作業給你的聯絡人。等回覆期間不用停下來，先用你的假設繼續做即可。
- **開始寫程式之前**，請先讀過 [`SPEC.md`](SPEC.md)（業務規則）和 [`CONTRIBUTING.md`](CONTRIBUTING.md)（團隊開發規範）。
- **請不要公開你的解答**（例如 fork 成公開 repo）。繳交方式見第 5 節。

---

## 2. 安裝需要的工具

只需要兩個工具：**Node.js（LTS 版本，22.12 以上都可以）** 和 **Git**。不需要 Docker，也不需要另外安裝資料庫。

### Mac

1. **Node.js**：到 https://nodejs.org 下載 **LTS** 版本的安裝檔（`.pkg`），一路按「繼續」安裝。
   - 如果你有用 Homebrew，也可以執行 `brew install node`。
2. **Git**：打開「終端機」（Terminal），輸入 `git --version`。
   - 如果跳出視窗要求安裝「命令列開發者工具」，按「安裝」即可。

### Windows

1. **Node.js**：到 https://nodejs.org 下載 **LTS** 版本的 **Windows Installer（`.msi`）**，一路按 Next 安裝。
2. **Git**：到 https://git-scm.com/download/win 下載安裝，選項都用預設值即可。
3. 安裝完後，**開啟一個新的 PowerShell 視窗**（在開始選單搜尋「PowerShell」），之後的指令都在這裡執行。

### 確認安裝成功

在終端機（Mac）或 PowerShell（Windows）輸入：

```bash
node -v      # 應該顯示 v22.12.0 以上，例如 v24.x.x 或 v26.x.x
git --version
```

---

## 3. 下載並啟動專案

以下指令 **Mac 和 Windows 都一樣**。Mac 在「終端機」執行，Windows 在「PowerShell」執行。

### 第一次：下載與安裝

> **Windows 使用者請先注意**：專案的路徑**不能有中文**（PostgreSQL 在 Windows 上不支援），
> 例如中文的使用者名稱，或 OneDrive 的「桌面」「文件」資料夾底下都不行。請照下面的 Windows 指令放在 `C:\dev`。

**Mac**（放在家目錄）

```bash
cd ~
git clone https://github.com/stanmanho/meeting-room-booking.git
cd meeting-room-booking
npm install
```

**Windows**（PowerShell，放在 `C:\dev`）

```powershell
mkdir C:\dev        # 如果資料夾已經存在，會顯示錯誤，可以忽略
cd C:\dev
git clone https://github.com/stanmanho/meeting-room-booking.git
cd meeting-room-booking
npm install
```

`npm install` 會一併安裝前端和後端的套件，第一次大約需要 1～3 分鐘。

> 如果 Windows 執行 `npm` 時出現「**因為這個系統上已停用指令碼執行**」，請看[常見問題](#7-常見問題)。

### 每次開發：開兩個終端機視窗

每個新開的終端機視窗，都要先進到專案資料夾：

- Mac：`cd ~/meeting-room-booking`
- Windows：`cd C:\dev\meeting-room-booking`

**視窗 1：啟動資料庫**（保持開著，不要關）

```bash
npm run db
```

看到 `PostgreSQL 已啟動：localhost:5433` 就代表成功了。第一次啟動需要初始化，大約 10～30 秒。

**視窗 2：建立測試資料，並啟動網站**

```bash
npm run setup    # 建立資料表並寫入測試資料（第一次執行就好；之後想重置資料時也可以再執行）
npm run dev      # 同時啟動後端 API 和前端網頁
```

看到 `API listening on http://localhost:3000` 和 `Local: http://localhost:5173/` 之後，用瀏覽器打開 **http://localhost:5173**，在登入畫面點選任一個測試帳號就能登入。

要停止時，在兩個視窗分別按 `Ctrl + C`。

### 執行測試

資料庫（視窗 1）要開著。另外開第三個視窗（一樣先進到專案資料夾），或先在視窗 2 按 `Ctrl + C` 停止網站，再執行：

```bash
npm test         # 執行後端和前端的測試
```

### 常用指令

| 指令 | 用途 |
|---|---|
| `npm run db` | 啟動資料庫 |
| `npm run setup` | **清空資料庫**，重跑全部 migration，再寫入測試資料 |
| `npm run migrate` | 只執行還沒跑過的 migration，**保留現有資料**（跟正式環境部署時一樣） |
| `npm run dev` | 啟動後端 API（:3000）與前端網頁（:5173） |
| `npm test` | 執行後端與前端的測試 |

測試資料（`backend/scripts/db-tasks.ts` 的 seed）和測試程式都可以依需要修改。

---

## 4. 題目

### 重複預約事故（前端＋後端）

上週，有兩位同事都收到「預約成功」，結果同一時間出現在 201 中會議室。以下是當時的 log：

```
10:15:03.120  POST /api/bookings 201  user=1 room=2 14:00–15:00
10:15:03.161  POST /api/bookings 201  user=2 room=2 14:00–15:00
```

1. 請修正這個問題，讓同一間會議室**在任何情況下**都不會被重複預約，包括使用者在網頁上連點「預約」按鈕的情況。正式環境的部署方式請參考第 6 節。
2. 資料庫裡可能已經有其他重複的預約。請在 `NOTES.md` 說明你會怎麼處理。不需要實作通知功能。

面談時，我們會請你說明你的做法，以及你為什麼這樣做。

---

## 5. 繳交方式

1. **保留完整的 git 歷史**：請 commit 你的修改，不要 squash。
2. **填寫 [`NOTES.md`](NOTES.md)**。
3. 用以下**其中一種**方式繳交，然後回信告訴寄作業給你的聯絡人：

**方式 A：私人 GitHub repo（建議）**

1. 在 GitHub 建立一個**私人（Private）**的 repo。**不要勾選**任何初始化選項（README、.gitignore、license），否則推不上去。
2. 確認所有修改都已經 commit，並且在 `main` 分支上（如果你有開其他分支，請先合併回 `main`）。
3. 在專案資料夾執行：

```bash
git remote rename origin upstream
git remote add origin https://github.com/<你的帳號>/<你的repo名稱>.git
git push -u origin main
```

4. 在 repo 的 **Settings → Collaborators** 邀請 `stanmanho`。

> push 時如果要求輸入密碼：GitHub 已經不接受帳號密碼，請改用 [Personal Access Token](https://github.com/settings/tokens)，
> 或安裝 [GitHub Desktop](https://desktop.github.com/) 登入後再 push。覺得麻煩的話，可以改用方式 B。

**方式 B：壓縮檔**

把整個專案資料夾壓縮成 zip，**要包含隱藏的 `.git` 資料夾**，但請先刪除所有 `node_modules` 資料夾和 `backend/.pgdata` 資料夾，以免檔案太大。

面談時，我們會請你說明你的程式碼與你做的決定。

---

## 6. 專案說明

### 技術

- **後端**：Node.js、Express 5、PostgreSQL、Vitest
- **前端**：React（Vite），沒有使用其他框架

### 專案結構

```
backend/
  migrations/      資料庫 migration（依檔名順序執行）
  scripts/         資料庫相關指令（migrate / seed / reset / 本機資料庫）
  src/
    routes/        API 路由
    services/      商業邏輯（預約規則都在 bookingService.ts）
  tests/           後端測試
web/
  src/
    App.tsx        頁面切換
    api.ts         呼叫後端 API
    time.ts        時間與日期處理
    pages/         各個頁面
SPEC.md            業務規則
CONTRIBUTING.md    團隊開發規範
NOTES.md           繳交時要填寫的說明
```

### 測試帳號

密碼都是 `password123`。

| 帳號 | 姓名 | 備註 |
|---|---|---|
| yijun@example.com | 陳怡君 | 台北 |
| zhihao@example.com | 林志豪 | 台北 |
| yating@example.com | 張雅婷 | 台北，行政部，管理員 |
| sato@example.com | 佐藤健 | 東京 |

### 正式環境

| 項目 | 設定 |
|---|---|
| API | GCP Cloud Run，使用 `backend/Dockerfile` 建置 |
| API instance 數量 | 固定 2 個（min = max = 2） |
| 資料庫 | Cloud SQL for PostgreSQL 17（本機的 `npm run db` 和 Docker 也都是 17） |
| Migration | 部署前由 CI 對正式資料庫執行 `npm run db:migrate` |
| 前端 | `npm run build` 後部署到 Cloud Storage + CDN；同事會用電腦和手機瀏覽器使用 |

---

## 7. 常見問題

**Windows：執行 `npm` 時出現「因為這個系統上已停用指令碼執行」**

在 PowerShell 執行下面這行，再重新開一個 PowerShell 視窗：

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

也可以改用「命令提示字元」（cmd），指令完全相同。

**Windows：防火牆跳出視窗詢問是否允許 Node.js 或 PostgreSQL**

選擇允許（只勾「私人網路」即可）。

**資料庫啟動失敗**

`npm run db` 失敗時會顯示原因與建議做法，常見的有：

1. **路徑含有中文（Windows）**：把專案移到 `C:\dev\meeting-room-booking` 這類只有英文的路徑，再重新執行 `npm install`。
2. **port 5433 已經被使用**：資料庫可能已經在另一個視窗啟動了，直接使用即可。
3. 其他情況：刪除 `backend/.pgdata` 資料夾，再重新執行 `npm run db` 和 `npm run setup`。

**`npm install` 失敗**

確認 `node -v` 是 22.12 以上。如果之前裝過舊版 Node.js，請重新安裝 LTS 版本後，開一個新的終端機視窗再試一次。

**想用 Docker 跑資料庫**

用 `docker compose up -d` 取代 `npm run db`，其他步驟都相同。

**網頁打開是空白，或顯示「無法連線到伺服器」**

確認 `npm run dev` 的視窗裡，`[api]` 那一行有出現 `API listening on http://localhost:3000`。如果出現資料庫連線錯誤，請確認視窗 1 的資料庫還開著。
