import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { PartnerDataResponse, StarInterview } from '@/types/partner';

/**
 * パートナー・スターデータ取得API
 * インタビュー回答フォームからスター紹介データを取得
 */
export async function GET(request: Request) {
  try {
    const spreadsheetId = process.env.PARTNERS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json<PartnerDataResponse>(
        {
          success: false,
          error: 'PARTNERS_SPREADSHEET_ID is not set',
        },
        { status: 500 }
      );
    }

    // 検索パラメータを取得
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const organizationFilter = searchParams.get('organization') || '';

    // スプレッドシートからデータを取得（全データ）
    const rawData = await getSheetData(spreadsheetId, 'A1:U100');

    if (!rawData || rawData.length < 2) {
      return NextResponse.json<PartnerDataResponse>(
        {
          success: false,
          error: 'No data found in partners spreadsheet',
        },
        { status: 404 }
      );
    }

    // ヘッダー行を除外してデータをパース
    const stars: StarInterview[] = rawData
      .slice(1) // ヘッダー行を除外
      .filter((row) => row[1]) // 名前が空の行は除外
      .map((row) => parseStarData(row))
      .filter((star) => {
        // 検索フィルター適用
        if (query) {
          const searchLower = query.toLowerCase();
          const matchesName = star.name.toLowerCase().includes(searchLower);
          const matchesOrg = star.organization.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesOrg) return false;
        }

        // 所属フィルター適用
        if (organizationFilter && star.organization !== organizationFilter) {
          return false;
        }

        return true;
      });

    // 所属一覧を取得（ユニーク値）
    const organizations = Array.from(
      new Set(
        rawData
          .slice(1)
          .filter((row) => row[3]) // 所属が入力されている行のみ
          .map((row) => row[3])
      )
    ).sort();

    return NextResponse.json<PartnerDataResponse>({
      success: true,
      data: {
        stars,
        organizations,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Partners API error:', error);
    return NextResponse.json<PartnerDataResponse>(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * スプレッドシートの行データをStarInterview型にパース
 */
function parseStarData(row: any[]): StarInterview {
  return {
    timestamp: row[0] || '',
    name: row[1] || '',
    nameKana: row[2] || '',
    organization: row[3] || '',
    position: row[4] || undefined,
    selfIntroduction: row[5] || '',
    motto: row[6] || '',
    mainPhotoUrl: row[7] || '',
    q1Dream: row[8] || '',
    q2Focus: row[9] || '',
    q3Motivation: row[10] || '',
    q4Growth: row[11] || '',
    q5StudentLife: row[12] || '',
    q6Challenge: row[13] || '',
    q7NextChallenge: row[14] || '',
    q8Future: row[15] || '',
    q9Message: row[16] || '',
    questionPhotosUrl: row[17] || undefined,
    photoPreferences: row[18] || undefined,
    email: row[19] || '',
  };
}
