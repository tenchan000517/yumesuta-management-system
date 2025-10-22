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

      // 4. V2の actual-date API を使って実績日を更新
      const today = new Date().toISOString().split('T')[0]; // "2025-10-22"

      // actual-date APIを直接呼び出す代わりに、内部的に更新
      const apiUrl = new URL('/api/yumemaga-v2/actual-date', request.url);
      const actualDateResponse = await fetch(apiUrl, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue,
          processNo: targetProcessNo,
          actualDate: today,
        }),
      });

      const actualDateResult = await actualDateResponse.json();

      if (!actualDateResult.success) {
        return NextResponse.json({
          success: true,
          completedProcesses: [],
          message: '対象工程が見つからないか、既に完了しています',
        });
      }

      return NextResponse.json({
        success: true,
        completedProcesses: [targetProcessNo],
        processName: targetProcessNo,
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

    // 2. 新工程マスター_V2から該当工程を検索
    const processMasterData = await getSheetData(spreadsheetId, '新工程マスター_V2!A1:F200');

    const targetProcess = processMasterData.slice(1).find((row: any[]) => {
      const processNo = row[1] || '';           // B列: 工程No
      const processName = row[2] || '';         // C列: 工程名

      // 条件:
      // - 工程NoがカテゴリIDで始まる
      // - 工程名にデータ種別名を含む（例: "データ提出", "撮影"）
      return (
        processNo.startsWith(categoryId) &&
        (processName.includes('データ提出') || processName.includes('撮影') || processName.includes('原稿提出'))
      );
    });

    // 3. エッジケース処理
    if (!targetProcess) {
      console.log(`該当工程が見つかりませんでした: issue=${issue}, categoryId=${categoryId}, dataType=${dataType}`);
      return NextResponse.json({
        success: true,
        completedProcesses: [],
        message: '該当する工程が見つかりませんでした',
      });
    }

    const processNo = targetProcess[1]; // B列: 工程No
    const processName = targetProcess[2]; // C列: 工程名

    // 4. V2の actual-date API を使って実績日を更新
    const today = new Date().toISOString().split('T')[0]; // "2025-10-22"

    const apiUrl = new URL('/api/yumemaga-v2/actual-date', request.url);
    const actualDateResponse = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        issue,
        processNo,
        actualDate: today,
      }),
    });

    const actualDateResult = await actualDateResponse.json();

    if (!actualDateResult.success) {
      console.log(`実績日更新失敗: ${processNo}`);
      return NextResponse.json({
        success: true,
        completedProcesses: [],
        message: '実績日の更新に失敗しました',
      });
    }

    // 5. 完了通知を返す
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
