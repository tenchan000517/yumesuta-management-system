# ゆめスタ統合マネジメントシステム

**プロジェクト名**: yumesuta-management-system
**作成日**: 2025-10-04
**最終更新**: 2025-10-05
**ステータス**: MVP完成 ✅

---

## 📋 プロジェクト概要

ゆめスタの全業務を一元管理する統合マネジメントダッシュボード。

### 目的
- マネージャー1名でも全業務を運営できる体制の構築
- 営業が10名に増えても管理工数を増やさない仕組みの実現
- 複数ディレクトリ・スプレッドシートに分散したデータの一元管理
- 業務の可視化・自動化・標準化

### MVP機能（Phase 1完成）
1. **営業進捗管理** - 営業KPI・契約状況・入金管理の可視化
2. **ゆめマガ制作進捗管理** - 97工程の制作スケジュール管理
3. **パートナー・スターデータ管理** - 掲載企業・スター紹介データの一元管理
4. **HP・LLMO分析管理** - アクセス解析・検索パフォーマンス分析
5. **SNS投稿管理** - Instagram・Xの投稿スケジュール管理
6. **タスク管理** - 個人タスク・プロジェクトタスクの進捗管理

---

## 🚀 クイックスタート

### 前提条件
- Node.js 18.x 以上
- Google Cloud プロジェクト
- サービスアカウント（Google Sheets API, Google Analytics Data API, Search Console API）

### セットアップ

1. **依存関係のインストール**
```bash
npm install
```

2. **環境変数の設定**

`.env.local` ファイルを作成し、以下の環境変数を設定:

```bash
# Google Sheets API - サービスアカウント認証
GOOGLE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# スプレッドシートID
SALES_SPREADSHEET_ID=your-sales-spreadsheet-id
YUMEMAGA_SPREADSHEET_ID=your-yumemaga-spreadsheet-id
PARTNERS_SPREADSHEET_ID=your-partners-spreadsheet-id
SNS_SPREADSHEET_ID=your-sns-spreadsheet-id
TASKS_SPREADSHEET_ID=your-tasks-spreadsheet-id

# Google Analytics
GA_PROPERTY_ID=your-ga-property-id

# Google Search Console
SEARCH_CONSOLE_SITE_URL=https://your-site.com

# Microsoft Clarity
CLARITY_API_TOKEN=your-clarity-api-token
MICROSOFT_CLARITY_PROJECT_ID=your-clarity-project-id
```

3. **開発サーバー起動**
```bash
npm run dev
```

4. **ブラウザでアクセス**

http://localhost:3000 を開く

---

## 📊 機能一覧

### 1. 営業進捗管理 (`/dashboard/sales`)
- 営業KPIサマリー（目標・実績・達成率）
- 行動量メトリクス（TEL架電数、企業訪問数、プレゼン実施数）
- 転換率分析（TEL→訪問、訪問→プレゼン、プレゼン→契約）
- ゆめマガ配布状況

### 2. ゆめマガ制作進捗管理 (`/dashboard/yumemaga`)
- 97工程のガントチャート表示
- 月号選択機能
- 外部依存工程のハイライト
- 遅延アラート・進行中工程表示

### 3. パートナー・スターデータ管理 (`/dashboard/partners`)
- スター紹介カード一覧
- 検索・フィルター機能（名前・所属・ふりがな）
- 詳細モーダル（全インタビュー回答表示）

### 4. HP・LLMO分析管理 (`/dashboard/analytics`)
- Google Analytics アクセスサマリー
- Search Console 検索パフォーマンス
- Microsoft Clarity ユーザー行動分析

### 5. SNS投稿管理 (`/dashboard/sns`)
- 投稿予定・投稿履歴テーブル
- フィルター機能（SNS種類・ステータス）
- 期限切れ投稿アラート

### 6. タスク管理 (`/dashboard/tasks`)
- タスク一覧・プロジェクト一覧
- ガントチャート表示
- 遅延タスクアラート
- フィルター機能（ステータス・プロジェクト）

---

## 🗂️ プロジェクト構造

```
yumesuta-management-system/
├── app/
│   ├── api/                      # API Routes
│   │   ├── sales-kpi/           # 営業KPI取得API
│   │   ├── process-schedule/    # 工程スケジュール取得API
│   │   ├── partners/            # パートナー・スターデータ取得API
│   │   ├── analytics/           # 分析データ取得API
│   │   ├── sns/                 # SNS投稿データ取得API
│   │   └── tasks/               # タスクデータ取得API
│   ├── dashboard/               # ダッシュボード画面
│   │   ├── sales/              # 営業進捗管理画面
│   │   ├── yumemaga/           # ゆめマガ制作進捗管理画面
│   │   ├── partners/           # パートナー・スターデータ管理画面
│   │   ├── analytics/          # HP・LLMO分析管理画面
│   │   ├── sns/                # SNS投稿管理画面
│   │   └── tasks/              # タスク管理画面
│   ├── layout.tsx              # ルートレイアウト
│   └── page.tsx                # トップページ
├── lib/
│   ├── google-sheets.ts        # Google Sheets API連携
│   ├── google-analytics.ts     # Google Analytics連携
│   ├── search-console.ts       # Search Console連携
│   └── microsoft-clarity.ts    # Microsoft Clarity連携
├── types/
│   ├── sales.ts                # 営業関連の型定義
│   ├── process.ts              # 工程管理関連の型定義
│   ├── partner.ts              # パートナー・スター関連の型定義
│   ├── analytics.ts            # 分析関連の型定義
│   ├── sns.ts                  # SNS関連の型定義
│   └── task.ts                 # タスク関連の型定義
├── docs/
│   ├── requirements/           # 要件定義書
│   ├── development/            # 開発進捗管理
│   └── setup/                  # セットアップガイド
└── scripts/                    # スプレッドシート自動生成スクリプト
```

---

## 🔧 技術スタック

- **フロントエンド**: Next.js 15.5.4 (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS v4
- **アイコン**: lucide-react
- **データ連携**:
  - Google Sheets API v4
  - Google Analytics Data API
  - Google Search Console API
  - Microsoft Clarity API
- **認証**: Google Cloud サービスアカウント
- **デプロイ**: Vercel (推奨)

---

## 📝 開発コマンド

```bash
# 開発サーバー起動（Turbopack使用）
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# Lint実行
npm run lint
```

---

## 🎯 MVP範囲

### ✅ 実装済み
- Google Sheets API連携（読み取り専用）
- 手動更新方式（更新ボタンクリック時のみAPI呼び出し）
- 6つの主要機能実装
- レスポンシブデザイン

### ❌ MVP範囲外（Phase 2以降）
- 双方向同期（Google Sheetsへの書き込み）
- 自動更新・ポーリング
- 認証機能
- HP自動更新機能
- SNS自動投稿機能

---

## 📚 ドキュメント

### 要件定義
- `docs/requirements/requirements-definition.md` - 要件定義書（v2.0）
- `docs/SYSTEM_OVERVIEW.md` - システム説明文書

### 開発管理
- `docs/development/development-progress.md` - 開発進捗管理
- `docs/development/START_PROMPT.md` - 開発開始ガイド

### セットアップガイド
- `docs/setup/analytics-api-setup.md` - Google Analytics API設定手順

### スプレッドシート設計
- `docs/requirements/investigations/sns-spreadsheet-design.md` - SNS投稿管理スプレッドシート設計
- `docs/requirements/investigations/task-spreadsheet-design.md` - タスク管理スプレッドシート設計

---

## 🚦 MVP完成状況

**Phase 1 完了: 91% (62/68タスク完了)**

- ✅ Phase 1-1: 基盤構築
- ✅ Phase 1-2: 営業進捗管理
- ✅ Phase 1-3: ゆめマガ制作進捗管理
- ✅ Phase 1-4: パートナー・スターデータ管理
- ✅ Phase 1-5: HP・LLMO分析管理
- ✅ Phase 1-6: SNS投稿管理
- ✅ Phase 1-7: タスク管理
- ✅ Phase 1-8: 統合・テスト

---

## 📧 お問い合わせ

プロジェクト責任者: Claude Code
作成日: 2025-10-04
MVP完成日: 2025-10-05

---

## 📄 ライセンス

このプロジェクトは非公開プロジェクトです。

---

**Note**: このシステムは読み取り専用MVPです。データの更新は各スプレッドシートで直接行ってください。
