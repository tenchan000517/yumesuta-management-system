import { NextResponse } from 'next/server';
import { getSheetData, appendSheetRow, clearCacheForSpreadsheet } from '@/lib/google-sheets';
import { ensureDirectoryWithOAuth } from '@/lib/google-drive';

/**
 * 新規号作成API
 * POST /api/yumemaga-v2/create-issue
 *
 * 処理:
 * 1. 発行日から月号を計算
 * 2. 進捗入力シート_V2に新しい行を作成（締切日を自動設定）
 * 3. 全カテゴリのDriveフォルダに月号フォルダを作成
 */
export async function POST(request: Request) {
  try {
    const { publishDate } = await request.json();

    if (!publishDate) {
      return NextResponse.json(
        { success: false, error: '発行日を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 発行日から月号を計算
    const date = new Date(publishDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const issue = `${year}年${month}月号`;
    const folderName = `${year}_${month}`;

    console.log(`📅 発行日: ${publishDate} → 月号: ${issue}`);

    // 2. 既に存在するかチェック
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート_V2!A:A');
    const existingIssues = progressData.slice(1).map(row => row[0]);

    if (existingIssues.includes(issue)) {
      return NextResponse.json(
        { success: false, error: `${issue} は既に存在します` },
        { status: 400 }
      );
    }

    // 3. 締切日マスターから全工程の締切日を取得
    const deadlineData = await getSheetData(spreadsheetId, '締切日マスター!A:C');
    const deadlineMap: Record<string, { type: string; day: number }> = {};

    for (let i = 1; i < deadlineData.length; i++) {
      const [processNo, deadlineType, day] = deadlineData[i];
      if (processNo && day) {
        deadlineMap[processNo] = { type: deadlineType, day: parseInt(day) };
      }
    }

    console.log(`📋 締切日マスターから ${Object.keys(deadlineMap).length} 工程の締切日を取得`);

    // 4. ヘッダー行から工程No列を特定
    const headers = await getSheetData(spreadsheetId, '進捗入力シート_V2!1:1');
    const headerRow = headers[0];
    const processColumns: Record<string, number> = {};

    for (let col = 1; col < headerRow.length; col++) {
      const header = headerRow[col];
      const match = header?.match(/^([A-Z]-\d+)予定$/);
      if (match) {
        const processNo = match[1];
        processColumns[processNo] = col;
      }
    }

    console.log(`📊 進捗入力シート_V2から ${Object.keys(processColumns).length} 工程の列を特定`);

    // 5. 新しい行を作成
    const newRow = new Array(headerRow.length).fill('');
    newRow[0] = issue; // A列: 月号

    let deadlineCount = 0;

    for (const processNo in deadlineMap) {
      const { type, day } = deadlineMap[processNo];
      const colIndex = processColumns[processNo];

      if (colIndex === undefined) {
        console.log(`⚠️ ${processNo} の列が見つかりません`);
        continue;
      }

      // 締切日を計算
      let deadlineDate: Date;
      if (type === '前月') {
        // 前月 = 発行月 - 2ヶ月（制作月ベース）
        deadlineDate = new Date(year, month - 3, day);
      } else if (type === '当月') {
        // 当月 = 発行月 - 1ヶ月（制作月）
        deadlineDate = new Date(year, month - 2, day);
      } else {
        continue;
      }

      // うるう年・月末調整
      if (deadlineDate.getDate() !== day) {
        // 日付が変わった場合（例: 2月30日 → 3月2日）、前月末に調整
        deadlineDate = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), 0);
      }

      // M/D形式で設定
      const deadlineStr = `${deadlineDate.getMonth() + 1}/${deadlineDate.getDate()}`;
      newRow[colIndex] = deadlineStr;
      deadlineCount++;
    }

    // 6. 進捗入力シート_V2に新しい行を追加
    await appendSheetRow(spreadsheetId, '進捗入力シート_V2', newRow);

    console.log(`✅ ${issue} を進捗入力シート_V2に作成しました（${deadlineCount}工程の締切日を設定）`);

    // 7. カテゴリマスターから requiresData = TRUE のカテゴリを取得
    const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:J100');
    const categoriesWithData = categoryData.filter(row => {
      const requiresData = row[3]; // D列: requiresData
      return requiresData === 'TRUE' || requiresData === true;
    });

    console.log(`📁 ${categoriesWithData.length} カテゴリのDriveフォルダに月号フォルダを作成開始`);

    // 8. 各カテゴリの requiredData を分割して月号フォルダを作成
    const driveResults: Array<{ category: string; dataType: string; success: boolean; error?: string }> = [];

    for (const row of categoriesWithData) {
      const categoryId = row[0]; // A列: カテゴリID
      const requiredDataStr = row[4]; // E列: requiredData
      const driveId = row[9]; // J列: DriveフォルダID

      if (!driveId || !requiredDataStr) {
        console.log(`⚠️ ${categoryId}: DriveIDまたはrequiredDataが未設定`);
        continue;
      }

      const requiredDataList = requiredDataStr.split(',').map((s: string) => s.trim());

      for (const dataType of requiredDataList) {
        try {
          await ensureDirectoryWithOAuth(driveId, [dataType, folderName]);
          driveResults.push({ category: categoryId, dataType, success: true });
          console.log(`✅ ${categoryId}/${dataType}/${folderName} 作成成功`);
        } catch (error: any) {
          driveResults.push({ category: categoryId, dataType, success: false, error: error.message });
          console.error(`❌ ${categoryId}/${dataType}/${folderName} 作成失敗:`, error.message);
        }
      }
    }

    const successCount = driveResults.filter(r => r.success).length;
    const failCount = driveResults.filter(r => !r.success).length;

    console.log(`📁 Driveフォルダ作成完了: 成功 ${successCount}件, 失敗 ${failCount}件`);

    // 9. キャッシュをクリア
    clearCacheForSpreadsheet(spreadsheetId);

    return NextResponse.json({
      success: true,
      message: `${issue} を作成しました`,
      issue,
      deadlinesSet: deadlineCount,
      driveFolders: {
        success: successCount,
        failed: failCount,
        details: driveResults
      }
    });

  } catch (error: any) {
    console.error('新規号作成エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
