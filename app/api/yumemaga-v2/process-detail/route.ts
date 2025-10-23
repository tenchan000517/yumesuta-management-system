import { NextResponse } from 'next/server';
import { getBatchSheetData, getSheetData } from '@/lib/google-sheets';
import { listFilesInFolder, ensureDirectory } from '@/lib/google-drive';
import type { ProcessDetail } from '@/types/yumemaga-process';

/**
 * 工程詳細取得API (V2対応)
 * GET /api/yumemaga-v2/process-detail?issue=2025年11月号&processNo=A-3
 *
 * V2の変更点:
 * - 進捗入力シート_V2（横持ち構造）から該当月号の1行のみ読み込み
 * - 新工程マスター_V2から工程定義を取得
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

    // 1. バッチで必要なシートを一括取得
    const [processMasterData, progressDataV2, categoryMasterData] = await getBatchSheetData(
      spreadsheetId,
      [
        '新工程マスター_V2!A1:F200',
        '進捗入力シート_V2!A1:GV100',
        'カテゴリマスター!A1:J100',
      ]
    );

    // 2. 新工程マスター_V2から工程情報を取得
    const processMasterRow = processMasterData.slice(1).find(row => row[1] === processNo);

    if (!processMasterRow) {
      return NextResponse.json(
        { success: false, error: `工程${processNo}が工程マスターに見つかりません` },
        { status: 404 }
      );
    }

    const processName = processMasterRow[2]; // C列: 工程名
    const phase = processMasterRow[3]; // D列: フェーズ
    const dataType = processMasterRow[5]; // F列: データ型

    // 3. 進捗入力シート_V2から該当月号の行を取得
    if (progressDataV2.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シート_V2が見つかりません' },
        { status: 404 }
      );
    }

    const progressHeaders = progressDataV2[0];
    const progressRow = progressDataV2.slice(1).find(row => row[0] === issue);

    if (!progressRow) {
      return NextResponse.json(
        { success: false, error: `月号 ${issue} の進捗データが見つかりません` },
        { status: 404 }
      );
    }

    // 4. ヘッダー行から列マッピングを作成
    let plannedCol = -1;
    let actualCol = -1;

    for (let col = 1; col < progressHeaders.length; col++) {
      const header = progressHeaders[col];
      if (!header) continue;

      const match = header.match(/^([A-Z]-\d+)(予定|実績.*)/);
      if (match && match[1] === processNo) {
        const type = match[2];
        if (type === '予定') {
          plannedCol = col;
        } else if (type.startsWith('実績')) {
          actualCol = col;
        }
      }
    }

    // 5. 予定日と実績日を取得
    const plannedDate = plannedCol >= 0 ? (progressRow[plannedCol] || '-') : '-';
    const actualDate = actualCol >= 0 ? (progressRow[actualCol] || undefined) : undefined;

    // カテゴリIDを抽出（例: A-3 → A）
    const categoryId = processNo.split('-')[0];

    // 6. 工程詳細を構築
    const processDetail: ProcessDetail = {
      processNo,
      processName,
      categoryId,
      categoryName: getCategoryName(categoryId),
      issue,
      overview: getProcessOverview(processNo),
      plannedDate,
      actualDate,
      status: determineStatus(plannedDate, actualDate),
      delayDays: calculateDelayDays(plannedDate, actualDate),
      checklist: getProcessChecklist(processNo),
      requiredData: await getRequiredData(spreadsheetId, processNo, issue, categoryId),
      deliverables: getDeliverables(processNo),
      guides: getGuides(processNo),
    };

    // 内容整理工程（-4で終わる工程）の場合、準備工程のデータを取得
    if (processNo.endsWith('-4') && processName.includes('内容整理')) {
      try {
        // 同じカテゴリの準備工程（-1）のデータを取得
        const preparationProcessNo = `${categoryId}-1`;

        const interviewDataSheet = await getSheetData(
          spreadsheetId,
          'インタビュー実績データ!A1:H100'
        );

        const row = interviewDataSheet.find((r: any[]) => r[0] === issue);

        const categoryColumnMap: Record<string, number> = {
          'A': 1, 'K': 2, 'H': 3, 'I': 4, 'L': 5, 'M': 6, 'C': 7,
        };

        const columnIndex = categoryColumnMap[categoryId];
        const interviewData = row && row[columnIndex]
          ? JSON.parse(row[columnIndex])
          : null;

        // 「インタビュワーのこだわり」を取得
        const interviewerRequests = interviewData?.interviewerRequests || '';

        // ProcessDetailに追加
        processDetail.interviewerRequests = interviewerRequests;
      } catch (error) {
        console.error('インタビュー実績データ取得エラー:', error);
        // エラーが発生しても処理は続行
      }
    }

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

// データ種別のマッピング（フォルダ名、ファイル拡張子、RequiredDataItemのtype）
const DATA_TYPE_MAPPING: Record<string, { folderName: string; extensions: string[]; type: 'audio' | 'image' | 'document' | 'video' | 'other' }> = {
  '録音データ': {
    folderName: '録音データ',
    extensions: ['.mp3', '.wav', '.m4a', '.aac'],
    type: 'audio',
  },
  '写真データ': {
    folderName: '写真データ',
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.bmp'],
    type: 'image',
  },
  '撮影データ': {
    folderName: '撮影データ',
    extensions: ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.avi'],
    type: 'image', // 主に画像として扱う（動画も含む）
  },
  '情報シート': {
    folderName: '情報シート',
    extensions: ['.pdf', '.docx', '.xlsx', '.doc', '.xls'],
    type: 'document',
  },
};

// 必要データ取得（Google Drive連携）- 汎用化版
async function getRequiredData(
  spreadsheetId: string,
  processNo: string,
  issue: string,
  categoryId: string
) {
  try {
    // 1. カテゴリマスターから必要データ定義とDriveフォルダIDを取得
    const categoryMaster = await getSheetData(spreadsheetId, 'カテゴリマスター!A1:J100');
    const categoryRow = categoryMaster.slice(1).find(row => row[0] === categoryId);

    if (!categoryRow) {
      // カテゴリが見つからない場合は空配列
      return [];
    }

    const requiredDataDef = categoryRow[4]; // E列: 必要データ
    const driveFolderId = categoryRow[9]; // J列: DriveフォルダID

    // 必要データが未定義または"-"の場合は空配列
    if (!requiredDataDef || requiredDataDef === '-') {
      return [];
    }

    // DriveフォルダIDが未定義の場合は、pending状態で返す
    if (!driveFolderId) {
      const dataTypes = requiredDataDef.split(',').map((d: string) => d.trim());
      return dataTypes.map((dataType: string, index: number) => {
        const mapping = DATA_TYPE_MAPPING[dataType];
        return {
          id: `${processNo}-d${index + 1}`,
          type: mapping?.type || 'other' as const,
          name: dataType,
          status: 'pending' as const,
          optional: false,
        };
      });
    }

    // 2. 月号フォーマット変換: "2025年11月号" → "2025_11"
    const issueFormatted = issue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    // 3. 必要データ定義をパース（カンマ区切り）
    const dataTypes = requiredDataDef.split(',').map((d: string) => d.trim());

    // 4. 各データ種別ごとにファイルを取得
    const results: any[] = [];

    for (const dataType of dataTypes) {
      const mapping = DATA_TYPE_MAPPING[dataType];

      if (!mapping) {
        // マッピングが定義されていないデータ種別はpending
        results.push({
          id: `${processNo}-d${results.length + 1}`,
          type: 'other' as const,
          name: dataType,
          status: 'pending' as const,
          optional: false,
        });
        continue;
      }

      try {
        // フォルダパスを解決（存在しなければ作成）
        const targetFolderId = await ensureDirectory(driveFolderId, [mapping.folderName, issueFormatted]);

        // フォルダ内のファイルを全て取得
        const files = await listFilesInFolder(targetFolderId);

        // 拡張子でフィルタリング
        const filteredFiles = files.filter(file => {
          const fileName = file.name?.toLowerCase() || '';
          return mapping.extensions.some(ext => fileName.endsWith(ext.toLowerCase()));
        });

        if (filteredFiles.length === 0) {
          // ファイルがない場合はpending
          results.push({
            id: `${processNo}-d${results.length + 1}`,
            type: mapping.type as const,
            name: dataType,
            status: 'pending' as const,
            optional: false,
          });
        } else {
          // 各ファイルをRequiredDataItemに変換
          filteredFiles.forEach((file, index) => {
            const fileSizeBytes = parseInt(file.size || '0', 10);
            const fileSizeMB = (fileSizeBytes / (1024 * 1024)).toFixed(1);

            results.push({
              id: `${processNo}-d${results.length + 1}`,
              type: mapping.type as const,
              name: dataType,
              fileName: file.name || 'unknown',
              fileSize: `${fileSizeMB} MB`,
              status: 'submitted' as const,
              driveUrl: file.webViewLink || undefined,
              driveFileId: file.id || undefined,
              optional: false,
            });
          });
        }
      } catch (error) {
        console.error(`${dataType}取得エラー:`, error);
        // エラー時はpending
        results.push({
          id: `${processNo}-d${results.length + 1}`,
          type: mapping.type as const,
          name: dataType,
          status: 'pending' as const,
          optional: false,
        });
      }
    }

    return results;

  } catch (error) {
    console.error('必要データ取得エラー:', error);
    return [];
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
        label: 'faster-whisperセットアップガイド',
        type: 'internal' as const,
        url: '/guides/faster-whisper-setup',
        icon: '🔧',
      },
      {
        id: `${processNo}-g2`,
        label: 'faster-whisper GitHub',
        type: 'external' as const,
        url: 'https://github.com/SYSTRAN/faster-whisper',
        icon: '📖',
      },
    ];
  }
  return [];
}
