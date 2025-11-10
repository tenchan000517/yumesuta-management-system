/**
 * 情報シート処理用プロンプトテンプレート
 */

export const informationSheetProcessPromptTemplate = `情報シート処理プロンプト

【基本指示】
あなたは企業情報を企業マスター（Google Spreadsheet）に登録する担当者です。
以下の情報シートファイルを読み込み、企業マスター（51列）に追記してください。

【企業名】
{{COMPANY_NAME}}

【情報シートファイル】
{{FILE_INFO}}

【必須ルール（絶対遵守）】
1. 既存データの保護: 企業マスターに既にデータがあるセルは上書きしない
2. 空のセルのみ追記: 空白または未入力のセルにのみ情報シートのデータを追記
3. セルのマーキング: 追記したセルの背景色を薄い黄色（#FFFFCC）に変更
4. 重複の報告: 既存データと情報シートで内容が異なる場合は報告（ユーザーが判断）
5. データの正確性: 情報シートの内容を正確に転記（推測・修正は行わない）

【処理手順】

ステップ1: 情報シートファイルの読み込み
{{#if LOCAL_FILE_PATH}}
- ローカルファイルパス: {{LOCAL_FILE_PATH}}
- まずGoogle Driveにアップロード: カテゴリC/{{COMPANY_NAME}}/情報シート/
{{else}}
- Google Driveから取得: カテゴリC/{{COMPANY_NAME}}/情報シート/
- 複数ファイルがある場合は最新のファイルを選択
{{/if}}

ステップ2: ファイル形式の判定と読み込み
- Excelファイル (.xlsx): xlsxライブラリで読み込み
- Google Spreadsheet: getSheetData()で読み込み
- 1行目: ヘッダー行（列名）
- 2行目以降: データ

ステップ3: 企業マスター（51列）の取得
- Spreadsheet ID: process.env.YUMEMAGA_SPREADSHEET_ID
- シート名: 企業マスター
- 範囲: A:AY（51列）
- 該当企業の行を特定（B列=企業名で検索）

ステップ4: データの照合と追記判定
各フィールドについて：
┌─ 企業マスターが空 → 情報シートのデータを追記（薄い黄色）
├─ 同じ内容 → スキップ
└─ 異なる内容 → 重複として報告（ユーザー判断）

ステップ5: 企業マスターへの書き込み
- updateSheetRow()で行全体を更新
- 追記したセルのリストを記録

ステップ6: セル背景色の設定
- setCellBackgroundColor()で薄い黄色（#FFFFCC）を設定
- 追記したセルのみ色を変更

【企業マスター（51列）のフィールド定義】
A列: 企業ID
B列: 企業名
C列: 企業名（カナ）
D列: 業種
E列: 事業エリア
F列: 説明文（一覧用）
G列: ロゴ画像パス
H列: ヒーロー画像パス
I列: QRコード画像パス
J列: スローガン
K列: 代表者名
L列: 代表者名（英語）
M列: 代表者役職
N列: 代表者写真パス
O列: サービス1_画像パス
P列: サービス1_タイトル
Q列: サービス1_説明
R列: サービス2_画像パス
S列: サービス2_タイトル
T列: サービス2_説明
U列: サービス3_画像パス
V列: サービス3_タイトル
W列: サービス3_説明
X列: 社長メッセージ
Y列: 社員1_画像パス
Z列: 社員1_質問
AA列: 社員1_回答
AB列: 社員2_画像パス
AC列: 社員2_質問
AD列: 社員2_回答
AE列: 社員3_画像パス
AF列: 社員3_質問
AG列: 社員3_回答
AH列: 取り組み1_タイトル
AI列: 取り組み1_説明
AJ列: 取り組み2_タイトル
AK列: 取り組み2_説明
AL列: 取り組み3_タイトル
AM列: 取り組み3_説明
AN列: 住所
AO列: 電話番号
AP列: FAX番号
AQ列: ウェブサイト
AR列: 問い合わせメール
AS列: 設立年
AT列: 従業員数
AU列: 事業内容
AV列: 初掲載号
AW列: 最終更新号
AX列: ステータス
AY列: 備考

【情報シートのマッピング】
情報シートのヘッダー行から列名を自動認識し、企業マスターの列にマッピング。
列名の揺れに対応：
- "会社名" = "企業名" = "社名" → B列
- "電話" = "TEL" = "電話番号" → AO列
- "住所" = "所在地" → AN列
など

【出力形式】
処理が完了したら、以下の形式で報告してください：

-------------------------------------------
【処理結果】

✅ 追記完了: {{ADDED_COUNT}}フィールド
   - B列（企業名）: "株式会社テスト"
   - D列（業種）: "製造業"
   - AN列（住所）: "愛知県名古屋市..."
   - ...（追記したフィールドをすべて列挙）

⚠️ 重複検出: {{CONFLICT_COUNT}}フィールド（要確認）
   - G列（ロゴ画像パス）:
     既存 = "/img/test/logo.png"
     情報シート = "/images/logo.jpg"
     → どちらを採用しますか？

   - D列（業種）:
     既存 = "製造業"
     情報シート = "製造・卸売業"
     → どちらを採用しますか？

📊 統計
   - 総フィールド数: 51
   - 既存データ: {{EXISTING_COUNT}}
   - 追記: {{ADDED_COUNT}}（薄い黄色）
   - スキップ（同じ内容）: {{SKIPPED_COUNT}}
   - 重複: {{CONFLICT_COUNT}}

🔗 企業マスター
   https://docs.google.com/spreadsheets/d/{{SPREADSHEET_ID}}/edit#gid=0&range=B{{ROW_NUMBER}}
-------------------------------------------

【注意事項】
・追記したセルは薄い黄色（#FFFFCC）でマーク済み
・重複フィールドは手動で確認・修正してください
・情報シートファイルは Google Drive の「情報シート」フォルダに保存済み

【エラーハンドリング】
- 企業が企業マスターに存在しない場合 → エラー報告
- ファイルが読み込めない場合 → エラー報告
- フィールドのマッピングができない場合 → 警告（スキップ）
`;

/**
 * プロンプトテンプレートに値を埋め込む
 */
export function generateInformationSheetPrompt(params: {
  companyName: string;
  localFilePath?: string;
  fileInfo?: {
    name: string;
    mimeType: string;
    size: string;
    modifiedTime: string;
  };
}): string {
  let prompt = informationSheetProcessPromptTemplate;

  prompt = prompt.replace(/\{\{COMPANY_NAME\}\}/g, params.companyName);

  if (params.localFilePath) {
    prompt = prompt.replace(/\{\{LOCAL_FILE_PATH\}\}/g, params.localFilePath);
    prompt = prompt.replace(/\{\{#if LOCAL_FILE_PATH\}\}/g, '');
    prompt = prompt.replace(/\{\{else\}\}[\s\S]*?\{\{\/if\}\}/g, '');
  } else {
    prompt = prompt.replace(/\{\{#if LOCAL_FILE_PATH\}\}[\s\S]*?\{\{else\}\}/g, '');
    prompt = prompt.replace(/\{\{\/if\}\}/g, '');
  }

  if (params.fileInfo) {
    const fileInfoText = `
ファイル名: ${params.fileInfo.name}
ファイル形式: ${params.fileInfo.mimeType}
ファイルサイズ: ${params.fileInfo.size}
最終更新: ${params.fileInfo.modifiedTime}
`;
    prompt = prompt.replace(/\{\{FILE_INFO\}\}/g, fileInfoText);
  } else {
    prompt = prompt.replace(/\{\{FILE_INFO\}\}/g, '（フォルダから自動検出）');
  }

  return prompt;
}
