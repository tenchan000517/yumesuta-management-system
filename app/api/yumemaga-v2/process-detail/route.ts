import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { listFilesInFolder, ensureDirectory } from '@/lib/google-drive';
import type { ProcessDetail } from '@/types/yumemaga-process';

/**
 * 工程詳細取得API
 * GET /api/yumemaga-v2/process-detail?issue=2025年11月号&processNo=A-3
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');
    const processNo = searchParams.get('processNo');

    if (!issue || !processNo) {
      return NextResponse.json(
        { success: false, error: '月号と工程番号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 進捗入力シートから工程情報を取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    // 工程を検索（A列: 工程番号、D列: 月号）
    const processRow = progressData
      .slice(1)
      .find(row => {
        const rowProcessNo = row[0];
        const rowIssue = row[3] || '';
        const status = row[8] || 'active';

        return (
          rowProcessNo === processNo &&
          (rowIssue === issue || !rowIssue) &&
          (status === 'active' || !status)
        );
      });

    if (!processRow) {
      return NextResponse.json(
        { success: false, error: `工程${processNo}が見つかりません` },
        { status: 404 }
      );
    }

    // カテゴリIDを抽出（例: A-3 → A）
    const categoryId = processNo.split('-')[0];

    // 2. 工程詳細を構築
    const processDetail: ProcessDetail = {
      processNo: processRow[0],                    // A列: 工程番号
      processName: processRow[1],                  // B列: 工程名
      categoryId: categoryId,
      categoryName: getCategoryName(categoryId),
      issue: issue,
      overview: getProcessOverview(processNo),     // 工程概要（モックデータ）
      plannedDate: processRow[4] || '-',           // E列: 逆算予定日
      actualDate: processRow[6] || undefined,      // G列: 実績日
      status: determineStatus(processRow[4], processRow[6]),
      delayDays: calculateDelayDays(processRow[4], processRow[6]),
      checklist: getProcessChecklist(processNo),   // チェックリスト（モックデータ）
      requiredData: await getRequiredData(spreadsheetId, processNo, issue, categoryId),     // 必要データ（Google Drive連携）
      deliverables: getDeliverables(processNo),    // 成果物（モックデータ）
      guides: getGuides(processNo),                // ガイドリンク（モックデータ）
    };

    return NextResponse.json({
      success: true,
      process: processDetail,
    });
  } catch (error: any) {
    console.error('工程詳細取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '工程詳細の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}

// ステータス判定
function determineStatus(plannedDate: string, actualDate: string): 'completed' | 'in_progress' | 'delayed' | 'not_started' {
  if (actualDate) return 'completed';
  if (!plannedDate || plannedDate === '-') return 'not_started';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const planned = parseDate(plannedDate);
  if (!planned) return 'not_started';

  planned.setHours(0, 0, 0, 0);

  if (today > planned) return 'delayed';
  if (isSameDay(today, planned)) return 'in_progress';
  return 'not_started';
}

// 遅延日数計算
function calculateDelayDays(plannedDate: string, actualDate: string): number | undefined {
  if (actualDate || !plannedDate || plannedDate === '-') return undefined;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const planned = parseDate(plannedDate);
  if (!planned) return undefined;

  planned.setHours(0, 0, 0, 0);

  if (today > planned) {
    const diffTime = Math.abs(today.getTime() - planned.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  return undefined;
}

// 日付パース
function parseDate(dateStr: string): Date | null {
  if (!dateStr || dateStr === '-') return null;

  const parts = dateStr.split('/');
  if (parts.length !== 2 && parts.length !== 3) return null;

  if (parts.length === 2) {
    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = new Date().getFullYear();
    return new Date(year, month - 1, day);
  } else {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    return new Date(year, month - 1, day);
  }
}

// 同日チェック
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

// カテゴリ名取得（モックデータ）
function getCategoryName(categoryId: string): string {
  const map: Record<string, string> = {
    'A': 'メイン記事',
    'B': '特集記事',
    'C': '企業情報',
    'D': 'コラム',
    'E': '企業情報（更新）',
    'H': 'STAR①',
    'K': 'インタビュー②',
  };
  return map[categoryId] || categoryId;
}

// 工程概要取得（モックデータ）
function getProcessOverview(processNo: string): string {
  if (processNo.endsWith('-2')) {
    return 'インタビューを実施し、録音データと写真データを提出します。';
  } else if (processNo.endsWith('-3')) {
    return 'アップロードされた録音データを文字起こしし、テキストファイルとして保存します。';
  } else if (processNo.endsWith('-4')) {
    return '文字起こしテキストを元に、内容を整理・編集します。';
  }
  return '';
}

// チェックリスト取得（モックデータ）
function getProcessChecklist(processNo: string) {
  if (processNo.endsWith('-3')) {
    // 文字起こし工程のチェックリスト
    return [
      { id: `${processNo}-c1`, text: '録音データをダウンロード', checked: false },
      { id: `${processNo}-c2`, text: 'faster-whisperで文字起こし実行', checked: false },
      { id: `${processNo}-c3`, text: '文字起こしテキストを確認・修正', checked: false },
      { id: `${processNo}-c4`, text: 'テキストファイルをアップロード', checked: false },
    ];
  }
  return [];
}

// 必要データ取得（Google Drive連携）
async function getRequiredData(
  spreadsheetId: string,
  processNo: string,
  issue: string,
  categoryId: string
) {
  // -2（データ提出）と-3（文字起こし）のみ対応
  if (!processNo.endsWith('-2') && !processNo.endsWith('-3')) {
    return []; // データ提出・文字起こし工程以外は空
  }

  try {
    // 1. カテゴリマスターからDriveフォルダIDを取得
    const categoryMaster = await getSheetData(spreadsheetId, 'カテゴリマスター!A1:J100');
    const categoryRow = categoryMaster.slice(1).find(row => row[0] === categoryId);

    if (!categoryRow || !categoryRow[9]) {
      // DriveフォルダIDが見つからない場合はpendingで返す
      const dataName = processNo.endsWith('-2') ? '録音データ' : '録音データ（前工程から）';
      return [{
        id: `${processNo}-d1`,
        type: 'audio' as const,
        name: dataName,
        status: 'pending' as const,
        optional: false,
      }];
    }

    const driveFolderId = categoryRow[9]; // J列

    // 2. 月号フォーマット変換: "2025年11月号" → "2025_11"
    const issueFormatted = issue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    // 3. フォルダパスを解決（存在しなければ作成）
    const targetFolderId = await ensureDirectory(driveFolderId, ['録音データ', issueFormatted]);

    // 4. フォルダ内のmp3ファイルを全て取得
    const files = await listFilesInFolder(targetFolderId);
    const mp3Files = files.filter(file =>
      file.mimeType === 'audio/mpeg' ||
      file.name?.toLowerCase().endsWith('.mp3')
    );

    // 5. ファイルがない場合はpendingで返す
    const dataName = processNo.endsWith('-2') ? '録音データ' : '録音データ（前工程から）';

    if (mp3Files.length === 0) {
      return [{
        id: `${processNo}-d1`,
        type: 'audio' as const,
        name: dataName,
        status: 'pending' as const,
        optional: false,
      }];
    }

    // 6. 各ファイルをRequiredDataItemに変換（複数対応）
    return mp3Files.map((file, index) => {
      const fileSizeBytes = parseInt(file.size || '0', 10);
      const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(1);

      return {
        id: `${processNo}-d1-${index + 1}`,
        type: 'audio' as const,
        name: dataName,
        fileName: file.name || 'unknown.mp3',
        fileSize: `${fileSizeMB} MB`,
        status: 'submitted' as const, // ファイルが存在するのでsubmitted
        driveUrl: file.webViewLink || undefined,
        driveFileId: file.id || undefined,
        optional: false,
      };
    });

  } catch (error) {
    console.error('録音データ取得エラー:', error);
    // エラー時はpendingで返す
    const dataName = processNo.endsWith('-2') ? '録音データ' : '録音データ（前工程から）';
    return [{
      id: `${processNo}-d1`,
      type: 'audio' as const,
      name: dataName,
      status: 'pending' as const,
      optional: false,
    }];
  }
}

// 成果物取得（モックデータ + Google Drive連携予定）
function getDeliverables(processNo: string) {
  if (processNo.endsWith('-3')) {
    // 文字起こし工程の成果物
    return [
      {
        id: `${processNo}-del1`,
        name: '文字起こしテキスト',
        type: 'text' as const,
        status: 'not_started' as const,
        driveUrl: undefined,
        driveFileId: undefined,
        updatedAt: undefined,
      },
    ];
  }
  return [];
}

// ガイドリンク取得（モックデータ）
function getGuides(processNo: string) {
  if (processNo.endsWith('-3')) {
    return [
      {
        id: `${processNo}-g1`,
        label: 'faster-whisper GitHub',
        type: 'external' as const,
        url: 'https://github.com/SYSTRAN/faster-whisper',
        icon: '📖',
      },
    ];
  }
  return [];
}
