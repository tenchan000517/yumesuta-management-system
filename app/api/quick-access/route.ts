import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { QuickAccessButton, QuickAccessData } from '@/types/quick-access';

export async function GET() {
  try {
    const spreadsheetId = process.env.QUICK_ACCESS_SPREADSHEET_ID || process.env.TASKS_SPREADSHEET_ID!;
    const range = 'クイックアクセス!A2:F100'; // ヘッダー行を除く

    const data = await getSheetData(spreadsheetId, range);

    // データをパース
    const buttons: QuickAccessButton[] = data
      .filter((row: any[]) => row.length > 0 && row[0]) // 空行除外
      .map((row: any[]) => {
        const [buttonName, url, iconName, category, displayOrder, bgColor] = row;

        return {
          buttonName: buttonName || '',
          url: url || '',
          iconName: iconName || undefined,
          category: category || undefined,
          displayOrder: displayOrder ? parseInt(displayOrder, 10) : 999,
          bgColor: (bgColor as 'blue' | 'green' | 'orange' | 'purple' | 'gray') || 'blue',
        };
      })
      .filter((btn) => btn.buttonName && btn.url) // ボタン名とURLが必須
      .sort((a, b) => a.displayOrder - b.displayOrder); // 表示順でソート

    const response: QuickAccessData = {
      buttons,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error('クイックアクセスボタン取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'クイックアクセスボタンの取得に失敗しました' },
      { status: 500 }
    );
  }
}
