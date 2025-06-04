# ⚡ 5 分でできる！クイックスタート

## 🎯 今すぐ実行する手順

### 1️⃣ GitHub リポジトリ作成（2 分）

**今すぐブラウザで実行：**

1. https://github.com を開く
2. 右上「+」→「New repository」
3. 設定：
   - Repository name: `task-management-app`
   - Public を選択
   - 他はチェックしない
4. 「Create repository」をクリック

**⚠️ 作成後に表示される URL（例：https://github.com/あなたのユーザー名/task-management-app.git）をコピーしておく**

### 2️⃣ コードアップロード（1 分）

**今すぐターミナルで実行：**

```powershell
# 1. リモートリポジトリ追加（URLを自分のものに変更）
git remote add origin https://github.com/あなたのユーザー名/task-management-app.git

# 2. ブランチ名変更
git branch -M main

# 3. アップロード
git push -u origin main
```

### 3️⃣ Vercel でデプロイ（2 分）

**今すぐブラウザで実行：**

1. https://vercel.com を開く
2. 「Start Deploying」→「Continue with GitHub」
3. GitHub でログイン・認証
4. 「Add New...」→「Project」
5. 「task-management-app」を探して「Import」
6. 何も変更せず「Deploy」をクリック

### 🎉 完了！

**約 2-3 分後に以下が表示されます：**

```
🎊 Congratulations!
Your site is live at: https://task-management-app-abc123.vercel.app
```

**この URL を全員で共有してください！**

---

## 🆘 エラーが出た場合

### Git 関連エラー

**`fatal: remote origin already exists`**

```powershell
git remote remove origin
git remote add origin https://github.com/あなたのユーザー名/task-management-app.git
```

**`Username for 'https://github.com':`**

- GitHub のユーザー名を入力
- Enter キーを押す
- パスワード（またはトークン）を入力

### Vercel エラー

**リポジトリが見つからない**

- 「Adjust GitHub App Permissions」をクリック
- アクセス許可を与える

**ビルドエラー**

```powershell
# ローカルでテスト
npm install
npm run build
# エラーがあれば修正後に再プッシュ
```

---

## 📞 助けが必要な場合

**このメッセージと一緒に具体的なエラーを教えてください：**

1. 🔴 エラーメッセージ全文
2. 🔴 どのステップで発生したか
3. 🔴 使用している OS（Windows/Mac）
4. 🔴 ブラウザの種類

**例**：

```
ステップ2でエラーが発生しました。
エラーメッセージ: fatal: unable to access 'https://github.com/...'
OS: Windows 10
ブラウザ: Chrome
```

**これで解決できます！** 🚀
