import { NextResponse } from 'next/server';
import { getSheetData, updateCellExtended } from '@/lib/google-sheets';

/**
 * 企業ステータス更新API
 * 企業マスターのAX列（49列目）のステータスを更新
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { companyId, status } = body;

    if (!companyId || !status) {
      return NextResponse.json(
        { success: false, error: '企業IDとステータスは必須です' },
        { status: 400 }
      );
    }

    // 有効なステータス値をチェック
    const validStatuses = ['新規', '変更', '継続', 'active', 'inactive', 'アーカイブ'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `無効なステータス: ${status}。有効な値: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業マスターから該当企業の行番号を検索
    const companyMasterData = await getSheetData(spreadsheetId, '企業マスター!A1:AZ100');

    if (companyMasterData.length === 0) {
      return NextResponse.json(
        { success: false, error: '企業マスターが見つかりません' },
        { status: 404 }
      );
    }

    // 企業IDで行を検索（1行目はヘッダーなので2行目から）
    let rowIndex = -1;
    for (let i = 1; i < companyMasterData.length; i++) {
      if (companyMasterData[i][0] === companyId) {
        rowIndex = i + 1; // スプレッドシートは1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `企業ID「${companyId}」が見つかりません` },
        { status: 404 }
      );
    }

    // AX列（49列目）を更新（列番号は1-indexed なので 50）
    await updateCellExtended(
      spreadsheetId,
      '企業マスター',
      rowIndex,
      50, // AX列 = 50列目
      status
    );

    console.log(`✅ 企業ステータス更新: ${companyId} → ${status} (行${rowIndex})`);

    return NextResponse.json({
      success: true,
      companyId,
      status,
      rowIndex,
    });
  } catch (error: any) {
    console.error('企業ステータス更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業ステータスの更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
