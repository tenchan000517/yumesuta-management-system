# yumesutaHP 調査結果

**調査日**: 2025-10-04
**パス**: `/mnt/c/yumesutaHP`
**サイズ**: 1.35 GB
**ステータス**: Phase 3 - 補足調査完了

---

## 📊 基本情報

- **プロジェクト名**: yumesutaHP
- **技術スタック**: Next.js (TypeScript)
- **最終更新日**: 2025-10-04
- **ファイル数**: 96 TS/TSXファイル

---

## 📂 ディレクトリ構造

### 主要ディレクトリ
```
/mnt/c/yumesutaHP/
├── docs/                      # ドキュメント
│   ├── business-strategy-memo.md
│   └── handover/
│       └── handover-requirements-definition.md
├── public/                    # 公開ファイル
│   └── img/                   # 画像ファイル
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── about/             # ゆめスタ概要
│   │   ├── api/               # API Routes
│   │   ├── articles/          # ガイド記事
│   │   ├── career-guide/      # 就活ガイド（高校生向け）
│   │   ├── companies/         # パートナー企業ページ
│   │   ├── company/           # 企業概要
│   │   ├── contact/           # お問い合わせ
│   │   ├── dashboard/         # ダッシュボード（既存）
│   │   ├── employment-data/   # 雇用データ
│   │   ├── initiatives/       # 事業内容
│   │   ├── kosotsusaiyo/      # 高卒採用ガイド（企業向け）
│   │   ├── partners/          # ゆめスタパートナー一覧
│   │   ├── privacy/           # プライバシーポリシー
│   │   ├── reports/           # 活動報告
│   │   ├── stars/             # スター紹介
│   │   ├── terms/             # 利用規約
│   │   ├── test-spread/       # スプレッドシート連携テスト
│   │   └── yumemaga/          # ゆめマガ一覧
│   ├── components/            # コンポーネント
│   ├── config/                # 設定
│   ├── content/               # コンテンツ（MD/HTML）
│   ├── data/                  # データファイル
│   ├── hooks/                 # カスタムフック
│   ├── lib/                   # ライブラリ
│   └── utils/                 # ユーティリティ
└── README.md
```

---

## 🌐 主要ページ・コンテンツ構造

### 1. ゆめマガ一覧ページ (`/yumemaga`)
- **ファイル**: `src/app/yumemaga/page.tsx`
- **機能**: ゆめマガの月号別PDF一覧表示
- **データソース**: ハードコード（配列データ）
- **月号**: 10月号、8月号、7月号（2025年）
- **表示内容**:
  - サムネイル画像（`/img/yumemaga/top/[月号].png`）
  - タイトル、説明、ファイルサイズ、発行日
  - PDFダウンロードリンク

**現在の課題**:
- 月号データがハードコード
- 新号追加時に手動更新が必要
- ゆめマガディレクトリとの連動なし

### 2. パートナー一覧ページ (`/partners`)
- **ファイル**: `src/app/partners/page.tsx`
- **データソース**: `src/app/partners/partner-data.ts`
- **データ構造**:
  ```typescript
  interface Partner {
    id: string
    name: string
    organization: string
    jobTitle?: string
    category: 'corporation' | 'education' | 'association' | 'individual'
    image: string
    description?: string
    message?: string
  }
  ```
- **表示内容**: パートナー企業・個人の紹介カード
- **現在の連携**: ゆめマガディレクトリのスプレッドシートと**同じデータソース**を使用（スプレッドシートID: `12A5mroEA5ipsIM88y4GOTmK61-V95bnAV5eTEhejvpc`）

**現在の課題**:
- データがTSファイルにハードコード
- スプレッドシート更新時に手動反映が必要

### 3. スター紹介ページ (`/stars`)
- **ファイル**: `src/app/stars/page.tsx`
- **データソース**: `src/app/stars/star-data.ts`
- **データ構造**:
  ```typescript
  interface Star {
    id: string
    name: string
    nameEn: string
    organization: string
    jobTitle?: string
    catchphrase: string[]
    image: string
    websiteUrl?: string
    category: 'entrepreneur' | 'employee' | 'student' | 'freelancer' | 'educator'
    industry: string
    region: string
    keywords: string[]
  }
  ```
- **表示内容**: スター（活躍する若者）の紹介カード
- **現在の連携**: ゆめマガディレクトリのスプレッドシートと**同じデータソース**を使用（スプレッドシートID: `12A5mroEA5ipsIM88y4GOTmK61-V95bnAV5eTEhejvpc`）

**現在の課題**:
- データがTSファイルにハードコード
- スプレッドシート更新時に手動反映が必要

### 4. 企業ページ (`/companies`)
- **ファイル**: `src/app/companies/page.tsx`
- **データソース**: `src/app/companies/company-data.ts`
- **表示内容**: ゆめマガ掲載企業の詳細ページ
- **現在の連携**: パートナーデータと連動

### 5. ガイド記事（企業向け・高校生向け）

#### 企業向け（`/kosotsusaiyo`）
- 高卒採用完全ガイド
- 実践ガイド
- 費用分析
- FAQ
- スケジュール
- 高校vs大学比較

#### 高校生向け（`/career-guide`）
- 就活ガイド
- 会社研究
- 履歴書・面接対策
- FAQ
- スケジュール

**活用先**（business-strategy-memoより）:
- Instagram投稿用コンテンツ
- X投稿用コンテンツ
- 被リンク獲得用コンテンツ

### 6. 既存ダッシュボード (`/dashboard`)
- **ファイル**: `src/app/dashboard/page.tsx`
- **既存機能**: 企業管理機能（基本的なダッシュボード）
- **注意**: 統合マネジメントダッシュボードとは別物

---

## 📱 SNS連携の現状

### 1. SNSシェア機能
- **ファイル**: `src/components/ShareButtons.tsx`
- **対応プラットフォーム**:
  - Twitter/X
  - Facebook
  - Instagram（テキストコピー→アプリ誘導）
  - LINE
  - URLコピー
  - ネイティブシェア（Web Share API）

**実装内容**:
- 記事URLのシェア
- OGP対応
- モバイル/デスクトップ対応

### 2. Instagram埋め込み機能
- **ファイル**: `src/components/InstagramEmbed.tsx`
- **機能**: Instagramの投稿をページ内に埋め込み表示
- **技術**: `react-social-media-embed`ライブラリ使用
- **最適化**: Intersection Observer（遅延ロード）

### 3. Footer SNSリンク
- **ファイル**: `src/components/layout/Footer.tsx`
- **リンク先**: `https://www.instagram.com/yumesuta_co.ltd/`
- **表示**: Instagramアイコンのみ

---

## 🎯 SNS戦略（business-strategy-memoより）

### プラットフォーム別戦略

| プラットフォーム | 優先度 | 用途 | ターゲット |
|---|---|---|---|
| **X (Twitter)** | ★★★ 最高 | 被リンク獲得 + 企業向け発信 | 企業採用担当者 |
| **Instagram** | ★★☆ 高 | 企業向け発信 | 企業採用担当者 + 高校生 |
| **TikTok** | ★☆☆ 中 | 念のため視野に入れる | 高校生 |

### 運用アカウント構成（計画）

#### 1. ゆめスタ公式アカウント
- **ターゲット**: 高校生向け
- **プラットフォーム**: Instagram + X
- **コンテンツ**:
  - ロールモデル発信
  - 仕事のリアル紹介
  - キャリア情報

#### 2. 企業向けアカウント
- **ターゲット**: 企業の採用担当者
- **プラットフォーム**: X + Instagram併用
- **コンテンツ**:
  - 高卒採用のメリット
  - 採用市場トレンド
  - 採用市場予測

#### 3. 被リンク獲得用アカウント（X）
- **目的**: SEO/LLMO対策の被リンク獲得
- **運用**: 複数アカウント運用
- **コンテンツソース**: yumesutaHPのガイド記事

### SNSコンテンツソース
- **企業向けガイド記事**（`/kosotsusaiyo`配下）
- **高校生向けガイド記事**（`/career-guide`配下）
- **活動報告**（`/reports`配下）
- **パートナー紹介**（`/partners`）
- **スター紹介**（`/stars`）

---

## 🔗 統合ダッシュボードへの連携仕様（検討材料）

### 1. コンテンツ連動機能

#### ゆめマガ新号追加 → サイト自動更新
**現状**:
- ゆめマガ一覧（`/yumemaga`）は手動更新

**統合ダッシュボードでの理想**:
- ゆめマガディレクトリに新号PDF追加 → 自動検出
- サムネイル自動生成
- yumesutaHPのゆめマガ一覧ページに自動反映

**技術検討**:
- ファイル監視 or 手動トリガー
- PDF→画像変換（サムネイル生成）
- Next.jsのISR（Incremental Static Regeneration）

#### パートナー企業・スター紹介追加 → サイト・ゆめマガ連動
**現状**:
- パートナーデータ・スターデータはTSファイルにハードコード
- スプレッドシート（`12A5mroEA5ipsIM88y4GOTmK61-V95bnAV5eTEhejvpc`）と手動で同期

**統合ダッシュボードでの理想**:
- スプレッドシート更新 → 自動検出
- yumesutaHPに自動反映
- ゆめマガ制作時に自動連携

**技術検討**:
- Google Sheets API連携（既にゆめマガ調査で確認済み）
- Webhook or ポーリング
- データキャッシュ（Redis or In-Memory）

### 2. SNSコンテンツ管理機能

#### サイトガイド記事 → SNS投稿用コンテンツ変換
**統合ダッシュボードでの理想**:
- ガイド記事をSNS投稿用に自動変換
- テキスト要約・画像生成
- 投稿スケジュール管理
- Instagram・X・TikTok用フォーマット変換

**技術検討**:
- AI要約（Claude API）
- OGP画像自動生成
- 投稿予約機能
- 複数アカウント管理

#### 投稿スケジュール・効果測定
**統合ダッシュボードでの理想**:
- 投稿カレンダー
- エンゲージメント分析
- 被リンク効果測定
- アカウント別パフォーマンス

**技術検討**:
- Instagram Graph API / X API連携
- アナリティクスデータ取得
- ダッシュボード可視化

### 3. HP更新管理

#### 現在のHP運用タスク（business-strategy-memoより）
- サイトコンテンツ更新
- SEO/LLMO最適化
- 問い合わせ対応

**統合ダッシュボードでの理想**:
- コンテンツ更新履歴管理
- SEO/LLMO順位トラッキング
- 問い合わせ管理（CRM連携）

---

## 📌 統合ダッシュボードMVP範囲への影響

### MVP範囲内（Phase 1）
1. ✅ **ゆめマガ制作進捗管理**
   - Phase4逆算スケジューラー連携
   - yumesutaHPへの影響なし（スプレッドシート連携のみ）

2. ✅ **パートナー・スターデータ管理**
   - Google Sheets API連携（読み取り専用）
   - yumesutaHPのデータソース（`partner-data.ts`、`star-data.ts`）を**将来的に**API経由に変更可能
   - **MVP範囲**: データ表示のみ（統合ダッシュボード上）
   - **Phase 2以降**: yumesutaHPへの自動反映機能

3. ✅ **営業進捗管理**
   - Google Sheets API連携（読み取り専用）
   - yumesutaHPへの影響なし

### MVP範囲外（Phase 2以降）
1. ❌ **ゆめマガ新号追加 → サイト自動更新**
   - 自動検出・サムネイル生成・自動反映

2. ❌ **SNSコンテンツ管理機能**
   - 記事→SNS投稿変換
   - 投稿スケジュール管理
   - 効果測定

3. ❌ **HP更新管理機能**
   - コンテンツ更新履歴
   - SEO/LLMO順位トラッキング

---

## 🔍 調査結果サマリー

### yumesutaHPの役割
- **ゆめスタの公式HP**（稼働中）
- **主要機能**:
  - ゆめマガ一覧表示
  - パートナー企業・スター紹介
  - 企業向け・高校生向けガイド記事
  - 活動報告
  - お問い合わせ
- **技術**: Next.js（App Router）+ TypeScript

### 統合ダッシュボードとの関係
- **データソース共有**:
  - パートナー・スターデータ（スプレッドシート: `12A5mroEA5ipsIM88y4GOTmK61-V95bnAV5eTEhejvpc`）
- **MVP範囲**:
  - ✅ データ表示のみ（統合ダッシュボード内）
  - ❌ yumesutaHPへの自動反映機能は**Phase 2以降**
- **Phase 2以降の拡張**:
  - ゆめマガ新号追加 → サイト自動更新
  - パートナー・スター追加 → サイト自動反映
  - SNSコンテンツ管理機能
  - HP更新管理機能

### SNS連携の可能性
- **既存機能**: シェアボタン、Instagram埋め込み
- **SNS戦略**:
  - X（被リンク獲得 + 企業向け発信）: 優先度 最高
  - Instagram（企業向け + 高校生向け発信）: 優先度 高
  - TikTok（高校生向け発信）: 優先度 中
- **コンテンツソース**: ガイド記事（企業向け・高校生向け）
- **Phase 2以降の拡張**:
  - SNS投稿管理機能
  - 投稿スケジューラー
  - エンゲージメント分析
  - 複数アカウント管理

---

## ✅ 次のアクション

### 完了
- [x] yumesutaHPのコンテンツ構造再確認
- [x] SNS連携の検討材料確認
- [x] 調査結果のドキュメント化

### 次のタスク
- [ ] progress-tracker.mdを更新
- [ ] ユーザーに報告・確認
- [ ] Phase 4（要件定義書作成）への移行準備

---

**調査者**: Claude Code
**調査日**: 2025-10-04
**ステータス**: Phase 3完了 → Phase 4（要件定義書作成）準備完了
