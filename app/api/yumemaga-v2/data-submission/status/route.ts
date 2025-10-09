import { NextRequest, NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { ensureDirectoryWithOAuth, listFilesInFolderWithOAuth } from '@/lib/google-drive';

type DataType = 'recording' | 'photo' | 'planning' | 'movie' | 'other';
type DataStatus = 'submitted' | 'pending' | 'none';

interface RequiredDataItem {
  type: DataType;
  name: string;
  status: DataStatus;
  optional: boolean;
  fileCount: number;
  folderId: string | null;
}

interface CategorySubmission {
  categoryId: string;
  categoryName: string;
  requiredData: RequiredDataItem[];
}

interface SubmissionSummary {
  submitted: number;
  pending: number;
  none: number;
  total: number;
  progress: number;
}

// データ種別名→型のマッピング
const DATA_TYPE_MAP: Record<string, DataType> = {
  '録音データ': 'recording',
  '写真データ': 'photo',
  '企画内容': 'planning',
  '動画データ': 'movie',
  'その他': 'other',
};

/**
 * 月号から Google Drive フォルダ名を生成
 * 例: "2025年11月号" → "2025_11"
 */
function issueToFolderName(issue: string): string {
  const match = issue.match(/(\d{4})年(\d{1,2})月号/);
  if (!match) {
    throw new Error(`Invalid issue format: ${issue}`);
  }
  const [, year, month] = match;
  return `${year}_${month.padStart(2, '0')}`;
}

/**
 * データ提出状況取得API
 * GET /api/yumemaga-v2/data-submission/status?issue=2025年11月号
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');

    if (!issue) {
      return NextResponse.json(
        { success: false, error: 'issue parameter is required' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. カテゴリマスターから全カテゴリ取得
    const categoryData = await getSheetData(spreadsheetId, 'カテゴリマスター!A2:J100');

    // 2. 各カテゴリのデータ提出状況を取得
    const categories: CategorySubmission[] = [];
    const summary: SubmissionSummary = {
      submitted: 0,
      pending: 0,
      none: 0,
      total: 0,
      progress: 0,
    };

    for (const row of categoryData) {
      const categoryId = row[0]; // A列
      const categoryName = row[1]; // B列
      const requiredDataStr = row[4] || ''; // E列（必要データ）
      const categoryStatus = row[8]; // I列（ステータス）
      const categoryDriveId = row[9]; // J列（Drive ID）

      // アクティブなカテゴリのみ処理
      if (categoryStatus !== 'active' || !categoryDriveId) {
        continue;
      }

      // 必要データをカンマ区切りでパース
      const requiredDataNames = requiredDataStr
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);

      if (requiredDataNames.length === 0) {
        continue;
      }

      const requiredData: RequiredDataItem[] = [];

      // 各データ種別のファイル存在確認
      for (const dataTypeName of requiredDataNames) {
        const dataType = DATA_TYPE_MAP[dataTypeName];

        if (!dataType) {
          console.warn(`Unknown data type: ${dataTypeName}`);
          continue;
        }

        let status: DataStatus = 'none';
        let fileCount = 0;
        let folderId: string | null = null;

        try {
          // フォルダパス構築: カテゴリDriveID/データ種別名/月号フォルダ/
          const folderName = issueToFolderName(issue);
          const pathSegments = [dataTypeName, folderName];

          // フォルダを取得（存在しない場合は作成）
          folderId = await ensureDirectoryWithOAuth(categoryDriveId, pathSegments);

          // ファイル数をカウント
          const files = await listFilesInFolderWithOAuth(folderId);
          fileCount = files.length;

          // ステータス判定
          if (fileCount > 0) {
            status = 'submitted';
            summary.submitted++;
          } else {
            status = 'pending';
            summary.pending++;
          }
        } catch (error) {
          console.error(
            `Error checking files for ${categoryId}/${dataTypeName}/${issue}:`,
            error
          );
          status = 'none';
          summary.none++;
        }

        summary.total++;

        requiredData.push({
          type: dataType,
          name: dataTypeName,
          status,
          optional: false,
          fileCount,
          folderId,
        });
      }

      categories.push({
        categoryId,
        categoryName,
        requiredData,
      });
    }

    // 進捗率を計算
    if (summary.total > 0) {
      summary.progress = Math.round((summary.submitted / summary.total) * 100);
    }

    return NextResponse.json({
      success: true,
      issue,
      categories,
      summary,
    });
  } catch (error: any) {
    console.error('Data submission status API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get data submission status',
      },
      { status: 500 }
    );
  }
}
