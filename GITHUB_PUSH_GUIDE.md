# GitHub 推送指南

## 📋 當前狀態

遠程倉庫已配置：
```bash
git remote -v
# origin  https://github.com/hsuyungfeng/medicalordertree.git (fetch)
# origin  https://github.com/hsuyungfeng/medicalordertree.git (push)
```

最新提交：
```
commit 4dbee75
chore: 刪除所有測試腳本與緩存檔案，保持專案結構整潔
```

---

## 🚀 推送方式選擇

### 方式 1：使用 Personal Access Token (推薦 ✓)

最簡單的方式，適合大多數用戶。

**步驟 1：生成 GitHub Personal Access Token**
1. 訪問 https://github.com/settings/tokens
2. 點擊 "Generate new token" → "Generate new token (classic)"
3. 給 Token 取名（例如：`medical-order-push`）
4. 選擇 Scopes：
   - ☑ `repo` (完整控制)
   - ☑ `workflow` (Action)
5. 點擊 "Generate token"
6. **複製 Token**（只會顯示一次！）

**步驟 2：使用 Token 推送**
```bash
cd /path/to/醫療服務給付項目及支付標準樹狀圖-114.09.01

# 推送到 GitHub
git push -u origin master

# 當提示輸入密碼時，貼上 Personal Access Token
# Username: hsuyungfeng
# Password: <paste your token here>
```

**步驟 3：保存認證（可選）**
為了避免每次都輸入 Token，可以保存認證信息：
```bash
# 使用 git credential 存儲認證
git config --global credential.helper store
git push -u origin master
# 輸入一次認證後，以後就會自動記住
```

---

### 方式 2：使用 SSH（更安全 ✓✓）

最安全的方式，但需要多一步設置。

**步驟 1：檢查 SSH 金鑰**
```bash
ls -la ~/.ssh/id_rsa
```

**步驟 2：如果沒有 SSH 金鑰，生成新的**
```bash
ssh-keygen -t rsa -b 4096 -C "hsu@example.com"
# 按 Enter 接受默認位置
# 輸入 passphrase (可留空)
```

**步驟 3：將 SSH 公鑰添加到 GitHub**
1. 複製公鑰：
   ```bash
   cat ~/.ssh/id_rsa.pub
   ```
2. 訪問 https://github.com/settings/keys
3. 點擊 "New SSH key"
4. 貼上公鑰內容，點擊 "Add SSH key"

**步驟 4：測試 SSH 連接**
```bash
ssh -T git@github.com
# 應該看到：Hi hsuyungfeng! You've successfully authenticated...
```

**步驟 5：更改遠程 URL 為 SSH**
```bash
cd /path/to/醫療服務給付項目及支付標準樹狀圖-114.09.01

git remote remove origin
git remote add origin git@github.com:hsuyungfeng/medicalordertree.git

# 驗證
git remote -v
```

**步驟 6：推送到 GitHub**
```bash
git push -u origin master
```

---

### 方式 3：使用 GitHub Desktop

如果偏好圖形界面：

1. 下載 GitHub Desktop：https://desktop.github.com/
2. 登錄 GitHub 帳號
3. 選擇本地倉庫並推送

---

## 📝 完整推送命令

當認證設置完成後，執行以下命令：

```bash
cd /home/hsu/Desktop/drboxcsv/medicalorder/服務給付項目及支付標準樹狀圖-114.09.01

# 確認遠程配置
git remote -v

# 檢查未推送的提交
git log origin/master..master

# 推送到 GitHub
git push -u origin master

# 驗證推送成功
git remote -v
git log --oneline -1
```

---

## ✅ 驗證推送成功

推送成功後，你應該看到：

```
Counting objects: X, done.
Compressing objects: 100% (X/X), done.
Writing objects: 100% (X/X)
...
remote: Create a pull request for 'master' on GitHub by visiting:
remote:      https://github.com/hsuyungfeng/medicalordertree/pull/new/master
...
branch 'master' set up to track 'origin/master'.
```

然後訪問 https://github.com/hsuyungfeng/medicalordertree 驗證代碼已推送。

---

## 🔧 故障排除

### 問題 1：`fatal: could not read Username`
**解決方案**：使用 Personal Access Token 或 SSH 金鑰

### 問題 2：`fatal: 'origin' does not appear to be a 'git' repository`
**解決方案**：確保在正確的目錄中執行命令
```bash
cd /home/hsu/Desktop/drboxcsv/medicalorder/服務給付項目及支付標準樹狀圖-114.09.01
```

### 問題 3：`Permission denied (publickey)`
**解決方案**：SSH 金鑰配置問題
```bash
# 測試連接
ssh -T git@github.com

# 檢查 SSH 代理
ssh-add -l
```

### 問題 4：`remote origin already exists`
**解決方案**：移除舊的遠程配置
```bash
git remote remove origin
git remote add origin https://github.com/hsuyungfeng/medicalordertree.git
```

---

## 📚 推薦閱讀

- [GitHub 文檔 - Authentication](https://docs.github.com/en/authentication)
- [GitHub 文檔 - Managing remote repositories](https://docs.github.com/en/get-started/getting-started-with-git/managing-remote-repositories)
- [Git Book - Git on the Server](https://git-scm.com/book/en/v2/Git-on-the-Server-The-Protocols)

---

## 💡 下一步

推送成功後：

1. **驗證倉庫**：訪問 https://github.com/hsuyungfeng/medicalordertree
2. **設置 README**：GitHub 會自動使用 README.md 作為倉庫首頁
3. **配置倉庫設置**：添加描述、標籤、主題等
4. **啟用 GitHub Pages**：可選，用於展示文檔
5. **設置 Actions**（可選）：自動化工作流

---

**最後更新**：2025年12月31日

需要幫助？提交 Issue 或 Pull Request！
