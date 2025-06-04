# デプロイメントガイド

## 概要

このタスク管理アプリをみんなでブラウザ共有するためのデプロイメント手順です。

## 方法 1: Vercel（推奨）

### 初回セットアップ

1. [Vercel](https://vercel.com)にアカウント作成
2. GitHub アカウントと連携
3. 「New Project」からこのリポジトリを選択
4. 自動でデプロイが開始されます

### 特徴

- ✅ 無料で利用可能
- ✅ GitHub プッシュで自動デプロイ
- ✅ SSL 証明書自動付与
- ✅ CDN 配信で高速表示

## 方法 2: Netlify

### セットアップ

1. [Netlify](https://netlify.com)にアカウント作成
2. 「New site from Git」を選択
3. このリポジトリを選択
4. Build 設定:
   - Build command: `npm run build`
   - Publish directory: `.next`

## 方法 3: GitHub Pages

### セットアップ

1. リポジトリの Settings > Pages
2. Source: GitHub Actions
3. 自動デプロイが開始されます

## 環境変数の設定

Firebase 設定が必要な場合：

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

## 手動ビルド

ローカルでビルドする場合：

```bash
npm install
npm run build
npm start
```

## トラブルシューティング

### ビルドエラーの場合

1. Node.js バージョンを 18 以上に更新
2. `npm ci`で依存関係を再インストール
3. TypeScript エラーがある場合は修正

### 環境変数エラーの場合

1. Firebase 設定ファイルが正しく配置されているか確認
2. 環境変数が正しく設定されているか確認

## アクセス方法

デプロイ完了後に表示される URL を全員で共有してください。
例: https://your-app-name.vercel.app
