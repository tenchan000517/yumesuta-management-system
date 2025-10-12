import { NextRequest, NextResponse } from 'next/server';
import { getSheetData, appendSheetRow, updateSheetCell } from '@/lib/google-sheets';

/**
 * チェックリスト項目のヘッダーリスト（contract-workflow.tsと完全一致）
 * 55項目: s1-c1 〜 s13-c4
 */
const CHECKLIST_HEADERS = [
  // ステップ1: 情報収集（4項目）
  's1-c1', 's1-c2', 's1-c3', 's1-c4',
  // ステップ2: 基本契約書作成（4項目）
  's2-c1', 's2-c2', 's2-c3', 's2-c4',
  // ステップ3: 基本契約書の押印・送信（4項目）
  's3-c1', 's3-c2', 's3-c3', 's3-c4',
  // ステップ4: 申込書兼個別契約書作成（6項目）
  's4-c1', 's4-c2', 's4-c3', 's4-c4', 's4-c5', 's4-c6',
  // ステップ5: 申込書の押印・送信（4項目）
  's5-c1', 's5-c2', 's5-c3', 's5-c4',
  // ステップ6: 重要事項説明（6項目）
  's6-c1', 's6-c2', 's6-c3', 's6-c4', 's6-c5', 's6-c6',
  // ステップ7: 契約完了確認（3項目）
  's7-c1', 's7-c2', 's7-c3',
  // ステップ8: 請求書作成・送付（4項目）
  's8-c1', 's8-c2', 's8-c3', 's8-c4',
  // ステップ9: 入金確認（3項目）
  's9-c1', 's9-c2', 's9-c3',
  // ステップ10: 入金管理シート更新（4項目）
  's10-c1', 's10-c2', 's10-c3', 's10-c4',
  // ステップ11: 入金確認連絡・原稿依頼（4項目）
  's11-c1', 's11-c2', 's11-c3', 's11-c4',
  // ステップ12: 制作・校正（5項目）
  's12-c1', 's12-c2', 's12-c3', 's12-c4', 's12-c5',
  // ステップ13: 掲載（4項目）
  's13-c1', 's13-c2', 's13-c3', 's13-c4',
];

/**
 * 列インデックスから列名を取得（1=A, 2=B, 27=AA, 56=BD, etc.）
 */
function getColumnLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const remainder = (col - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

/**
 * GET /api/contract/checklist/[id]
 * 契約IDに紐づくチェックリストを取得
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'SALES_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    // チェックリスト管理シートから契約IDに一致する行を取得
    const data = await getSheetData(spreadsheetId, 'チェックリスト管理!A2:BD');
    const row = data.find((r: any[]) => parseInt(r[0]) === contractId);

    if (!row) {
      // 行がない場合は全てfalse
      return NextResponse.json({
        success: true,
        checklist: {},
      });
    }

    // B列以降（インデックス1〜）をチェックリストオブジェクトに変換
    const checklist: Record<string, boolean> = {};
    CHECKLIST_HEADERS.forEach((key, index) => {
      const cellValue = row[index + 1]; // B列 = インデックス1
      checklist[key] = cellValue === 'TRUE' || cellValue === true;
    });

    return NextResponse.json({
      success: true,
      checklist,
    });
  } catch (error: any) {
    console.error('チェックリスト取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/contract/checklist/[id]
 * チェックリスト項目を更新
 *
 * リクエストボディ:
 * {
 *   checkId: string;  // 例: "s1-c1"
 *   checked: boolean; // true or false
 * }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = parseInt(params.id);
    if (isNaN(contractId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid contract ID' },
        { status: 400 }
      );
    }

    const { checkId, checked } = await request.json();

    if (!checkId || typeof checked !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'SALES_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    // 1. 契約IDに一致する行を検索
    const data = await getSheetData(spreadsheetId, 'チェックリスト管理!A2:BD');
    let rowIndex = data.findIndex((r: any[]) => parseInt(r[0]) === contractId);

    // 2. 行がない場合は新規作成
    if (rowIndex === -1) {
      console.log(`契約ID ${contractId} の行が存在しないため、新規作成します`);
      const newRow = [contractId, ...Array(55).fill(false)];
      await appendSheetRow(spreadsheetId, 'チェックリスト管理', newRow);

      // 新規作成した行のインデックスを取得
      rowIndex = data.length;
    }

    // 3. 列インデックスを取得
    const columnIndex = CHECKLIST_HEADERS.indexOf(checkId);
    if (columnIndex === -1) {
      return NextResponse.json(
        { success: false, error: `Invalid checkId: ${checkId}` },
        { status: 400 }
      );
    }

    // 4. セルを更新
    // B列 = 列番号2 = columnIndex + 2
    const columnNumber = columnIndex + 2;
    const columnLetter = getColumnLetter(columnNumber);
    const actualRowNumber = rowIndex + 2; // ヘッダー1行 + データ開始行2行目
    const cellAddress = `${columnLetter}${actualRowNumber}`;

    await updateSheetCell(
      spreadsheetId,
      'チェックリスト管理',
      cellAddress,
      checked ? 'TRUE' : 'FALSE'
    );

    console.log(`✅ チェックリスト更新: 契約ID=${contractId}, ${checkId}=${checked}, セル=${cellAddress}`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('チェックリスト更新エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
