import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * カテゴリ別進捗データ取得
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');

    if (!issue) {
      return NextResponse.json(
        { success: false, error: '月号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. ガントシートから工程スケジュールを取得
    const ganttSheetName = `逆算配置_ガント_${issue}`;
    const ganttData = await getSheetData(spreadsheetId, `${ganttSheetName}!A1:ZZ1000`);

    if (ganttData.length === 0) {
      return NextResponse.json(
        { success: false, error: `ガントシート「${ganttSheetName}」が見つかりません` },
        { status: 404 }
      );
    }

    // ガントシートから各工程の最初の予定日を抽出
    const headers = ganttData[0];
    const dateHeaders = headers.slice(3); // A,B,C列をスキップ

    const processSchedule: Record<string, string> = {};
    const nextMonthProcessNos = new Set<string>(); // 次月号工程のNoを記録

    ganttData.slice(1).forEach(row => {
      const processName = row[0]; // "A-3 メイン文字起こし"
      const layer = row[1]; // B列: レイヤー
      if (!processName) return;

      const match = processName.match(/^([A-Z]-\d+)/);
      if (!match) return;

      const processNo = match[1];

      // 次月号工程を記録
      if (layer === '次月号') {
        nextMonthProcessNos.add(processNo);
        return; // 次月号工程はスケジュールに含めない
      }

      // 最初の予定日を取得
      for (let i = 0; i < dateHeaders.length; i++) {
        if (row[i + 3]) { // 列A,B,Cをスキップして値をチェック
          processSchedule[processNo] = dateHeaders[i];
          break;
        }
      }
    });

    console.log(`📅 ガントシート: ${Object.keys(processSchedule).length}工程のスケジュールを取得`);

    // 2. 進捗入力シートから実績を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    // Phase 1: カテゴリマスターから動的にカテゴリを取得
    const categoryMasterData = await getSheetData(spreadsheetId, 'カテゴリマスター!A1:I100');
    const categories: Record<string, any[]> = {};

    // アクティブなカテゴリIDを抽出
    categoryMasterData.slice(1).forEach(row => {
      const categoryId = row[0];
      const status = row[8];
      if (categoryId && status === 'active') {
        categories[categoryId] = [];
      }
    });

    // Phase 3: 内部チェック・確認送付工程は確認ステータス取得のために別管理
    const confirmationProcesses: Record<string, any> = {};

    progressData.slice(1).forEach((row, index) => {
      const processNo = row[0]; // A列: 工程No
      const status = row[8];    // I列: ステータス
      const rowIssue = row[3];  // D列: 月号

      if (!processNo || status === 'archived') return;
      if (rowIssue && rowIssue !== issue) return;

      const prefix = processNo.split('-')[0]; // "A-3" → "A"

      // 次月号工程を除外
      if (nextMonthProcessNos.has(processNo)) return;

      // 工程名から工程Noを除去（"A-3 メイン文字起こし" → "メイン文字起こし"）
      let cleanProcessName = row[1] || '';
      const processNameMatch = cleanProcessName.match(/^[A-Z]-\d+\s+(.+)$/);
      if (processNameMatch) {
        cleanProcessName = processNameMatch[1];
      }

      // 内部チェック・確認送付・修正対応工程は確認ステータス取得用に別管理（カードには表示しない）
      // + 追加可能期間系の工程も除外
      if (cleanProcessName.includes('内部チェック') ||
          cleanProcessName.includes('確認送付') ||
          cleanProcessName.includes('修正対応') ||
          cleanProcessName.includes('追加可能期間') ||
          cleanProcessName.includes('修正変更対応可能期間') ||
          cleanProcessName.includes('パートナー修正変更対応可能期間')) {
        confirmationProcesses[prefix] = {
          confirmationStatus: row[7] || '制作中',
          rowIndex: index + 2,
        };
        return;
      }

      if (categories[prefix]) {
        categories[prefix].push({
          processNo: row[0],
          processName: cleanProcessName,
          plannedDate: processSchedule[processNo] || row[4] || '-', // ガント優先、なければE列
          actualDate: row[6] || '',
          confirmationStatus: row[7] || '-',
          rowIndex: index + 2, // Phase 3: 行番号を保存（+2はヘッダー行考慮）
        });
      }
    });

    // カテゴリ別の進捗率を計算
    const progress: Record<string, any> = {};

    Object.keys(categories).forEach(cat => {
      const processes = categories[cat];

      // Phase 3: 内部チェック・確認送付工程は既に除外されているので、全プロセスで計算
      const completed = processes.filter(p => p.actualDate).length;
      const total = processes.length;
      const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Phase 3: カテゴリ別の確認送付ステータスを取得（別管理のconfirmationProcessesから）
      const confirmationData = confirmationProcesses[cat];
      const categoryConfirmationStatus = confirmationData?.confirmationStatus || '制作中';
      const confirmationProcessRowIndex = confirmationData?.rowIndex || -1;

      // Phase 3: 自動ステータス遷移ロジックは一旦コメントアウト（デバッグ後に有効化）
      // TODO: 制作工程100%完了時に自動的に「内部チェック」に遷移
      // if (progressRate === 100 && categoryConfirmationStatus === '制作中' && confirmationProcessRowIndex > 0) {
      //   categoryConfirmationStatus = '内部チェック';
      //   await updateSheetData(
      //     spreadsheetId,
      //     `進捗入力シート!H${confirmationProcessRowIndex}`,
      //     [['内部チェック']]
      //   );
      // }

      // データ提出工程の予定日を取得（締切として使用）
      const dataSubmissionProcess = processes.find(p =>
        p.processName.includes('データ提出') ||
        p.processName.includes('撮影') ||
        p.processName.includes('原稿提出')
      );
      const dataSubmissionDeadline = dataSubmissionProcess?.plannedDate || '-';

      progress[cat] = {
        category: cat,
        total,
        completed,
        progress: progressRate,
        confirmationStatus: categoryConfirmationStatus, // Phase 3: 確認送付ステータス
        processes,
        dataSubmissionDeadline,
      };
    });

    // 工程が0件のカテゴリを除外
    const filteredProgress = Object.fromEntries(
      Object.entries(progress).filter(([_, cat]: [string, any]) => cat.processes.length > 0)
    );

    console.log(`✅ カテゴリ別進捗: ${Object.keys(filteredProgress).length}カテゴリ（工程0件のカテゴリを除外）`);

    return NextResponse.json({
      success: true,
      categories: filteredProgress,
    });
  } catch (error: any) {
    console.error('カテゴリ別進捗取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'カテゴリ別進捗の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
