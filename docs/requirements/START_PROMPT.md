# 統合マネジメントシステム 要件定義作成 - スタートプロンプト

**作成日**: 2025-10-04
**用途**: 複数セッションにまたがる要件定義作成作業の開始時に使用

---

## 🎯 このプロンプトの目的

次世代Claude Codeが要件定義作成作業を継続する際に、以下を即座に把握できるようにする:
1. 現在のプロジェクト状態
2. 実施中のタスク
3. 作業の進め方・原則
4. 次に何をすべきか

---

## 📋 作業開始時のプロンプト（コピペ用）

```
# 統合マネジメントシステム 要件定義作成 - 作業再開

以下のドキュメントを読んで、作業を継続してください。

## 必読ドキュメント（優先順）
1. `/mnt/c/yumesuta-management-system/docs/handover/handover-requirements-definition.md` - 要件定義作成タスク（最重要・原則）
2. `/mnt/c/yumesuta-management-system/docs/requirements/investigation-plan.md` - 調査計画
3. `/mnt/c/yumesuta-management-system/docs/requirements/progress-tracker.md` - 進捗管理
4. `/mnt/c/yumesuta-management-system/docs/business-strategy-memo.md` - ビジネス戦略メモ

## 作業の進め方
1. progress-tracker.mdで現在の進捗を確認
2. 次にやるべき調査タスクを特定
3. 調査を実施
4. 調査結果をドキュメント化
5. progress-tracker.mdを更新
6. ユーザーに報告・確認

## 絶対に守るべき原則（handover-requirements-definition.mdより）
- ❌ 主観・憶測・仮説を一切挟まない
- ❌ 作り込みすぎない、複雑にしすぎない
- ✅ ユーザーの理想を叶えることを最優先
- ✅ 事実のみを基に考える
- ✅ 不明点は必ず確認する
- ✅ 1ディレクトリずつ段階的に調査（コンテキストオーバー防止）

progress-tracker.mdを読んで、次のタスクを教えてください。
```

---

## 📂 プロジェクト構造

```
C:\yumesuta-management-system\
├── docs/
│   ├── handover/
│   │   └── handover-requirements-definition.md  # 要件定義作成タスク（原則）
│   ├── requirements/
│   │   ├── START_PROMPT.md                      # このファイル
│   │   ├── investigation-plan.md                # 調査計画
│   │   ├── progress-tracker.md                  # 進捗管理（次に作成）
│   │   └── investigations/                      # 調査結果格納フォルダ
│   │       ├── sales-management-system.md
│   │       ├── yume-maga-app.md
│   │       ├── 高卒採用リサーチ.md
│   │       └── ゆめマガ.md
│   ├── business-strategy-memo.md                # ビジネス戦略メモ
│   └── (要件定義書は調査完了後に作成)
└── README.md
```

---

## 🔄 作業フロー

### Phase 1: 既存システムの調査
- [ ] sales-management-system (0.16 MB)
- [ ] yume-maga-app (205.25 MB)

### Phase 2: データソースの調査
- [ ] 高卒採用リサーチ (1.13 MB)
- [ ] ゆめマガ (1.17 GB) - 段階的に
  - [ ] ディレクトリ構造
  - [ ] スプレッドシート
  - [ ] PDFファイル
  - [ ] パートナー企業・スター紹介データ

### Phase 3: 補足調査
- [ ] yumesutaHP (1.35 GB) - 既知だが念のため

### Phase 4: 要件定義書作成
- [ ] 調査結果の統合
- [ ] 要件定義書ドラフト作成
- [ ] ユーザー確認・承認

---

## ⚠️ 重要な注意事項

### 作業を再開する際の確認事項
1. **progress-tracker.mdを最初に読む**
   - 前回どこまで進んだか
   - 次に何をすべきか
   - ユーザーからのフィードバックがあるか

2. **handover-requirements-definition.mdの原則を再確認**
   - 憶測を挟まない
   - 作り込みすぎない
   - ユーザーの理想を最優先

3. **1セッション = 1ディレクトリの調査**
   - コンテキストオーバーを防ぐ
   - 調査結果を必ずドキュメント化
   - progress-tracker.mdを更新

---

## 📝 進捗管理ルール

### 調査完了の定義
- ✅ 調査結果がドキュメント化されている
- ✅ ユーザーに報告・確認済み
- ✅ progress-tracker.mdが更新されている

### 次のタスクへの移行条件
- ✅ 前のタスクが完了している
- ✅ ユーザーからの承認を得ている
- ✅ 不明点が解消されている（または質問リスト化されている）

---

## 🚀 次回セッション開始時のアクション

1. 上記の「作業開始時のプロンプト」をコピペ
2. Claude Codeが自動的に:
   - 必読ドキュメントを読む
   - progress-tracker.mdで進捗確認
   - 次のタスクを特定
   - 作業を継続

---

**作成者**: Claude Code
**最終更新**: 2025-10-04
**ステータス**: 運用開始
