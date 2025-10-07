# ゆめマガ制作進捗管理システム ドキュメント

このディレクトリには、ゆめマガ制作進捗管理システムの全ドキュメントが格納されています。

## 📚 ドキュメント構成

| ファイル名 | 内容 | 対象読者 |
|-----------|------|---------|
| `REQUIREMENTS.md` | 要件定義書（目的、機能一覧、UI/UX設計） | 全員 |
| `SPREADSHEET_STRUCTURE.md` | スプレッドシート構造調査レポート | エンジニア |

## 🎯 クイックスタート（次世代Claude Code向け）

1. **必読**: `REQUIREMENTS.md` を最初から最後まで読む
2. **理解**: `SPREADSHEET_STRUCTURE.md` でデータ構造を把握
3. **実装**: `/app/dashboard/yumemaga-v2/page.tsx` を確認してUI実装を理解
4. **開発**: バックエンド実装を開始（ガワができたら再度調査）

## 📂 関連ファイル

### 実装ファイル
- `/app/dashboard/yumemaga-v2/page.tsx` - 完成版ダッシュボードUI（モック）
- `/app/dashboard/yumemaga/page.tsx` - 既存ダッシュボード（参考用）
- `/app/api/process-schedule/route.ts` - 既存APIルート（参考用）
- `/types/process.ts` - 型定義

### スプレッドシート
- ID: `1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw`
- 詳細: `docs/investigation/PROCESS_SCHEDULE_STRUCTURE_REPORT.md` 参照

## ⚠️ 重要な注意事項

1. **既存シートは絶対に改変しない**
   - テスト用シートを別途作成して使用
   - 本番データは読み取り専用として扱う

2. **MVP スコープを守る**
   - 読み取り専用表示 → 双方向同期（段階的実装）
   - 完璧を目指さず、動くものを優先

3. **ドキュメントを常に更新**
   - 実装後は必ず `DEVELOPMENT_PROGRESS.md` を更新
   - 仕様変更時は `REQUIREMENTS.md` と `TECHNICAL_SPEC.md` を更新

## 🔄 開発フロー

```
1. HANDOFF_GUIDE.md を読む
2. REQUIREMENTS.md で要件を確認
3. TECHNICAL_SPEC.md で実装方法を確認
4. コーディング
5. テスト
6. DEVELOPMENT_PROGRESS.md を更新
7. 次のタスクへ
```

## 📞 サポート

質問や不明点がある場合は、このディレクトリ内のドキュメントを確認してください。
それでも解決しない場合は、ユーザーに直接確認してください。

---

**最終更新**: 2025-10-07
**バージョン**: v2.0（完成版UI実装完了）
