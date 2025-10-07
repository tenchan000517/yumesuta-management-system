import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * 進捗入力シートの列構造を更新
 * 必要な列（月号、逆算予定日、入力予定日、先方確認ステータス、ステータス）を追加
 */
export async function POST() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 現在のヘッダー行を取得
    const currentData = await getSheetData(spreadsheetId, '進捗入力シート!A1:Z1');
    const currentHeaders = currentData[0] || [];

    console.log('現在のヘッダー:', currentHeaders);

    // 期待する列構造
    const expectedHeaders = [
      '工程No',           // A列
      '工程名',           // B列
      '必要データ',       // C列
      '月号',             // D列（新規追加）
      '逆算予定日',       // E列（新規追加）
      '入力予定日',       // F列（新規追加）
      '実績日',           // G列
      '先方確認ステータス', // H列（新規追加）
      'ステータス',       // I列（新規追加）
      '備考',             // J列
    ];

    // 既存のヘッダーと期待するヘッダーを比較
    const needsUpdate = expectedHeaders.some((header, i) => currentHeaders[i] !== header);

    if (!needsUpdate) {
      return NextResponse.json({
        success: true,
        message: '列構造は既に最新です',
        headers: currentHeaders,
      });
    }

    // ヘッダー行を更新
    await updateSheetData(spreadsheetId, '進捗入力シート!A1:J1', [expectedHeaders]);

    // 既存データがある場合、列を調整（実績日の位置が変わっている可能性）
    const allData = await getSheetData(spreadsheetId, '進捗入力シート!A1:Z1000');

    if (allData.length > 1) {
      // 古い構造: A=工程No, B=工程名, C=必要データ, D=予定完了日, E=実績完了日, F=備考
      // 新しい構造: A=工程No, B=工程名, C=必要データ, D=月号, E=逆算予定日, F=入力予定日, G=実績日, H=先方確認ステータス, I=ステータス, J=備考

      const updatedRows = allData.slice(1).map(row => {
        const oldActualDate = row[4] || ''; // 旧E列（実績完了日）
        const oldNotes = row[5] || '';      // 旧F列（備考）

        return [
          row[0] || '',  // A: 工程No
          row[1] || '',  // B: 工程名
          row[2] || '',  // C: 必要データ
          '',            // D: 月号（空白）
          '',            // E: 逆算予定日（空白）
          '',            // F: 入力予定日（空白）
          oldActualDate, // G: 実績日（旧E列から移動）
          '',            // H: 先方確認ステータス（空白）
          'active',      // I: ステータス（デフォルトactive）
          oldNotes,      // J: 備考（旧F列から移動）
        ];
      });

      // データ行を更新
      await updateSheetData(
        spreadsheetId,
        `進捗入力シート!A2:J${updatedRows.length + 1}`,
        updatedRows
      );

      console.log(`${updatedRows.length}行のデータを新しい列構造に変換しました`);
    }

    return NextResponse.json({
      success: true,
      message: '列構造を更新しました',
      oldHeaders: currentHeaders,
      newHeaders: expectedHeaders,
      updatedRows: allData.length - 1,
    });
  } catch (error: any) {
    console.error('列構造更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '列構造の更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
