import { NextResponse } from 'next/server';
import { getSheetData, updateCell } from '@/lib/google-sheets';
import type { ApiResponse } from '@/types/financial';

const SHEET_NAME = '支出管理マスタ';

/**
 * PUT /api/expenditures/[id]/settle
 * 支出を清算済みに変更
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const expenditureId = parseInt(id);

    if (isNaN(expenditureId)) {
      return NextResponse.json(
        {
          success: false,
          error: '無効なIDです'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    // IDの存在確認
    const rawData = await getSheetData(
      spreadsheetId,
      `${SHEET_NAME}!A:J`
    );

    if (expenditureId < 1 || expenditureId >= rawData.length) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    const row = rawData[expenditureId];
    if (!row || row.length === 0 || !row[0]) {
      return NextResponse.json(
        {
          success: false,
          error: '支出が見つかりません'
        } as ApiResponse<never>,
        { status: 404 }
      );
    }

    // 支払方法が「立替」でない場合はエラー
    const paymentMethod = (row[4] || '').trim();
    if (paymentMethod !== '立替') {
      return NextResponse.json(
        {
          success: false,
          error: '清算可能な支出は「立替」のみです'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    // 既に清算済みの場合はエラー
    const currentStatus = (row[6] || '').trim();
    if (currentStatus === '清算済み') {
      return NextResponse.json(
        {
          success: false,
          error: 'すでに清算済みです'
        } as ApiResponse<never>,
        { status: 400 }
      );
    }

    const sheetRowNumber = expenditureId + 1;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '/');

    // G列（清算ステータス）を「清算済み」に更新
    await updateCell(spreadsheetId, SHEET_NAME, sheetRowNumber, 7, '清算済み');

    // H列（清算日）を今日の日付に更新
    await updateCell(spreadsheetId, SHEET_NAME, sheetRowNumber, 8, today);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: '支出を清算済みに変更しました' }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('支出清算エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      } as ApiResponse<never>,
      { status: 500 }
    );
  }
}
