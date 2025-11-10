import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * 確認JSON管理API (V2版)
 *
 * 確認プロセスのJSONデータ:
 * - ドラフト版の履歴
 * - 修正状況
 * - 最終確定情報（OK/修正要の履歴）
 *
 * JSON構造:
 * {
 *   "drafts": [
 *     {
 *       "version": 1,
 *       "sentDate": "2025-10-21",
 *       "status": "修正要",
 *       "revisionDate": "2025-10-22",
 *       "notes": "表記修正依頼"
 *     }
 *   ],
 *   "finalDate": "2025-10-23",
 *   "finalVersion": 2
 * }
 */

/**
 * 列番号を列名に変換（1-indexed）
 * @param col - 列番号（1=A, 26=Z, 27=AA）
 * @returns 列名: "A", "Z", "AA"
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

interface DraftData {
  version: number;
  sentDate: string;
  status: 'OK' | '修正要';
  revisionDate?: string;
  notes?: string;
}

interface ConfirmationData {
  drafts: DraftData[];
  finalDate: string | null;
  finalVersion: number | null;
}

interface ConfirmationUpdateRequest {
  issue: string;
  processNo: string;
  action: 'add_draft' | 'update_draft' | 'finalize';
  draft?: DraftData;
}

export async function PUT(request: Request) {
  try {
    const { issue, processNo, action, draft } = await request.json() as ConfirmationUpdateRequest;

    // パラメータ検証
    if (!issue || !processNo || !action) {
      return NextResponse.json(
        { success: false, error: '号数、工程No、アクションは必須です' },
        { status: 400 }
      );
    }

    if ((action === 'add_draft' || action === 'update_draft') && !draft) {
      return NextResponse.json(
        { success: false, error: 'add_draft/update_draftの場合は draft データが必要です' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 進捗入力シート_V2から該当の号数データを取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート_V2!A1:GV100');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シート_V2が見つかりません' },
        { status: 404 }
      );
    }

    // 2. 工程の確認列（JSON）を探す
    const headers = progressData[0];
    let actualCol = -1;

    for (let col = 1; col < headers.length; col++) {
      const header = headers[col];
      if (!header) continue;

      // "${processNo}_確認(JSON)" を探す
      if (header === `${processNo}_確認(JSON)`) {
        actualCol = col;
        break;
      }
    }

    if (actualCol === -1) {
      return NextResponse.json(
        { success: false, error: `工程 ${processNo} が見つかりません（JSON確認列が存在しません）` },
        { status: 404 }
      );
    }

    // 3. 該当号数の行を探す
    const rowIndex = progressData.findIndex((row, i) => i > 0 && row[0] === issue);

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `号 ${issue} が見つかりません` },
        { status: 404 }
      );
    }

    // 4. 現在のJSON内容を取得
    const currentJSON = progressData[rowIndex][actualCol];
    let confirmationData: ConfirmationData;

    if (currentJSON && typeof currentJSON === 'string' && currentJSON.trim().startsWith('{')) {
      try {
        confirmationData = JSON.parse(currentJSON);
      } catch (error) {
        console.error(`JSONパースエラー (${processNo}):`, error);
        confirmationData = { drafts: [], finalDate: null, finalVersion: null };
      }
    } else {
      confirmationData = { drafts: [], finalDate: null, finalVersion: null };
    }

    // 5. アクションに応じてJSON内容を更新
    if (action === 'add_draft') {
      if (!draft) {
        return NextResponse.json(
          { success: false, error: 'draft データが必要です' },
          { status: 400 }
        );
      }
      confirmationData.drafts.push(draft);
      console.log(`確認 ドラフト追加: ${processNo} - 第${draft.version}版 (${draft.sentDate})`);
    } else if (action === 'update_draft') {
      if (!draft) {
        return NextResponse.json(
          { success: false, error: 'draft データが必要です' },
          { status: 400 }
        );
      }
      const draftIndex = confirmationData.drafts.findIndex(d => d.version === draft.version);
      if (draftIndex === -1) {
        return NextResponse.json(
          { success: false, error: `第${draft.version}版が見つかりません` },
          { status: 404 }
        );
      }
      confirmationData.drafts[draftIndex] = draft;
      console.log(`確認 ドラフト更新: ${processNo} - 第${draft.version}版`);
    } else if (action === 'finalize') {
      if (confirmationData.drafts.length === 0) {
        return NextResponse.json(
          { success: false, error: '確定できるドラフト版がありません' },
          { status: 400 }
        );
      }
      const latestDraft = confirmationData.drafts[confirmationData.drafts.length - 1];
      confirmationData.finalDate = latestDraft.sentDate;
      confirmationData.finalVersion = latestDraft.version;
      console.log(`確認 確定: ${processNo} - 第${latestDraft.version}版 (${latestDraft.sentDate})`);
    }

    // 6. 更新後のJSONをシートに書き込み
    const colLetter = getColumnLetter(actualCol);
    const range = `進捗入力シート_V2!${colLetter}${rowIndex + 1}`;

    await updateSheetData(
      spreadsheetId,
      range,
      [[JSON.stringify(confirmationData)]]
    );

    return NextResponse.json({
      success: true,
      issue,
      processNo,
      action,
      confirmationData,
      updated: {
        range,
        column: colLetter,
        row: rowIndex + 1,
      }
    });

  } catch (error: any) {
    console.error('確認JSON更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '予期しないエラーが発生しました',
      },
      { status: 500 }
    );
  }
}
