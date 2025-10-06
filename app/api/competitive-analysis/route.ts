import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import { listFilesInFolder } from '@/lib/google-drive';
import type { Competitor, CompetitorLink, CompetitorDocument, CompetitiveAnalysisData } from '@/types/competitive-analysis';

export async function GET() {
  try {
    const spreadsheetId = process.env.COMPETITIVE_ANALYSIS_SPREADSHEET_ID || process.env.TASKS_SPREADSHEET_ID!;
    const range = '競合分析!A2:G100'; // ヘッダー行を除く（ドライブフォルダID追加でG列まで）

    const data = await getSheetData(spreadsheetId, range);

    // データをパース
    const competitorsMap = new Map<string, Competitor>();

    data
      .filter((row: any[]) => row.length > 0 && row[0]) // 空行除外
      .forEach((row: any[]) => {
        const [companyName, category, linkName, url, notes, displayOrderStr, driveFolderId] = row;

        if (!companyName) return;

        const displayOrder = displayOrderStr ? parseInt(displayOrderStr, 10) : 999;

        // 既存の競合企業データを取得または新規作成
        let competitor = competitorsMap.get(companyName);
        if (!competitor) {
          competitor = {
            companyName,
            category: category || '未分類',
            links: [],
            driveFolderId: driveFolderId || undefined,
            documents: [],
            notes: notes || undefined,
            displayOrder,
          };
          competitorsMap.set(companyName, competitor);
        }

        // リンクを追加（URLが存在する場合のみ）
        if (url) {
          const link: CompetitorLink = {
            linkName: linkName || 'HP',
            url,
            iconName: getIconName(linkName),
          };
          competitor.links.push(link);
        }
      });

    // Map → Array に変換
    const competitors = Array.from(competitorsMap.values());

    // 各競合企業のドライブフォルダから資料を取得
    await Promise.all(
      competitors.map(async (competitor) => {
        if (competitor.driveFolderId) {
          try {
            const files = await listFilesInFolder(competitor.driveFolderId);
            competitor.documents = files.map((file: any): CompetitorDocument => ({
              name: file.name || '',
              id: file.id || '',
              webViewLink: file.webViewLink || '',
              webContentLink: file.webContentLink,
              mimeType: file.mimeType || '',
              size: file.size ? parseInt(file.size, 10) : undefined,
              modifiedTime: file.modifiedTime,
              iconLink: file.iconLink,
            }));
          } catch (error) {
            console.error(`Failed to fetch documents for ${competitor.companyName}:`, error);
            competitor.documents = [];
          }
        }
      })
    );

    // ソート
    const sortedCompetitors = competitors.sort((a, b) => a.displayOrder - b.displayOrder);

    const response: CompetitiveAnalysisData = {
      competitors: sortedCompetitors,
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    console.error('競合分析データ取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || '競合分析データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * リンク名からアイコン名を推定
 */
function getIconName(linkName?: string): string | undefined {
  if (!linkName) return 'Globe';

  const lowerName = linkName.toLowerCase();

  if (lowerName.includes('hp') || lowerName.includes('ホームページ') || lowerName.includes('web')) {
    return 'Globe';
  }
  if (lowerName.includes('instagram') || lowerName.includes('インスタ')) {
    return 'Instagram';
  }
  if (lowerName.includes('twitter') || lowerName.includes('x')) {
    return 'Twitter';
  }
  if (lowerName.includes('facebook')) {
    return 'Facebook';
  }
  if (lowerName.includes('linkedin')) {
    return 'Linkedin';
  }
  if (lowerName.includes('youtube')) {
    return 'Youtube';
  }

  return 'ExternalLink';
}
