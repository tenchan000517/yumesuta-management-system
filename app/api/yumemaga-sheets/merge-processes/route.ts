import { NextResponse } from 'next/server';
import { getSheetData, appendSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * 新工程マスターから工程をマージ
 * - 新規工程を追加
 * - マスターに存在しない工程をアーカイブ
 */
export async function POST() {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 新工程マスターから全工程を取得
    const masterData = await getSheetData(spreadsheetId, '新工程マスター!A1:I100');
    const masterProcesses = masterData.slice(1).map(row => ({
      processNo: row[0],
      processName: row[1],
      requiredData: row[5] || '-',
    }));

    console.log(`新工程マスター: ${masterProcesses.length}工程`);

    // 進捗入力シートから既存工程を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');
    const progressHeaders = progressData[0];
    const existingProcesses = progressData.slice(1);

    const existingProcessNos = new Set(existingProcesses.map(row => row[0]));
    const masterProcessNos = new Set(masterProcesses.map(p => p.processNo));

    console.log(`進捗入力シート: ${existingProcesses.length}工程`);

    // アーカイブ対象（マスターに存在しない工程）
    const toArchive: number[] = [];
    existingProcesses.forEach((row, index) => {
      const processNo = row[0];
      const currentStatus = row[8]; // I列: ステータス

      if (processNo && !masterProcessNos.has(processNo) && currentStatus !== 'archived') {
        toArchive.push(index + 2); // ヘッダー行を除く（2行目から）
      }
    });

    // 新規追加対象（進捗入力シートに存在しない工程）
    const toAdd = masterProcesses.filter(p => !existingProcessNos.has(p.processNo));

    console.log(`アーカイブ対象: ${toArchive.length}工程`);
    console.log(`新規追加対象: ${toAdd.length}工程`);

    // アーカイブ処理
    for (const rowIndex of toArchive) {
      await updateSheetData(
        spreadsheetId,
        `進捗入力シート!I${rowIndex}`,
        [['archived']]
      );
    }

    // 新規工程を追加
    if (toAdd.length > 0) {
      const newRows = toAdd.map(p => [
        p.processNo,           // A: 工程No
        p.processName,         // B: 工程名
        p.requiredData,        // C: 必要データ
        '',                    // D: 月号
        '',                    // E: 逆算予定日
        '',                    // F: 入力予定日
        '',                    // G: 実績日
        '',                    // H: 先方確認ステータス
        'active',              // I: ステータス
        '',                    // J: 備考
      ]);

      await appendSheetData(spreadsheetId, '進捗入力シート', newRows);
    }

    return NextResponse.json({
      success: true,
      message: '工程のマージが完了しました',
      archived: toArchive.length,
      added: toAdd.length,
      newProcesses: toAdd.map(p => p.processNo),
    });
  } catch (error: any) {
    console.error('工程マージエラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '工程のマージに失敗しました',
      },
      { status: 500 }
    );
  }
}
