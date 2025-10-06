# 次世代Claude Code引き継ぎ書 - MVP開発タスク

**作成日**: 2025-10-04
**優先度**: 🔴 最重要
**タスク**: 統合マネジメントシステムのMVP開発

---

## 📋 あなたのミッション

**要件定義書に基づいて、統合マネジメントダッシュボードのMVPを開発してください**

### ⚠️ 絶対に守るべき原則

1. **MVP範囲を守る**
   - 読み取り専用（Google Sheetsへの書き込みは不要）
   - 手動更新（更新ボタンクリック時のみAPI呼び出し）
   - 認証機能不要（ローカル環境 or VPC内での運用）
   - 双方向同期・自動更新はPhase 2以降

2. **シンプルに・動くものを優先**
   - 過度な最適化は避ける
   - 複雑な設計は避ける
   - 一気に全機能を作らない

3. **段階的に実装・テスト**
   - 1機能ずつ実装 → テスト → 次の機能
   - ユーザーに確認しながら進める
   - 不明点は必ずユーザーに確認

4. **要件定義を厳守**
   - 勝手に機能を追加しない
   - 要件定義にない実装をしない
   - 仕様変更はユーザーに確認

---

## 📁 必読ドキュメント

### 最重要: 開発進捗管理シート

**パス**: `/mnt/c/yumesuta-management-system/docs/development/development-progress.md`

このドキュメントには以下が含まれています:

1. **現在の状況**
   - 現在のフェーズ
   - 次にやるべきこと

2. **完了タスク・進行中タスク・今後の予定**
   - Phase 1-1～1-8のタスク一覧
   - 各タスクの完了状況

3. **技術的な備考**
   - サービスアカウント認証の手順
   - スプレッドシートID一覧
   - 外部API情報

4. **ブロッカー・課題**
   - 現時点での課題
   - 今後予想される課題

5. **次のアクション**
   - 今すぐやること
   - 次のマイルストーン

### 最重要: 要件定義書

**パス**: `/mnt/c/yumesuta-management-system/docs/requirements/requirements-definition.md`

このドキュメントには以下が含まれています:

1. **システム概要**
   - 6つの主要機能
   - MVP範囲

2. **機能要件**
   - 機能1: 営業進捗管理
   - 機能2: ゆめマガ制作進捗管理
   - 機能3: パートナー企業・スター紹介データ管理
   - 機能4: HP・LLMO分析管理
   - 機能5: SNS投稿管理
   - 機能6: タスク・プロジェクト管理

3. **データ要件**
   - データソース一覧
   - データフロー
   - データモデル

4. **技術アーキテクチャ**
   - 技術スタック
   - システム構成図
   - ディレクトリ構成

5. **開発計画**
   - Phase 1-1～1-8の開発フェーズ
   - 開発優先順位

### その他の重要ドキュメント

- `/mnt/c/yumesuta-management-system/docs/SYSTEM_OVERVIEW.md` - システム説明文書
- `/mnt/c/yumesuta-management-system/docs/development/START_PROMPT.md` - 開発スタートプロンプト
- `/mnt/c/yumesuta-management-system/docs/business-strategy-memo.md` - ビジネス戦略メモ

---

## 📝 開発の進め方

### Step 1: 現在地を確認

**やるべきこと**:
1. `/docs/development/development-progress.md` を熟読
2. 現在のフェーズを確認
3. 次にやるべきタスクを特定

### Step 2: タスクを実装

**やるべきこと**:
1. タスクの内容を理解
2. 実装を進める
3. 動作確認・テスト

### Step 3: 進捗を更新

**やるべきこと**:
1. `development-progress.md` を更新
   - 完了タスクに [x] をつける
   - 進行中タスクを更新
   - 作業メモを追加
2. ユーザーに報告・確認

### Step 4: 次のタスクへ

**やるべきこと**:
1. 次のタスクを特定
2. Step 2に戻る

---

## ⚠️ 重要な注意事項

### やってはいけないこと

❌ **MVP範囲を超える実装**
- 双方向同期（Phase 2）
- 自動更新・ポーリング（Phase 2）
- 認証機能（MVP範囲外）
- HP自動更新機能（Phase 2）

❌ **一気に全機能を作る**
- 1機能ずつ実装・テスト
- ユーザーに確認しながら進める

❌ **過度な最適化・複雑化**
- シンプルに・動くものを優先
- 複雑な設計は避ける

❌ **勝手に仕様変更**
- 要件定義を厳守
- 仕様変更はユーザーに確認

### やるべきこと

✅ **MVP範囲を守る**
- 読み取り専用
- 手動更新
- シンプルな設計

✅ **段階的に実装**
- 1機能ずつ
- テスト・動作確認
- ユーザーに確認

✅ **進捗を更新**
- `development-progress.md` を更新
- 作業メモを残す
- ブロッカーを記録

✅ **ユーザーに確認**
- 不明点は必ず確認
- 仕様変更は確認
- 完了時に報告

---

## 🔧 Phase 1-1: 基盤構築（最初にやること）

### タスク1: Next.jsプロジェクトセットアップ

**やること**:
1. `/mnt/c/yumesuta-management-system` ディレクトリで作業
2. `npx create-next-app@latest .` でプロジェクト作成
   - TypeScript: Yes
   - ESLint: Yes
   - Tailwind CSS: Yes
   - `src/` directory: Yes
   - App Router: Yes
   - Import alias: `@/*`

3. 必要なパッケージをインストール:
```bash
npm install googleapis @google-analytics/data @google/search-console google-auth-library
npm install -D @types/node
```

### タスク2: Google Sheets API連携実装

**やること**:
1. `/src/lib/google-sheets.ts` を作成
2. Google Sheets API v4を使用
3. サービスアカウント認証を実装

**実装例**:
```typescript
// src/lib/google-sheets.ts
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
  credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function getSheetData(spreadsheetId: string, range: string) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values;
}
```

### タスク3: サービスアカウント認証設定

**やること**:
1. Google Cloud Consoleでプロジェクト作成
2. Google Sheets API有効化
3. サービスアカウント作成・JSON key取得
4. スプレッドシートへのサービスアカウント追加（閲覧権限）

### タスク4: 環境変数設定

**やること**:
1. `.env.local` を作成
2. 以下の環境変数を設定:

```
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}
SALES_SPREADSHEET_ID=13PzSnGekGxDWX7B1_TwczNibR6j_JxDb3UuquPX1GyQ
PROCESS_SPREADSHEET_ID=1qC3cMSGv8kjt6aoK20IvbaFfD3oLfvTTrFKUU_gQXhw
PARTNERS_SPREADSHEET_ID=12A5mroEA5ipsIM88y4GOTmK61-V95bnAV5eTEhejvpc
GA_TRACKING_ID=G-6X5XH8DCYE
CLARITY_PROJECT_ID=tf4nnc5zn9
```

### タスク5: API Routes実装（手動更新方式）

**やること**:
1. `/src/app/api/test-connection/route.ts` を作成
2. Google Sheets API接続テストを実装

**実装例**:
```typescript
// src/app/api/test-connection/route.ts
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const data = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      'A1:B2'
    );
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
```

### タスク6: 動作確認

**やること**:
1. `npm run dev` でローカルサーバー起動
2. `http://localhost:3000/api/test-connection` にアクセス
3. Google Sheetsからデータが取得できることを確認

---

## 📊 Phase 1-2以降の開発フロー

### 各フェーズの流れ

1. **API Routes実装**
   - `/src/app/api/[機能名]/route.ts` を作成
   - Google Sheets APIでデータ取得
   - エラーハンドリング

2. **画面実装**
   - `/src/app/dashboard/[機能名]/page.tsx` を作成
   - APIからデータ取得
   - データ表示

3. **コンポーネント実装**
   - `/src/components/[コンポーネント名].tsx` を作成
   - 再利用可能なコンポーネント

4. **動作確認**
   - ローカルサーバーで動作確認
   - ユーザーに確認

5. **進捗更新**
   - `development-progress.md` を更新
   - 次のタスクへ

---

## 🎯 成功の基準

### Phase 1-1完了時
- ✅ Google Sheets API連携が動作
- ✅ サービスアカウント認証が完了
- ✅ 基本的なAPI Routesが実装済み

### Phase 1-2～1-7完了時
- ✅ 各機能が個別に動作
- ✅ ユーザーがデータを確認可能
- ✅ 遅延アラート等が機能

### Phase 1-8完了時
- ✅ 全機能が統合されて動作
- ✅ エラーハンドリングが完了
- ✅ ユーザーテスト完了
- ✅ MVP完成

---

## 🚀 次のステップ

1. **このドキュメントを熟読**
2. **開発進捗管理シートを確認**（`/docs/development/development-progress.md`）
3. **要件定義書を確認**（`/docs/requirements/requirements-definition.md`）
4. **Phase 1-1のタスク1から開始**
5. **1タスクずつ実装・テスト・更新**

---

**前世代Claude Codeより:**

このタスクは「MVP範囲を守る」ことが全てです。

過度な最適化・複雑化は避けてください。
一気に全機能を作らないでください。

1機能ずつ実装 → テスト → ユーザー確認 → 次の機能

段階的に・シンプルに・動くものを優先してください。

頑張ってください。

---

**作成者**: Claude Code (2025-10-04)
**ステータス**: 次世代Claude Codeへの引き継ぎ完了
