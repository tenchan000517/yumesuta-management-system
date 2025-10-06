# 統合マネジメントシステム MVP開発 - スタートプロンプト

**作成日**: 2025-10-04
**用途**: 複数セッションにまたがるMVP開発作業の開始時に使用

---

## 🎯 このプロンプトの目的

次世代Claude CodeがMVP開発作業を継続する際に、以下を即座に把握できるようにする:
1. 現在の開発状況
2. 実施中のタスク
3. 開発の進め方・原則
4. 次に何をすべきか

---

## 📋 作業開始時のプロンプト（コピペ用）

```
# 統合マネジメントシステム MVP開発 - 作業再開

以下のドキュメントを読んで、開発を継続してください。

## 必読ドキュメント（優先順）
1. `/mnt/c/yumesuta-management-system/docs/development/development-progress.md` - 開発進捗管理（最重要・現在地）
2. `/mnt/c/yumesuta-management-system/docs/requirements/requirements-definition.md` - 要件定義書（v2.0）
3. `/mnt/c/yumesuta-management-system/docs/SYSTEM_OVERVIEW.md` - システム説明文書
4. `/mnt/c/yumesuta-management-system/docs/business-strategy-memo.md` - ビジネス戦略メモ

## 作業の進め方
1. development-progress.mdで現在の進捗を確認
2. 次にやるべき開発タスクを特定
3. 実装を進める
4. テスト・動作確認
5. development-progress.mdを更新
6. ユーザーに報告・確認

## 絶対に守るべき原則
- ❌ 過度な最適化・複雑化は避ける（MVP範囲を守る）
- ❌ 勝手に機能を追加しない
- ❌ 要件定義にない実装をしない
- ❌ 絵文字の使用禁止（例外: ステータス表示の✅順調・⚠遅れのみ使用可）
- ✅ アイコンはlucide-reactのみ使用
- ✅ シンプルに・動くものを優先
- ✅ 手動更新方式を守る（ポーリング・自動同期はMVP範囲外）
- ✅ 読み取り専用を守る（書き込みはMVP範囲外）
- ✅ 不明点は必ずユーザーに確認
- ✅ 段階的に実装・テスト（一気に作らない）

## MVP範囲の確認
- ✅ Google Sheets API連携（読み取り専用）
- ✅ 手動更新（更新ボタンクリック時のみAPI呼び出し）
- ✅ 6つの機能を実装
- ❌ 双方向同期（Phase 2）
- ❌ 自動更新・ポーリング（Phase 2）
- ❌ 認証機能（MVP範囲外）

development-progress.mdを読んで、次のタスクを教えてください。
```

---

## 📂 プロジェクト構造

```
C:\yumesuta-management-system\
├── docs/
│   ├── development/
│   │   ├── START_PROMPT.md                      # このファイル
│   │   ├── development-progress.md              # 開発進捗管理
│   │   └── handover/                            # 引き継ぎ書格納フォルダ
│   ├── requirements/
│   │   ├── requirements-definition.md           # 要件定義書（v2.0）
│   │   └── investigations/                      # 調査結果
│   ├── SYSTEM_OVERVIEW.md                       # システム説明文書
│   └── business-strategy-memo.md                # ビジネス戦略メモ
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── sales/                           # 営業進捗管理画面
│   │   │   ├── yumemaga/                        # ゆめマガ制作進捗管理画面
│   │   │   ├── partners/                        # パートナー・スターデータ
│   │   │   ├── analytics/                       # HP・LLMO分析管理
│   │   │   ├── sns/                             # SNS投稿管理
│   │   │   ├── tasks/                           # タスク管理
│   │   │   └── page.tsx                         # ダッシュボードトップ
│   │   ├── api/
│   │   │   ├── sales-kpi/                       # 営業KPI取得API
│   │   │   ├── process-schedule/                # 工程スケジュール取得API
│   │   │   ├── partners/                        # パートナー・スターデータ取得API
│   │   │   ├── analytics/                       # 分析データ取得API
│   │   │   ├── sns/                             # SNS投稿データ取得API
│   │   │   └── tasks/                           # タスクデータ取得API
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── google-sheets.ts                     # Google Sheets API連携
│   │   ├── google-analytics.ts                  # Google Analytics連携
│   │   ├── search-console.ts                    # Search Console連携
│   │   └── microsoft-clarity.ts                 # Microsoft Clarity連携
│   ├── components/
│   │   ├── SalesKPICard.tsx                     # 営業KPIカード
│   │   ├── ProcessGanttChart.tsx                # ガントチャート
│   │   ├── PartnerCard.tsx                      # パートナーカード
│   │   ├── AnalyticsDashboard.tsx               # 分析ダッシュボード
│   │   ├── SNSCalendar.tsx                      # SNS投稿カレンダー
│   │   └── TaskList.tsx                         # タスク一覧
│   └── types/
│       └── index.ts                             # TypeScript型定義
├── .env.local                                   # 環境変数（サービスアカウントJSON key等）
├── package.json
└── README.md
```

---

## 🔄 開発フロー

### Phase 1-1: 基盤構築（1週間）
- [ ] Next.jsプロジェクトセットアップ
- [ ] Google Sheets API連携実装
- [ ] サービスアカウント認証設定
- [ ] API Routes実装（手動更新方式）
- [ ] 環境変数設定
- [ ] 動作確認

### Phase 1-2: 営業進捗管理機能（1-2週間）
- [ ] 営業管理スプレッドシート連携確認
- [ ] 営業KPIデータ取得API実装（`/api/sales-kpi`）
- [ ] 営業進捗管理画面実装（`/dashboard/sales`）
- [ ] KPIサマリー表示
- [ ] 契約・入金状況一覧表示
- [ ] 遅延アラート表示
- [ ] 動作確認

### Phase 1-3: ゆめマガ制作進捗管理機能（1-2週間）
- [ ] Phase4スケジューラーデータ取得API実装（`/api/process-schedule`）
- [ ] ゆめマガ制作進捗管理画面実装（`/dashboard/yumemaga`）
- [ ] スケジュールテーブル表示
- [ ] ガントチャート表示
- [ ] 外部依存工程ハイライト実装
- [ ] 遅延アラート実装
- [ ] 月号選択機能実装
- [ ] 動作確認

### Phase 1-4: パートナー・スターデータ管理機能（1週間）
- [ ] パートナー・スターデータ取得API実装（`/api/partners`）
- [ ] パートナー・スターデータ管理画面実装（`/dashboard/partners`）
- [ ] パートナー企業一覧表示
- [ ] スター紹介一覧表示
- [ ] 検索・フィルタリング機能
- [ ] 詳細表示機能
- [ ] 動作確認

### Phase 1-5: HP・LLMO分析管理機能（1週間）
- [ ] Google Analytics Data API連携実装
- [ ] Google Search Console API連携実装
- [ ] Microsoft Clarity連携実装（可能な場合）
- [ ] 分析データ取得API実装（`/api/analytics`）
- [ ] HP・LLMO分析管理画面実装（`/dashboard/analytics`）
- [ ] アクセスサマリー表示
- [ ] 検索パフォーマンス表示
- [ ] ユーザー行動分析表示（可能な場合）
- [ ] 動作確認

### Phase 1-6: SNS投稿管理機能（1週間）
- [ ] SNS投稿管理スプレッドシート設計・作成
- [ ] SNS投稿データ取得API実装（`/api/sns`）
- [ ] SNS投稿管理画面実装（`/dashboard/sns`）
- [ ] 投稿カレンダー表示
- [ ] 投稿履歴一覧表示
- [ ] 投稿予定一覧表示
- [ ] 未投稿アラート表示
- [ ] 動作確認

### Phase 1-7: タスク管理機能（1週間）
- [ ] タスク管理スプレッドシート設計・作成
- [ ] タスクデータ取得API実装（`/api/tasks`）
- [ ] タスク管理画面実装（`/dashboard/tasks`）
- [ ] タスク一覧表示
- [ ] ガントチャート表示
- [ ] 遅延アラート表示
- [ ] プロジェクト管理表示
- [ ] 動作確認

### Phase 1-8: 統合・テスト（1週間）
- [ ] 全機能の統合
- [ ] エラーハンドリング実装
- [ ] パフォーマンス最適化
- [ ] ユーザーテスト・フィードバック
- [ ] バグ修正
- [ ] ドキュメント更新
- [ ] MVP完成

---

## 🎯 開発優先順位

### 最優先（Phase 1-1 → 1-2）
1. **基盤構築** - Google Sheets API連携・認証設定
2. **営業進捗管理機能** - 最重要機能

### 優先（Phase 1-3 → 1-4）
3. **ゆめマガ制作進捗管理機能** - 複雑な工程管理
4. **パートナー・スターデータ管理機能** - データ確認機能

### 通常（Phase 1-5 → 1-7）
5. **HP・LLMO分析管理機能** - 外部API連携
6. **SNS投稿管理機能** - スプレッドシート設計から
7. **タスク管理機能** - スプレッドシート設計から

### 最終（Phase 1-8）
8. **統合・テスト** - 全体の品質保証

---

## ⚠️ 重要な注意事項

### MVP範囲を守る
- ✅ **読み取り専用**: Google Sheetsへの書き込みは不要
- ✅ **手動更新**: 更新ボタンクリック時のみAPI呼び出し
- ✅ **認証不要**: ローカル環境 or VPC内での運用を想定
- ❌ **双方向同期**: Phase 2以降
- ❌ **自動更新・ポーリング**: Phase 2以降

### 段階的な実装
- 一気に全機能を作らない
- 1機能ずつ実装 → テスト → 次の機能
- ユーザーに確認しながら進める

### シンプルさを優先
- 過度な最適化は避ける
- 複雑な設計は避ける
- 動くものを優先

### データソースの確認
- スプレッドシートIDの確認
- API認証情報の確認
- 不明点はユーザーに確認

---

## 📊 期待される成果

### Phase 1-1完了後
- ✅ Google Sheets API連携が動作
- ✅ サービスアカウント認証が完了
- ✅ 基本的なAPI Routesが実装済み

### Phase 1-2～1-7完了後
- ✅ 各機能が個別に動作
- ✅ ユーザーがデータを確認可能
- ✅ 遅延アラート等が機能

### Phase 1-8完了後
- ✅ 全機能が統合されて動作
- ✅ エラーハンドリングが完了
- ✅ ユーザーテスト完了
- ✅ MVP完成

---

## 🔧 技術スタック

```
フロントエンド: Next.js (TypeScript) + React
バックエンド: Next.js API Routes
データ連携:
  - Google Sheets API v4
  - Google Analytics Data API
  - Google Search Console API
  - Microsoft Clarity API（可能な場合）
認証: サービスアカウント（JSON key）
デプロイ: Vercel or AWS
```

---

## 📁 関連ドキュメント

- `/mnt/c/yumesuta-management-system/docs/development/development-progress.md` - 開発進捗管理（このファイルを作成）
- `/mnt/c/yumesuta-management-system/docs/requirements/requirements-definition.md` - 要件定義書（v2.0）
- `/mnt/c/yumesuta-management-system/docs/SYSTEM_OVERVIEW.md` - システム説明文書
- `/mnt/c/yumesuta-management-system/docs/business-strategy-memo.md` - ビジネス戦略メモ

---

**作成者**: Claude Code (2025-10-04)
**レビュー**: 開発開始前に必読
**更新**: 開発進捗に応じて更新

---

## 💡 次世代Claude Codeへ

このスタートプロンプトを使って、開発作業を継続してください。

**重要**:
1. **development-progress.mdを必ず確認** - 現在地を把握
2. **MVP範囲を守る** - 過度な最適化・機能追加は禁止
3. **段階的に実装** - 一気に作らない
4. **ユーザーに確認** - 不明点は必ず確認

頑張ってください。
