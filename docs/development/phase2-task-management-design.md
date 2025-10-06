# Phase 2 - タスク管理機能 詳細設計書

**作成日**: 2025-10-05
**ステータス**: Phase 2-2設計フェーズ
**前提**: Phase 2-1調査フェーズ完了（調査1〜6・35タスク抽出完了）

---

## 📋 目次

1. [設計概要](#設計概要)
2. [タスク統合結果](#タスク統合結果)
3. [スプレッドシート設計](#スプレッドシート設計)
4. [TypeScript型定義](#typescript型定義)
5. [ダッシュボード設計](#ダッシュボード設計)
6. [API設計](#api設計)

---

## 設計概要

### 目的（phase2-requirements.mdより）

**「マネージャー自身が行わなければならないタスクを行うため」**

- 管理だけでなく、実際に作業を行うためのシステム
- 営業が行う作業以外の全ての作業はマネージャーが行う
- 請求書の発行、顧客管理も含む

### Phase 2の本質（絶対に守ること）

**❌ 自動化は解決策ではない**

効率化の本質は「**把握スピード・作業に入るまでのスピード**」:
- 該当CANVAURLがすぐに出てくる
- 該当スプレッドシートがすぐ出てくる
- 該当作業パスがすぐに出てくる
- 該当関連URLがすぐに出てくる
- 該当情報がすぐに出てくる
- 該当箇所がすぐにわかる

**抜けもれ防止**:
- やることが多いと全てのタスク・プロジェクトが抜けもれしがち
- システムで抜けもれを防ぐ

**技術的複雑度を増さない**:
- ❌ リアルタイム性の導入（Webhook・Websocket・AWS等）は不要
- ✅ 手動更新方式（「更新」ボタンクリック）
- ✅ シンプルに・動くものを優先

### 確定設計方針（調査1の原則を継承）

1. **データマスター**: Google Sheets = 唯一の真実
2. **同期方式**: 手動更新（「更新」ボタンクリック時にAPI呼び出し）
3. **技術的複雑度**: 増さない（既存ライブラリの拡張のみ）

---

## タスク統合結果

### 調査1〜6で抽出した全タスク（35タスク）

#### 調査1: パートナー・スターデータ管理（6タスク）
1. Google Sheetsにパートナー基本情報入力（不定期・15〜20分）
2. パートナー画像の準備・配置（不定期・5分）
3. 画像処理スクリプト実行（不定期・2〜3分）
4. Xserverに画像アップロード（不定期・10〜15分）
5. yumesutaHP更新（スタートプロンプト実行）（不定期・5〜10分）
6. yumesutaHP確認・デプロイ（不定期・5〜10分）

#### 調査2: 営業進捗管理（4タスク）
7. 毎日の営業KPI確認・分析（毎日朝・夕・10〜15分）
8. 営業指示出し（PDCA）（毎日〜毎週・20〜30分）
9. 営業先リスト作成・更新（週1〜月1回・30分〜1時間）
10. ゆめマガ配布管理（毎月・20〜30分）

#### 調査3: ゆめマガ制作工程管理（6タスク）
11. 毎日のゆめマガ制作進捗確認（毎日朝・10〜15分）
12. 制作スタッフへの指示出し・確認（毎日〜週2-3回・20〜30分）
13. コンテンツ確認・校正（週2-3回・30分〜1時間）
14. 先方への確認送付・修正対応（週1-2回・15〜30分）
15. 次月号の企画決定・準備（月1回・2〜3時間）
16. 最終チェック・校了・入稿管理（月1回・4〜6時間）

#### 調査4: HP・LLMO分析管理（6タスク）
17. ターゲットキーワードの順位確認・分析（週1回・15〜20分）
18. AI検索（LLMO）での表示状況確認（週1回・20〜30分）
19. お問い合わせ獲得状況の確認・分析（週1回・10〜15分）
20. SEO施策の立案・実行（月1〜2回・2〜3時間）
21. HP更新・新規コンテンツ作成（月1〜2回・3〜5時間）
22. アクセス解析レポート作成・共有（月1回・30分〜1時間）

#### 調査5: SNS投稿管理（7タスク）
23. 投稿コンテンツ作成（画像・テキスト）（週2〜3回・30分〜1時間）
24. 投稿スケジュール管理・予約投稿設定（週1回・15〜20分）
25. 実際の投稿実行（手動投稿）（週2〜3回・5〜10分）
26. 投稿後のエンゲージメント確認（週1回・15〜20分）
27. 被リンク獲得状況の確認・分析（週1回・10〜15分）
28. ブランディング効果の測定・分析（月1回・20〜30分）
29. SNS投稿戦略の見直し・改善（月1回・30分〜1時間）

#### 調査6: マネーフォワード連携（請求書・顧客管理）（6タスク）
30. 請求書発行（月1〜3回・15〜30分）
31. 入金確認（キャッシュアウト防止）（毎日〜週2-3回・10〜20分）
32. 未入金アラート対応・督促（週1回・20〜30分）
33. 取引先情報更新・管理（不定期・10〜15分）
34. 売上データ分析・レポート作成（月1回・30分〜1時間）
35. マネーフォワード クラウド会計との連携確認（月1回・10〜20分）

### タスク分類サマリー

#### 頻度別内訳
- **毎日実施**: 7タスク（営業KPI確認、ゆめマガ進捗確認、営業指示出し、制作指示出し、入金確認等）
- **週次実施**: 11タスク（営業先リスト更新、コンテンツ確認、キーワード順位確認、SNS投稿等）
- **月次実施**: 10タスク（ゆめマガ配布管理、次月号企画、SEO施策、請求書発行等）
- **不定期実施**: 7タスク（パートナー管理6タスク + 取引先情報更新）

#### 優先度別内訳
- **最高**: 9タスク（キャッシュアウト防止・納期厳守）
- **高**: 10タスク（パートナー管理6タスク + 営業・SEO・SNS重要タスク）
- **中**: 16タスク（分析・レポート・戦略見直し等）

#### 抜けもれリスク別内訳
- **最高リスク**: 3タスク（校了・入稿、入金確認）
- **高リスク**: 12タスク（画像アップロード、営業KPI確認、ゆめマガ進捗確認、請求書発行等）
- **中リスク**: 17タスク
- **低リスク**: 3タスク（パートナー画像準備、HP更新、売上分析）

---

## スプレッドシート設計

### データソース

**既存スプレッドシート**:
- **スプレッドシートID**: `1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k`
- **タイトル**: タスク管理（仮）
- **現状**: Phase 1で作成済み（モックデータ）
- **Phase 2での対応**: 既存スプレッドシートを完全に再構築

### シート構成

#### シート1: タスクマスタ（35行 + ヘッダー）

全35タスクの基本情報を管理する静的マスタ。

**列構成**:

| 列 | 列名 | データ型 | 説明 | 例 |
|---|---|---|---|---|
| A | タスクID | 文字列 | 一意識別子 | `TASK-001` |
| B | タスク名 | 文字列 | タスクの名称 | `Google Sheetsにパートナー基本情報入力` |
| C | カテゴリ | 文字列 | 関連機能 | `パートナー管理` |
| D | 頻度種別 | 文字列 | 実施頻度の分類 | `毎日` / `週次` / `月次` / `不定期` |
| E | 頻度詳細 | 文字列 | 詳細な頻度 | `毎日朝・夕` |
| F | 所要時間 | 文字列 | 概算時間 | `10〜15分` |
| G | 優先度 | 文字列 | 重要度 | `最高` / `高` / `中` |
| H | 抜けもれリスク | 文字列 | 忘れやすさ | `最高` / `高` / `中` / `低` |
| I | 関連URL1 | URL | すぐに出すべきURL | `https://docs.google.com/spreadsheets/d/...` |
| J | 関連URL1名称 | 文字列 | URL1の説明 | `パートナー・スターデータスプレッドシート` |
| K | 関連URL2 | URL | すぐに出すべきURL2 | `https://yumesuta.com/partner-images/` |
| L | 関連URL2名称 | 文字列 | URL2の説明 | `Xserver画像アップロード確認URL` |
| M | 関連URL3 | URL | すぐに出すべきURL3 | - |
| N | 関連URL3名称 | 文字列 | URL3の説明 | - |
| O | 関連パス1 | パス | すぐに出すべきパス | `/mnt/c/yumesuta-management-system/public/partner-images/raw/` |
| P | 関連パス1名称 | 文字列 | パス1の説明 | `画像配置先ディレクトリ` |
| Q | 関連パス2 | パス | すぐに出すべきパス2 | `/mnt/c/yumesuta-management-system/scripts/process-partner-images.js` |
| R | 関連パス2名称 | 文字列 | パス2の説明 | `画像処理スクリプト` |
| S | 関連コマンド | コマンド | すぐに出すべきコマンド | `node scripts/process-partner-images.js` |
| T | 関連情報 | テキスト | その他必要情報 | `画像ファイル名を確認してから実行` |
| U | 依存タスクID | 文字列 | 前提となるタスク | `TASK-003` (カンマ区切りで複数可) |
| V | 備考 | テキスト | 特記事項 | - |

**カテゴリの値**:
- `パートナー管理`
- `営業管理`
- `ゆめマガ制作`
- `HP・LLMO`
- `SNS`
- `請求書`

**頻度種別の値**:
- `毎日`
- `週次`
- `月次`
- `不定期`

**優先度の値**:
- `最高`（キャッシュアウト防止・納期厳守）
- `高`
- `中`

**抜けもれリスクの値**:
- `最高`（入稿遅れ・入金確認漏れ等）
- `高`（確認忘れ・アップロード忘れ等）
- `中`
- `低`

**データ入力方法**:
- Phase 2-2設計フェーズで、調査1〜6のタスク分析結果を基に全35タスクを手動入力
- 以降、タスクマスタは変更しない（Phase 2完成後、必要に応じて追加・更新）

---

#### シート2: タスク実施履歴（1000行 × 12列）

タスクの実施記録（マネージャーが手動で記録）。

**列構成**:

| 列 | 列名 | データ型 | 説明 | 例 |
|---|---|---|---|---|
| A | 実施日 | 日付 | タスク実施日 | `2025-10-05` |
| B | タスクID | 文字列 | タスクマスタと紐付け | `TASK-007` |
| C | タスク名 | 文字列 | タスクマスタから自動取得 | `毎日の営業KPI確認・分析` |
| D | ステータス | 文字列 | 完了状況 | `完了` / `未完了` / `スキップ` |
| E | 実施時刻 | 時刻 | 実施時刻 | `09:30` |
| F | 所要時間実績 | 数値 | 実際にかかった時間（分） | `12` |
| G | 結果・メモ | テキスト | 実施内容のメモ | `TELアポ5件不足 → 営業に追加架電指示` |
| H | 関連URLクリック | チェックボックス | URLにアクセスしたか | TRUE/FALSE |
| I | 次のアクション | テキスト | 次にやるべきこと | `明日のKPI確認で進捗再確認` |
| J | アラート設定 | 日付 | リマインダー日付 | `2025-10-06` |
| K | タイムスタンプ | 日時 | 記録日時（自動） | `2025-10-05 09:45:00` |
| L | 備考 | テキスト | - | - |

**データ入力方法**:
- マネージャーがタスク完了後、Google Sheetsに手動入力
- または、マネジメントシステムダッシュボードから入力（Phase 2-3実装フェーズで検討）

**データ活用**:
- 実績データの蓄積
- タスク所要時間の分析
- タスク実施頻度の可視化

---

#### シート3: 定期タスクスケジュール（1000行 × 9列）

定期タスクの実施予定管理。

**列構成**:

| 列 | 列名 | データ型 | 説明 | 例 |
|---|---|---|---|---|
| A | 予定日 | 日付 | 実施予定日 | `2025-10-05` |
| B | タスクID | 文字列 | タスクマスタと紐付け | `TASK-007` |
| C | タスク名 | 文字列 | タスクマスタから自動取得 | `毎日の営業KPI確認・分析` |
| D | 予定時刻 | 時刻 | 実施予定時刻 | `09:00` |
| E | ステータス | 文字列 | 実施状況 | `未実施` / `実施済み` / `スキップ` |
| F | アラート | 文字列 | アラート表示 | `期限超過` / `本日実施` / `-` |
| G | 実施日 | 日付 | 実際の実施日（実施済みの場合） | `2025-10-05` |
| H | 備考 | テキスト | - | - |
| I | タイムスタンプ | 日時 | 記録日時（自動） | `2025-10-05 09:00:00` |

**データ入力方法**:
- 毎日・週次・月次タスクの予定を事前に登録
- マネージャーが手動入力 or Google Apps Scriptで自動生成（Phase 2-3で検討）

**アラート自動判定**:
- `期限超過`: 予定日 < 今日 かつ ステータス = 未実施
- `本日実施`: 予定日 = 今日 かつ ステータス = 未実施
- `-`: 上記以外

---

#### シート4: プロジェクトタスク（100行 × 13列）

不定期タスク・プロジェクトベースのタスク管理。

**列構成**:

| 列 | 列名 | データ型 | 説明 | 例 |
|---|---|---|---|---|
| A | プロジェクト名 | 文字列 | プロジェクト識別 | `新規パートナー追加（まるとも社）` |
| B | タスクID | 文字列 | タスクマスタと紐付け | `TASK-001` |
| C | タスク名 | 文字列 | タスクマスタから自動取得 | `Google Sheetsにパートナー基本情報入力` |
| D | 開始予定日 | 日付 | - | `2025-10-05` |
| E | 完了予定日 | 日付 | - | `2025-10-06` |
| F | ステータス | 文字列 | 進行状況 | `未着手` / `進行中` / `完了` |
| G | 実際開始日 | 日付 | - | `2025-10-05` |
| H | 実際完了日 | 日付 | - | `2025-10-06` |
| I | 遅延日数 | 数値 | 完了予定日からの遅延 | `0` |
| J | 担当者 | 文字列 | - | `マネージャー` |
| K | 依存タスク完了 | チェックボックス | 依存タスクが完了しているか | TRUE/FALSE |
| L | 備考 | テキスト | - | - |
| M | タイムスタンプ | 日時 | 記録日時（自動） | `2025-10-05 10:00:00` |

**データ入力方法**:
- プロジェクト開始時、マネージャーが手動入力
- 例: 新規パートナー追加時、TASK-001〜006を一括登録

**遅延日数の計算**:
- 完了予定日 < 今日 かつ ステータス ≠ 完了 → 遅延日数 = 今日 - 完了予定日
- それ以外 → 遅延日数 = 0

---

## TypeScript型定義

```typescript
// types/task.ts

export interface TaskMaster {
  taskId: string; // タスクID (例: TASK-001)
  taskName: string; // タスク名
  category: TaskCategory; // カテゴリ
  frequencyType: FrequencyType; // 頻度種別
  frequencyDetail: string; // 頻度詳細
  estimatedTime: string; // 所要時間
  priority: Priority; // 優先度
  riskLevel: RiskLevel; // 抜けもれリスク
  relatedUrls: RelatedUrl[]; // 関連URL（最大3つ）
  relatedPaths: RelatedPath[]; // 関連パス（最大2つ）
  relatedCommand?: string; // 関連コマンド
  relatedInfo?: string; // その他必要情報
  dependsOnTaskIds?: string[]; // 依存タスクID
  notes?: string; // 備考
}

export type TaskCategory =
  | 'パートナー管理'
  | '営業管理'
  | 'ゆめマガ制作'
  | 'HP・LLMO'
  | 'SNS'
  | '請求書';

export type FrequencyType = '毎日' | '週次' | '月次' | '不定期';

export type Priority = '最高' | '高' | '中';

export type RiskLevel = '最高' | '高' | '中' | '低';

export interface RelatedUrl {
  url: string;
  name: string;
}

export interface RelatedPath {
  path: string;
  name: string;
}

export interface TaskHistory {
  date: string; // 実施日 (YYYY-MM-DD)
  taskId: string;
  taskName: string;
  status: TaskStatus;
  time?: string; // 実施時刻 (HH:MM)
  actualDuration?: number; // 所要時間実績（分）
  resultMemo?: string; // 結果・メモ
  urlClicked: boolean; // 関連URLクリック
  nextAction?: string; // 次のアクション
  alertDate?: string; // アラート設定日 (YYYY-MM-DD)
  timestamp: string; // 記録日時（自動）
  notes?: string; // 備考
}

export type TaskStatus = '完了' | '未完了' | 'スキップ';

export interface ScheduledTask {
  scheduledDate: string; // 予定日 (YYYY-MM-DD)
  taskId: string;
  taskName: string;
  scheduledTime?: string; // 予定時刻 (HH:MM)
  status: ScheduledTaskStatus;
  alert: ScheduledTaskAlert;
  completedDate?: string; // 実施日 (YYYY-MM-DD)
  notes?: string;
  timestamp: string; // 記録日時（自動）
}

export type ScheduledTaskStatus = '未実施' | '実施済み' | 'スキップ';

export type ScheduledTaskAlert = '期限超過' | '本日実施' | '';

export interface ProjectTask {
  projectName: string;
  taskId: string;
  taskName: string;
  plannedStartDate: string; // 開始予定日 (YYYY-MM-DD)
  plannedEndDate: string; // 完了予定日 (YYYY-MM-DD)
  status: ProjectTaskStatus;
  actualStartDate?: string; // 実際開始日 (YYYY-MM-DD)
  actualEndDate?: string; // 実際完了日 (YYYY-MM-DD)
  delayDays: number; // 遅延日数
  assignee: string; // 担当者
  dependsCompleted: boolean; // 依存タスク完了
  notes?: string;
  timestamp: string; // 記録日時（自動）
}

export type ProjectTaskStatus = '未着手' | '進行中' | '完了';

export interface TodayTask {
  task: TaskMaster;
  scheduled?: ScheduledTask; // 定期タスクの場合
  project?: ProjectTask; // プロジェクトタスクの場合
  alert: ScheduledTaskAlert;
  canStart: boolean; // 依存タスクチェック結果
}

export interface TaskDashboardData {
  todayTasks: TodayTask[]; // 今日のタスク
  overdueScheduledTasks: ScheduledTask[]; // 期限超過の定期タスク
  overdueProjectTasks: ProjectTask[]; // 期限超過のプロジェクトタスク
  allTaskMasters: TaskMaster[]; // 全タスクマスタ
  recentHistory: TaskHistory[]; // 最近の実施履歴（10件）
}
```

---

## ダッシュボード設計

### URL

`http://localhost:3000/dashboard/tasks`

### タブ構成

#### 1. 今日のタスク（デフォルト表示）

**表示内容**:
- 本日実施すべき定期タスク
- 本日期限のプロジェクトタスク
- 期限超過タスク（最優先表示）
- カード形式で表示

**ソート順**:
1. 期限超過タスク（赤背景）
2. 優先度「最高」のタスク
3. 優先度「高」のタスク
4. 優先度「中」のタスク
5. 予定時刻順

**タスクカードデザイン**:

```
┌─────────────────────────────────────────────────────────────┐
│ [優先度バッジ: 最高] タスク名                                 │
│ カテゴリ: パートナー管理 | 頻度: 不定期 | 所要時間: 15〜20分  │
│                                                              │
│ [📎 関連URL] [📁 関連パス] [⌨️ コマンドコピー]                │
│                                                              │
│ ステータス: [未実施] → [実施中] → [完了]                     │
│ アラート: 🔴 期限超過 / 🟡 本日実施 / -                       │
│                                                              │
│ 依存タスク: TASK-003（✅ 完了済み）                          │
│                                                              │
│ [▶ 開始する] [✅ 完了する] [⏭ スキップ]                     │
└─────────────────────────────────────────────────────────────┘
```

**ボタン機能**:
- **関連URLボタン**: クリックで別タブで開く（最大3つ）
- **関連パスボタン**: クリックでパスをクリップボードにコピー（最大2つ）
- **コマンドコピーボタン**: クリックでコマンドをクリップボードにコピー
- **開始するボタン**: ステータスを「進行中」に更新
- **完了するボタン**: ステータスを「完了」に更新、タスク実施履歴に記録
- **スキップボタン**: ステータスを「スキップ」に更新

---

#### 2. 定期タスク管理

**表示内容**:
- 毎日・週次・月次の全定期タスク
- カレンダー表示 ↔ リスト表示切替
- 実施状況の一覧

**カレンダー表示**:
```
┌─────────────────────────────────────────────────────────────┐
│ 2025年10月                                   [前月] [次月]    │
├─────────────────────────────────────────────────────────────┤
│ 日 | 月 | 火 | 水 | 木 | 金 | 土                              │
├─────────────────────────────────────────────────────────────┤
│    |    |  1 |  2 |  3 |  4 |  5                             │
│    |    | 3件| 3件| 3件| 3件| 3件                             │
├─────────────────────────────────────────────────────────────┤
│  6 |  7 |  8 |  9 | 10 | 11 | 12                             │
│ 3件| 3件| 3件| 3件| 3件| 3件| 3件                             │
└─────────────────────────────────────────────────────────────┘
```

**リスト表示**:
- タスクマスタの全定期タスク一覧
- フィルタ: 頻度種別（毎日/週次/月次）、カテゴリ、優先度

---

#### 3. プロジェクトタスク管理

**表示内容**:
- 進行中のプロジェクト一覧
- プロジェクト別タスク進捗表示
- ガントチャート形式（簡易版）

**プロジェクト一覧**:
```
┌─────────────────────────────────────────────────────────────┐
│ プロジェクト名: 新規パートナー追加（まるとも社）              │
│ 進捗: 3/6タスク完了（50%）                                    │
│ 開始日: 2025-10-05 | 完了予定日: 2025-10-07                  │
│ ステータス: 進行中 | 遅延: なし                               │
├─────────────────────────────────────────────────────────────┤
│ ✅ TASK-001: Google Sheetsにパートナー基本情報入力（完了）    │
│ ✅ TASK-002: パートナー画像の準備・配置（完了）               │
│ ✅ TASK-003: 画像処理スクリプト実行（完了）                   │
│ ⏳ TASK-004: Xserverに画像アップロード（進行中）              │
│ ⏸ TASK-005: yumesutaHP更新（未着手・依存タスク未完了）        │
│ ⏸ TASK-006: yumesutaHP確認・デプロイ（未着手・依存タスク未完了）│
└─────────────────────────────────────────────────────────────┘
```

**ガントチャート（簡易版）**:
```
┌─────────────────────────────────────────────────────────────┐
│ タスク名                | 10/5 | 10/6 | 10/7 | 10/8 | 10/9  │
├─────────────────────────────────────────────────────────────┤
│ TASK-001: 基本情報入力  | ████ |      |      |      |       │
│ TASK-002: 画像準備      |      | ████ |      |      |       │
│ TASK-003: 画像処理      |      | ████ |      |      |       │
│ TASK-004: アップロード  |      |      | ████ |      |       │
│ TASK-005: HP更新        |      |      |      | ████ |       │
│ TASK-006: HP確認        |      |      |      |      | ████  │
└─────────────────────────────────────────────────────────────┘
```

---

#### 4. タスクマスタ

**表示内容**:
- 全35タスクの一覧
- カテゴリ別・頻度別・優先度別フィルタ
- 検索機能

**フィルタ**:
- カテゴリ: 全て / パートナー管理 / 営業管理 / ゆめマガ制作 / HP・LLMO / SNS / 請求書
- 頻度種別: 全て / 毎日 / 週次 / 月次 / 不定期
- 優先度: 全て / 最高 / 高 / 中
- 抜けもれリスク: 全て / 最高 / 高 / 中 / 低

**テーブル表示**:

| タスクID | タスク名 | カテゴリ | 頻度 | 優先度 | リスク | アクション |
|---|---|---|---|---|---|---|
| TASK-001 | Google Sheetsに... | パートナー管理 | 不定期 | 高 | 中 | [詳細] |
| TASK-007 | 営業KPI確認 | 営業管理 | 毎日 | 最高 | 高 | [詳細] |
| ... | ... | ... | ... | ... | ... | ... |

---

### 「すぐに出てくる」機能の実装詳細

#### 1. 関連URLのワンクリックアクセス

**実装**:
```tsx
<div className="flex gap-2">
  {task.relatedUrls.map((url, index) => (
    <button
      key={index}
      onClick={() => window.open(url.url, '_blank')}
      className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
    >
      <LinkIcon className="h-4 w-4" />
      {url.name}
    </button>
  ))}
</div>
```

**例**:
- ボタン1: 「パートナー・スターデータスプレッドシート」（クリック → 別タブで開く）
- ボタン2: 「Xserver画像アップロード確認URL」（クリック → 別タブで開く）

#### 2. 関連パスのワンクリックコピー

**実装**:
```tsx
<div className="flex gap-2">
  {task.relatedPaths.map((path, index) => (
    <button
      key={index}
      onClick={() => {
        navigator.clipboard.writeText(path.path);
        toast.success(`${path.name}をコピーしました`);
      }}
      className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
    >
      <FolderIcon className="h-4 w-4" />
      {path.name}
    </button>
  ))}
</div>
```

**例**:
- ボタン1: 「画像配置先ディレクトリ」（クリック → `/mnt/c/yumesuta-management-system/public/partner-images/raw/` をコピー）
- ボタン2: 「画像処理スクリプト」（クリック → `/mnt/c/yumesuta-management-system/scripts/process-partner-images.js` をコピー）

#### 3. コマンドのワンクリックコピー

**実装**:
```tsx
{task.relatedCommand && (
  <button
    onClick={() => {
      navigator.clipboard.writeText(task.relatedCommand);
      toast.success('コマンドをコピーしました');
    }}
    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded hover:bg-green-200"
  >
    <TerminalIcon className="h-4 w-4" />
    コマンドコピー
  </button>
)}
```

**例**:
- ボタン: 「コマンドコピー」（クリック → `node scripts/process-partner-images.js` をコピー）

---

### 抜けもれ防止機能の実装詳細

#### 1. アラート表示

**期限超過タスク**:
```tsx
{task.alert === '期限超過' && (
  <div className="bg-red-100 border-l-4 border-red-500 p-2">
    <div className="flex items-center gap-2">
      <AlertTriangleIcon className="h-5 w-5 text-red-600" />
      <span className="text-red-800 font-bold">期限超過</span>
      <span className="text-red-600">{delayDays}日遅延</span>
    </div>
  </div>
)}
```

**本日実施タスク**:
```tsx
{task.alert === '本日実施' && (
  <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2">
    <div className="flex items-center gap-2">
      <ClockIcon className="h-5 w-5 text-yellow-600" />
      <span className="text-yellow-800 font-bold">本日実施</span>
    </div>
  </div>
)}
```

#### 2. 依存タスク順序強制

**実装**:
```tsx
const canStart = task.dependsOnTaskIds
  ? task.dependsOnTaskIds.every(depId => {
      const depTask = allProjectTasks.find(t => t.taskId === depId);
      return depTask?.status === '完了';
    })
  : true;

return (
  <div>
    {!canStart && (
      <div className="bg-orange-100 border-l-4 border-orange-500 p-2">
        <div className="flex items-center gap-2">
          <LockIcon className="h-5 w-5 text-orange-600" />
          <span className="text-orange-800">依存タスク未完了</span>
        </div>
        <div className="text-sm text-orange-700 mt-1">
          {task.dependsOnTaskIds.map(depId => {
            const depTask = allProjectTasks.find(t => t.taskId === depId);
            return (
              <div key={depId}>
                - {depTask?.taskName} ({depTask?.status})
              </div>
            );
          })}
        </div>
      </div>
    )}
    <button
      onClick={handleStart}
      disabled={!canStart}
      className={`px-4 py-2 rounded ${
        canStart
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
      }`}
    >
      開始する
    </button>
  </div>
);
```

**例**:
- TASK-005（yumesutaHP更新）は、TASK-004（Xserverアップロード）完了後のみ「開始する」ボタンが有効
- TASK-004未完了の場合、「依存タスク未完了」アラートを表示し、ボタンを無効化

#### 3. 高リスクタスクの強調表示

**実装**:
```tsx
<div
  className={`p-4 border rounded ${
    task.riskLevel === '最高' || task.riskLevel === '高'
      ? 'border-red-400 bg-red-50'
      : 'border-gray-200 bg-white'
  }`}
>
  {(task.riskLevel === '最高' || task.riskLevel === '高') && (
    <div className="flex items-center gap-2 mb-2">
      <AlertCircleIcon className="h-5 w-5 text-red-600" />
      <span className="text-red-800 font-bold">
        抜けもれリスク: {task.riskLevel}
      </span>
    </div>
  )}
  {/* タスクカード内容 */}
</div>
```

---

## API設計

### API Route: `/api/tasks/route.ts`

**機能**: タスクマスタ、定期タスク、プロジェクトタスク、タスク実施履歴の全データを取得

**エンドポイント**: `GET /api/tasks`

**レスポンス**:
```typescript
{
  success: boolean;
  data?: TaskDashboardData;
  error?: string;
}
```

**実装**:
```typescript
// app/api/tasks/route.ts

import { NextResponse } from 'next/server';
import { getBatchSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const spreadsheetId = process.env.TASKS_SPREADSHEET_ID!;

    // 4シートを一括取得
    const ranges = [
      'タスクマスタ!A2:V100',  // 全35タスク
      'タスク実施履歴!A2:L1000',
      '定期タスクスケジュール!A2:I1000',
      'プロジェクトタスク!A2:M100',
    ];

    const [
      taskMasterData,
      historyData,
      scheduledData,
      projectData,
    ] = await getBatchSheetData(spreadsheetId, ranges);

    // データパース
    const taskMasters = parseTaskMasters(taskMasterData);
    const history = parseTaskHistory(historyData);
    const scheduled = parseScheduledTasks(scheduledData);
    const projects = parseProjectTasks(projectData);

    // 今日のタスク抽出
    const today = new Date().toISOString().split('T')[0];
    const todayScheduled = scheduled.filter(s => s.scheduledDate === today);
    const todayProjects = projects.filter(p => p.plannedEndDate === today && p.status !== '完了');
    const overdueScheduled = scheduled.filter(s => s.alert === '期限超過');
    const overdueProjects = projects.filter(p => p.delayDays > 0 && p.status !== '完了');

    // TodayTask生成
    const todayTasks: TodayTask[] = [
      ...todayScheduled.map(s => ({
        task: taskMasters.find(tm => tm.taskId === s.taskId)!,
        scheduled: s,
        alert: s.alert,
        canStart: checkDependencies(s.taskId, taskMasters, projects),
      })),
      ...todayProjects.map(p => ({
        task: taskMasters.find(tm => tm.taskId === p.taskId)!,
        project: p,
        alert: (p.delayDays > 0 ? '期限超過' : '本日実施') as ScheduledTaskAlert,
        canStart: p.dependsCompleted,
      })),
    ];

    const dashboardData: TaskDashboardData = {
      todayTasks,
      overdueScheduledTasks: overdueScheduled,
      overdueProjectTasks: overdueProjects,
      allTaskMasters: taskMasters,
      recentHistory: history.slice(0, 10),
    };

    return NextResponse.json({ success: true, data: dashboardData });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

function parseTaskMasters(data: any[][]): TaskMaster[] {
  // タスクマスタデータのパース処理
  // ... (実装略)
}

function parseTaskHistory(data: any[][]): TaskHistory[] {
  // タスク実施履歴データのパース処理
  // ... (実装略)
}

function parseScheduledTasks(data: any[][]): ScheduledTask[] {
  // 定期タスクスケジュールデータのパース処理
  // ... (実装略)
}

function parseProjectTasks(data: any[][]): ProjectTask[] {
  // プロジェクトタスクデータのパース処理
  // ... (実装略)
}

function checkDependencies(
  taskId: string,
  taskMasters: TaskMaster[],
  projects: ProjectTask[]
): boolean {
  const task = taskMasters.find(tm => tm.taskId === taskId);
  if (!task || !task.dependsOnTaskIds) return true;

  return task.dependsOnTaskIds.every(depId => {
    const depTask = projects.find(p => p.taskId === depId);
    return depTask?.status === '完了';
  });
}
```

---

## まとめ

### Phase 2-2設計フェーズで確定した内容

1. **タスク統合**: 調査1〜6で抽出した35タスクを統合・分類完了
2. **スプレッドシート設計**: 4シート構成を確定（タスクマスタ、タスク実施履歴、定期タスクスケジュール、プロジェクトタスク）
3. **TypeScript型定義**: 全インターフェース・型定義を確定
4. **ダッシュボード設計**: 4タブ構成・「すぐに出てくる」機能・抜けもれ防止機能を確定
5. **API設計**: `/api/tasks` エンドポイント設計完了

### Phase 2の本質を守った設計

- ✅ **把握スピード・作業着手スピード**: 関連URL・パス・コマンドのワンクリックアクセス
- ✅ **抜けもれ防止**: アラート表示・依存タスク順序強制・高リスクタスク強調表示
- ✅ **技術的複雑度を増さない**: 手動更新方式・既存ライブラリの拡張のみ

### 次のステップ（Phase 2-3: 実装フェーズ）

1. タスクマスタスプレッドシートにデータ入力（35タスク）
2. API Route `/api/tasks` 実装
3. タスク管理ダッシュボード `/dashboard/tasks` 実装
4. テスト・検証

---

**作成者**: Claude Code (2025-10-05)
**レビュー**: Phase 2-3実装フェーズ開始前に必読
**更新**: Phase 2-3実装完了後、実装結果を反映
