import { NextResponse } from 'next/server';
import { getSheetData, updateSheetCell } from '@/lib/google-sheets';

// データ種別を日本語名にマッピング
type DataType = 'recording' | 'photo' | 'planning';

const DATA_TYPE_REVERSE_MAP: Record<DataType, string> = {
  recording: '録音データ',
  photo: '写真データ',
  planning: '企画内容',
};

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { issue, categoryId, dataType, companyId, companyFolderType } = body;

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業モードの場合
    if (companyId && companyFolderType) {
      // 1. 企業マスターから企業ステータスを取得
      const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:AZ100');
      const companyRow = companyData.find((row: any[]) => row[0] === companyId);

      if (!companyRow) {
        return NextResponse.json(
          { success: false, error: '企業が見つかりません' },
          { status: 404 }
        );
      }

      const companyStatus = companyRow[49] || ''; // AX列: ステータス
      const companyName = companyRow[1] || '';

      // 2. ステータスからカテゴリを判定
      const targetCategory = companyStatus === '新規' ? 'C' : 'E';

      // 3. フォルダ種別から工程を判定
      const FOLDER_PROCESS_MAP: Record<string, string> = {
        '情報シート': `${targetCategory}-2`,  // 情報シート取得
        'ロゴ': `${targetCategory}-4`,         // 写真取得
        'ヒーロー画像': `${targetCategory}-4`,
        'QRコード': `${targetCategory}-4`,
        '代表者写真': `${targetCategory}-4`,
        'サービス画像': `${targetCategory}-4`,
        '社員写真': `${targetCategory}-4`,
        'その他': `${targetCategory}-4`,
      };

      const targetProcessNo = FOLDER_PROCESS_MAP[companyFolderType];

      if (!targetProcessNo) {
        return NextResponse.json({
          success: true,
          completedProcesses: [],
          message: '対象工程なし',
        });
      }

      // 4. 進捗入力シートから該当工程を検索
      const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A2:J1000');

      const targetRow = progressData.find((row: any[]) => {
        const processNo = row[0];
        const processIssue = row[3];
        const actualDate = row[6];

        return processNo === targetProcessNo &&
               (processIssue === issue || !processIssue) &&
               !actualDate; // 未完了のもの
      });

      if (!targetRow) {
        return NextResponse.json({
          success: true,
          completedProcesses: [],
          message: '対象工程が見つからないか、既に完了しています',
        });
      }

      // 5. 実績日を更新
      const today = new Date().toLocaleDateString('ja-JP');
      const rowIndex = progressData.indexOf(targetRow) + 2;

      await updateSheetCell(
        spreadsheetId,
        '進捗入力シート',
        `G${rowIndex}`,
        today
      );

      return NextResponse.json({
        success: true,
        completedProcesses: [targetProcessNo],
        processName: targetRow[1],
        message: `${companyName}の工程 ${targetProcessNo} を完了しました`,
      });
    }

    // カテゴリモードの既存処理
    if (!issue || !categoryId || !dataType) {
      return NextResponse.json(
        { success: false, error: '必須パラメータが不足しています' },
        { status: 400 }
      );
    }

    // 1. データ種別を日本語名に変換
    const dataTypeName = DATA_TYPE_REVERSE_MAP[dataType as DataType];
    if (!dataTypeName) {
      return NextResponse.json(
        { success: false, error: `無効なデータ種別: ${dataType}` },
        { status: 400 }
      );
    }

    // 2. 進捗入力シートから該当工程を検索
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A2:J200');

    const targetRow = progressData.find((row: any[]) => {
      const processNo = row[0] || '';           // A列: 工程No
      const requiredData = row[2] || '';        // C列: 必要データ
      const processIssue = row[3] || '';        // D列: 月号
      const actualDate = row[6] || '';          // G列: 実績日

      // 条件:
      // - 工程NoがカテゴリIDで始まる
      // - 必要データにデータ種別名を含む
      // - 月号が一致または空
      // - 実績日が未入力（既に完了している場合はスキップ）
      return (
        processNo.startsWith(categoryId) &&
        requiredData.includes(dataTypeName) &&
        (processIssue === issue || processIssue === '') &&
        !actualDate
      );
    });

    // 3. エッジケース処理
    if (!targetRow) {
      console.log(`該当工程が見つかりませんでした: issue=${issue}, categoryId=${categoryId}, dataType=${dataType}`);
      return NextResponse.json({
        success: true,
        completedProcesses: [],
        message: '該当する工程が見つかりませんでした',
      });
    }

    // 4. G列（実績日）を今日の日付で更新
    const today = new Date().toLocaleDateString('ja-JP'); // "2025/10/9"
    const rowIndex = progressData.indexOf(targetRow) + 2; // +2はヘッダー行とインデックス調整

    await updateSheetCell(
      spreadsheetId,
      '進捗入力シート',
      `G${rowIndex}`,
      today
    );

    // 5. 完了通知を返す
    const processNo = targetRow[0];
    const processName = targetRow[1];

    console.log(`工程完了: ${processNo}: ${processName} (実績日: ${today})`);

    return NextResponse.json({
      success: true,
      completedProcesses: [processNo],
      processName,
      message: `工程 ${processNo}: ${processName} を完了しました`,
    });
  } catch (error: any) {
    console.error('工程完了API エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '工程完了処理に失敗しました',
      },
      { status: 500 }
    );
  }
}
