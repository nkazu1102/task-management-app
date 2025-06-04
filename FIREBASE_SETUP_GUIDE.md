# 🔥 Firebase 設定 - 実践ガイド

## 📋 必要な作業一覧

- [ ] Firebase Console でプロジェクト作成
- [ ] Realtime Database の設定
- [ ] Web アプリの追加
- [ ] 設定情報の取得
- [ ] firebase-config.js の更新
- [ ] 動作確認

---

## 🎯 **ステップ 1: Firebase Console でプロジェクト作成**

### 1-1. Firebase Console にアクセス

👉 **[Firebase Console](https://console.firebase.google.com/)** を開く

### 1-2. 新しいプロジェクトを作成

1. **「プロジェクトを追加」** をクリック
2. **プロジェクト名** を入力: `task-management-system`
3. **続行** をクリック
4. **Google Analytics** の設定（推奨: 無効にする）
5. **プロジェクトを作成** をクリック

---

## 🗄️ **ステップ 2: Realtime Database の設定**

### 2-1. Realtime Database の作成

1. 左サイドバーから **「Realtime Database」** を選択
2. **「データベースを作成」** をクリック
3. **ロケーション** を選択: `アジア太平洋（asia-southeast1）`
4. **セキュリティルール** を選択: **「テストモードで開始」**

### 2-2. セキュリティルールの設定

```javascript
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **重要**: これは開発用設定です。本番環境では適切な認証ルールを設定してください。

---

## 🌐 **ステップ 3: Web アプリの追加**

### 3-1. アプリの追加

1. プロジェクト設定（⚙️ アイコン）をクリック
2. **「アプリを追加」** → **「ウェブ」** を選択
3. **アプリのニックネーム**: `task-management-web`
4. **Firebase Hosting** は設定しない（チェックを外す）
5. **「アプリを登録」** をクリック

### 3-2. 設定情報をコピー

以下のような設定情報が表示されます：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC7K...", // ← この値をコピー
  authDomain: "task-management-system-xxxxx.firebaseapp.com",
  databaseURL:
    "https://task-management-system-xxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "task-management-system-xxxxx",
  storageBucket: "task-management-system-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
};
```

📋 **この設定情報をメモ帳などにコピーしておいてください！**

---

## ⚡ **ステップ 4: firebase-config.js の更新**

コピーした設定情報を使って、`public/firebase-config.js` を更新します。

**現在のファイル:**

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY", // ← 実際の値に置き換え
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};
```

**更新後:**

```javascript
const firebaseConfig = {
  apiKey: "実際のAPIキー",
  authDomain: "実際のauthDomain",
  databaseURL: "実際のdatabaseURL",
  projectId: "実際のprojectId",
  storageBucket: "実際のstorageBucket",
  messagingSenderId: "実際のmessagingSenderId",
  appId: "実際のappId",
};
```

---

## 🧪 **ステップ 5: 動作確認**

### 5-1. Firebase 完全版を起動

1. `public/index-firebase-complete.html` をブラウザで開く
2. 右上に **緑色の Firebase インジケーター** が表示されることを確認
3. コンソール（F12）でエラーがないことを確認

### 5-2. 基本機能テスト

1. **タスク追加**: 新しいタスクを作成
2. **Firebase Console**: Database タブでデータが保存されることを確認
3. **リアルタイム同期**: 別のタブで同じページを開き、一方でタスクを追加して他方で自動更新されることを確認

### 5-3. デバッグ機能テスト

1. **マスタ管理** タブを開く
2. **「🐛 デバッグ情報」** ボタンをクリック
3. コンソールに詳細な情報が表示されることを確認

---

## 🔧 **トラブルシューティング**

### エラー: "Firebase: Error (auth/invalid-api-key)"

➡️ **解決**: `apiKey` の値を正しくコピーし直してください

### エラー: "FIREBASE FATAL ERROR"

➡️ **解決**: `databaseURL` が正しいか確認してください

### 接続状態が常にオフライン

➡️ **解決**:

1. ブラウザのコンソールでエラーメッセージを確認
2. Firebase プロジェクトの設定を再確認
3. セキュリティルールが正しく設定されているか確認

### データが保存されない

➡️ **解決**:

1. Realtime Database のセキュリティルールが `.read: true, .write: true` になっているか確認
2. ネットワーク接続を確認

---

## 🎉 **成功時の確認ポイント**

✅ **Firebase 接続インジケーター**: 緑色で「🔥 Firebase 接続中」  
✅ **タスク追加**: 即座に Firebase Console に反映  
✅ **リアルタイム同期**: 複数タブ間での自動更新  
✅ **デバッグ情報**: 正常なデータ状況の表示

---

**準備ができたら、Firebase Console でプロジェクトを作成して、設定情報を教えてください！**
