import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * カテゴリマスター取得API
 * Phase 1: カテゴリの動的管理
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // カテゴリマスター取得（J列のDriveフォルダIDも含む）
    const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A1:J100');

    if (categoryData.length === 0) {
      return NextResponse.json(
        { success: false, error: 'カテゴリマスターが見つかりません' },
        { status: 404 }
      );
    }

    // ヘッダー行をスキップ
    const categories = categoryData.slice(1).map(row => ({
      categoryId: row[0],           // A列: カテゴリID
      categoryName: row[1],          // B列: カテゴリ名
      description: row[2] || '',     // C列: 説明
      confirmationRequired: row[3] === true || row[3] === 'TRUE', // D列: 確認送付必須
      requiredData: row[4] || '',    // E列: 必要データ
      displayOrder: parseInt(row[5]) || 0, // F列: 表示順
      icon: row[6] || '',            // G列: アイコン
      colorTheme: row[7] || 'gray',  // H列: 色テーマ
      status: row[8] || 'active',    // I列: ステータス
      driveFolderId: row[9] || '',   // J列: DriveフォルダID
    })).filter(cat => cat.status === 'active' && cat.categoryId); // アクティブなカテゴリのみ

    // 表示順でソート
    categories.sort((a, b) => a.displayOrder - b.displayOrder);

    console.log(`✅ カテゴリマスター取得: ${categories.length}カテゴリ`);

    return NextResponse.json({
      success: true,
      categories,
      total: categories.length,
    });
  } catch (error: any) {
    console.error('カテゴリマスター取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'カテゴリマスターの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
