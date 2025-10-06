# Phase 3開発 - スタートプロンプト

**作成日**: 2025-10-05
**用途**: Phase 3開発作業の開始時に使用
**前提**: Phase 1 MVP完成済み、Phase 2タスク管理機能完成済み

---

## 🎯 このプロンプトの目的

次世代Claude CodeがPhase 3開発作業を開始・継続する際に、以下を即座に把握できるようにする:
1. Phase 3の目的と方針
2. Phase 1・Phase 2からの引き継ぎ事項
3. 開発の進め方・絶対に守るべき原則
4. 次に何をすべきか

---

## 📋 Phase 3作業開始時のプロンプト（コピペ用）

```
# 統合マネジメントシステム Phase 3開発 - 作業開始

以下のドキュメントを読んで、Phase 3開発を開始してください。

## 必読ドキュメント（優先順）
1. `/mnt/c/yumesuta-management-system/docs/development/phase3-requirements.md` - Phase 3要件定義・方針書（最重要）
2. `/mnt/c/yumesuta-management-system/docs/development/phase3-progress.md` - Phase 3開発進捗管理（現在地）
3. `/mnt/c/yumesuta-management-system/docs/development/phase3-system-inventory.md` - Phase 3システム棚卸し（現状とギャップ分析）
4. `/mnt/c/yumesuta-management-system/docs/development/phase2-requirements.md` - Phase 2要件定義（参考）
5. `/mnt/c/yumesuta-management-system/CLAUDE.md` - プロジェクト指示書

## Phase 3の最重要目的
**「マネージャーが一人で大企業クラスの仕事・プロジェクトを管理・実行できる管理システム」を構築すること**

## Phase 3で達成すること
1. **「すぐに出てくる」機能の全機能展開**
2. **タスク管理の実運用化**
3. **請求書発行・入金管理機能**
4. **ゆめマガ制作の次アクション明確化**
5. **営業PDCA強化**

## 絶対に守るべき原則

### ❌ やってはいけないこと
- 良かれと思って無駄な機能を追加して複雑にする事
- リアルタイム性の導入（WebhookやWebsocket、AWS等が必要な場合、本質からズレる）
- 自動化を優先する（自動化は解決策ではない）
- むしろ把握に時間がかかる複雑化

### ✅ やるべきこと
- 「把握スピード・作業に入るまでのスピード」を最優先
  - 該当CANVAURLがすぐに出てくる
  - 該当スプレッドシートがすぐ出てくる
  - 該当作業パスがすぐに出てくる
  - 該当関連URLがすぐに出てくる
  - 該当情報がすぐに出てくる
  - 該当箇所がすぐにわかる
- ゆめスタの仕事を完全に理解すること
- マネージャーの仕事を全て完全に理解すること
- シンプルに・動くものを優先
- 技術的複雑度を増さない
- 不明点は必ずユーザーに確認
- 段階的に実装・テスト（一気に作らない）

## 🔒 Phase 2で確定した設計方針（必ず守ること）

Phase 2調査1の結果、以下の設計方針が確定しました。**Phase 3でも必ず遵守してください**。

### パートナー・画像管理の原則
1. **画像保存場所**: Xserver（`https://yumesuta.com/partner-images/`）の**1箇所のみ**
   - ❌ yumesutaHPの`/public/img/`に画像をコピー**しない**
   - ❌ マネジメントシステムに重複保存**しない**
   - ✅ 全システムが同じURLを参照（一貫性保証）

2. **データマスター**: Google Sheets = 唯一の真実
   - 全ての更新はGoogle Sheetsで実施
   - yumesutaHPは読み取り専用・表示のみ
   - 画像URLもGoogle Sheetsに保存

3. **同期方式**: 手動更新（スタートプロンプト実行）
   - ❌ 自動同期・リアルタイム更新は導入**しない**
   - ❌ Webhook・Websocket・AWSは不要
   - ✅ スタートプロンプトによる明示的な更新

4. **yumesutaHPの構造**: 静的TypeScriptファイル
   - ❌ API連携**しない**
   - ❌ データベース接続**しない**
   - ✅ 静的データ・ビルド時解決

### この方針が他の機能に与える影響
- **タスク管理**: 同様にGoogle Sheets = マスター、手動更新方式
- **ゆめマガ制作工程**: 同様に手動更新、リアルタイム性不要
- **全機能**: 「該当URLがすぐ出てくる」は自動化ではなく表示の工夫で実現

## 📊 Phase 3実装優先順位

### Phase 3-1: 「すぐに出てくる」機能の全機能展開（最優先）
- 営業進捗管理: 営業先スプレッドシート・ゆめマガ配布管理へのリンク
- ゆめマガ: 関連CANVA・ファイルパス・スプレッドシートへのリンク
- HP・LLMO: Search Console・GA4・Clarityへの直リンク
- SNS: CANVA URL・投稿先SNSへのリンク
- パートナー: 各パートナー企業URL・管理スプレッドシートへのリンク

### Phase 3-2: タスク管理の実運用化（優先）
- タスク完了ボタン実装
- 定期タスクスケジュールへのデータ入力
- プロジェクトタスクへのデータ入力
- タスク実施履歴の記録機能

### Phase 3-3: 請求書発行・入金管理機能（優先）
- マネーフォワード連携再検討
- 請求書発行機能
- 入金確認機能
- 未入金アラート機能

### Phase 3-4以降: その他機能強化（通常）
- ゆめマガ制作の次アクション明確化
- 営業PDCA強化
- HP・LLMO分析の実効性向上
- SNS投稿の実作業サポート

## ⚠️ 重要な注意事項

### Phase 1・Phase 2からの継続事項
- ✅ Google Sheets API v4を使用
- ✅ サービスアカウント認証（JSON key）
- ✅ Next.js (TypeScript) + React
- ✅ lucide-reactアイコンのみ使用
- ✅ シンプルに・動くものを優先

### Phase 3で新規に追加する可能性のある技術
- マネーフォワード API連携（Phase 3-3で再検討）
- Google Sheets書き込み機能（タスク完了ボタン用）

### 絶対に避けるべき技術
- ❌ Webhook・Websocket
- ❌ AWS（Lambda・DynamoDB等）
- ❌ リアルタイムデータベース
- ❌ 複雑な認証システム

## 📂 Phase 3プロジェクト構造

```
C:\yumesuta-management-system\
├── docs/
│   ├── development/
│   │   ├── phase3-start-prompt.md               # このファイル
│   │   ├── phase3-requirements.md               # Phase 3要件定義・方針書
│   │   ├── phase3-progress.md                   # Phase 3開発進捗管理
│   │   ├── phase3-system-inventory.md           # Phase 3システム棚卸し
│   │   ├── phase2-*.md                          # Phase 2ドキュメント（参考）
│   │   └── phase1-*.md                          # Phase 1ドキュメント（参考）
│   ├── requirements/
│   │   └── requirements-definition.md           # 要件定義書（v2.0）
│   └── SYSTEM_OVERVIEW.md                       # システム説明文書
├── app/
│   ├── page.tsx                                 # 統合ダッシュボード
│   ├── dashboard/
│   │   ├── sales/                               # 営業進捗管理画面
│   │   ├── yumemaga/                            # ゆめマガ制作進捗管理画面
│   │   ├── partners/                            # パートナー・スターデータ
│   │   ├── analytics/                           # HP・LLMO分析管理
│   │   ├── sns/                                 # SNS投稿管理
│   │   └── tasks/                               # タスク管理
│   └── api/
│       ├── sales-kpi/                           # 営業KPI取得API
│       ├── process-schedule/                    # 工程スケジュール取得API
│       ├── partners/                            # パートナー・スターデータ取得API
│       ├── analytics/                           # 分析データ取得API
│       ├── sns/                                 # SNS投稿データ取得API
│       └── tasks/                               # タスクデータ取得API
├── lib/
│   ├── google-sheets.ts                         # Google Sheets API連携
│   ├── google-analytics.ts                      # Google Analytics連携
│   ├── search-console.ts                        # Search Console連携
│   └── microsoft-clarity.ts                     # Microsoft Clarity連携
├── types/
│   ├── sales.ts                                 # 営業KPI・メトリクス型定義
│   ├── process.ts                               # 工程・ガントチャート型定義
│   ├── partner.ts                               # パートナー・スター型定義
│   ├── analytics.ts                             # 分析データ型定義
│   ├── sns.ts                                   # SNS投稿型定義
│   └── task.ts                                  # タスク型定義
└── .env.local                                   # 環境変数
```

---

## 🔄 Phase 3開発フロー

### Step 0: ドキュメント準備（完了）
- [x] Phase 3要件定義書作成
- [x] Phase 3スタートプロンプト作成
- [x] Phase 3進捗管理ドキュメント作成
- [x] Phase 3システム棚卸し作成

### Step 1: Phase 3-1（「すぐに出てくる」機能全機能展開）
- [ ] 営業進捗管理の「すぐに出てくる」機能実装
- [ ] ゆめマガ制作進捗管理の「すぐに出てくる」機能実装
- [ ] HP・LLMO分析管理の「すぐに出てくる」機能実装
- [ ] SNS投稿管理の「すぐに出てくる」機能実装
- [ ] パートナー・スター管理の「すぐに出てくる」機能実装

### Step 2: Phase 3-2（タスク管理実運用化）
- [ ] タスク完了ボタン実装
- [ ] 定期タスクスケジュールへのデータ入力
- [ ] プロジェクトタスクへのデータ入力
- [ ] タスク実施履歴の記録機能実装

### Step 3: Phase 3-3（請求書発行・入金管理）
- [ ] マネーフォワード連携再検討
- [ ] 請求書発行機能実装
- [ ] 入金確認機能実装
- [ ] 未入金アラート機能実装

### Step 4: Phase 3-4以降（その他機能強化）
- [ ] ゆめマガ制作の次アクション明確化
- [ ] 営業PDCA強化
- [ ] HP・LLMO分析の実効性向上
- [ ] SNS投稿の実作業サポート

---

## 📝 Phase 1・Phase 2からの引き継ぎ

### Phase 1で完成した機能（継続使用）
- ✅ 営業進捗管理（読み取り専用）
- ✅ ゆめマガ制作進捗管理（読み取り専用）
- ✅ パートナー・スターデータ管理（読み取り専用）
- ✅ HP・LLMO分析管理（読み取り専用）
- ✅ SNS投稿管理（読み取り専用）
- ✅ 統合ダッシュボード（トップページ）

### Phase 2で完成した機能（継続使用）
- ✅ タスク管理機能（35タスク・4タブ構成）
- ✅ 「すぐに出てくる」機能（タスク管理のみ）
- ✅ 抜けもれ防止機能（タスク管理のみ）

### Phase 1・Phase 2で守った原則（Phase 3でも継続）
- ❌ 過度な最適化・複雑化は避ける
- ❌ 勝手に機能を追加しない
- ❌ 要件定義にない実装をしない
- ❌ 絵文字の使用禁止（例外: ステータス表示のみ）
- ✅ アイコンはlucide-reactのみ使用
- ✅ シンプルに・動くものを優先
- ✅ 不明点は必ずユーザーに確認
- ✅ 段階的に実装・テスト（一気に作らない）

---

## 💡 次世代Claude Codeへ

このスタートプロンプトを使って、Phase 3開発作業を開始してください。

**最重要**:
1. **phase3-requirements.mdを必ず確認** - Phase 3の方針を理解
2. **phase3-system-inventory.mdを必ず確認** - 現状とギャップを理解
3. **「すぐに出てくる」機能を全機能に展開** - これが最優先
4. **把握スピード・作業着手スピードを最優先** - 自動化ではない
5. **技術的複雑度を増さない** - シンプルに

頑張ってください。

---

**作成者**: Claude Code (2025-10-05)
**最終更新**: 2025-10-05
**レビュー**: Phase 3開発開始前に必読
**更新**: Phase 3開発進捗に応じて更新
