import { NextResponse } from 'next/server';
import { getBatchSheetData } from '@/lib/google-sheets';

/**
 * 準備フェーズデータ取得 (V2対応)
 *
 * V2の変更点:
 * - 進捗入力シート_V2から指定された号の準備フェーズのデータを取得
 * - 新工程マスター_V2から準備フェーズ工程の定義を取得
 * - ガントシートは使用しない
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue') || searchParams.get('currentIssue'); // 後方互換性のため両方サポート

    if (!issue) {
      return NextResponse.json(
        { success: false, error: '月号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. バッチで必要なシートを一括取得
    const [processMasterData, progressSheetData] = await getBatchSheetData(
      spreadsheetId,
      [
        '新工程マスター_V2!A1:F200',
        '進捗入力シート_V2!A1:GV100',
      ]
    );

    // 2. 進捗入力シート_V2から指定された号の行を取得
    const progressHeaders = progressSheetData[0];
    const issueRow = progressSheetData.slice(1).find(row => row[0] === issue);

    // 指定された号の行が存在しない場合は空配列を返す
    if (!issueRow) {
      console.log(`⚠️  ${issue} の進捗データが見つかりません。空データで返します。`);
      return NextResponse.json({
        success: true,
        issue,
        processes: [],
      });
    }

    // 4. ヘッダー行から列マッピングを作成
    const headerMap: Record<string, { plannedCol: number; actualCol: number }> = {};

    for (let col = 1; col < progressHeaders.length; col++) {
      const header = progressHeaders[col];
      if (!header) continue;

      const match = header.match(/^([A-Z]-\d+)(予定|実績.*)/);
      if (match) {
        const processNo = match[1];
        const type = match[2];

        if (!headerMap[processNo]) {
          headerMap[processNo] = { plannedCol: -1, actualCol: -1 };
        }

        if (type === '予定') {
          headerMap[processNo].plannedCol = col;
        } else if (type.startsWith('実績')) {
          headerMap[processNo].actualCol = col;
        }
      }
    }

    // 3. 新工程マスター_V2から準備フェーズ工程を取得
    // 準備フェーズの定義: フェーズが「準備」の工程
    const prepProcesses = processMasterData
      .slice(1)
      .filter(row => {
        const phase = row[3]; // D列: フェーズ
        return phase === '準備';
      })
      .map(row => {
        const processNo = row[1]; // B列: 工程No
        const processName = row[2]; // C列: 工程名

        const cols = headerMap[processNo];
        let plannedDate = '-';
        let actualDate = '';

        if (cols) {
          if (cols.plannedCol >= 0) {
            plannedDate = issueRow[cols.plannedCol] || '-';
          }
          if (cols.actualCol >= 0) {
            actualDate = issueRow[cols.actualCol] || '';
          }
        }

        return {
          processNo,
          name: processName,
          plannedDate,
          actualDate,
          issue,
        };
      });

    console.log(`✅ 準備フェーズ工程: ${prepProcesses.length}件取得 (${issue})`);

    return NextResponse.json({
      success: true,
      issue,
      processes: prepProcesses,
    });
  } catch (error: any) {
    console.error('次月号準備データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '次月号準備データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
