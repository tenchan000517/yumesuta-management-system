import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 企業詳細取得API
 * GET /api/yumemaga-v2/companies/[companyName]
 *
 * 指定された企業名の詳細情報を企業マスターから取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ companyName: string }> }
) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;
    const { companyName: rawCompanyName } = await params;
    const companyName = decodeURIComponent(rawCompanyName);

    // 企業マスターの全列を取得（A～AY列、51列）
    const data = await getSheetData(spreadsheetId, '企業マスター!A:AY');

    if (!data || data.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: '企業マスターにデータが存在しません',
        },
        { status: 404 }
      );
    }

    // ヘッダー行と企業名（B列）で検索
    const headers = data[0];
    const companyRow = data
      .slice(1)
      .find((row) => row[1]?.trim() === companyName);

    if (!companyRow) {
      return NextResponse.json(
        {
          success: false,
          error: `企業 "${companyName}" が見つかりませんでした`,
        },
        { status: 404 }
      );
    }

    // 51列のフィールド定義（企業マスターの列構造）
    const fieldKeys = [
      'companyId', 'companyName', 'companyNameKana', 'industry', 'area',
      'description', 'logoPath', 'heroPath', 'qrPath', 'slogan',
      'presidentName', 'presidentNameEn', 'presidentPosition', 'presidentPhoto',
      'service1ImagePath', 'service1Title', 'service1Desc',
      'service2ImagePath', 'service2Title', 'service2Desc',
      'service3ImagePath', 'service3Title', 'service3Desc',
      'presidentMessage',
      'member1ImagePath', 'member1Question', 'member1Answer',
      'member2ImagePath', 'member2Question', 'member2Answer',
      'member3ImagePath', 'member3Question', 'member3Answer',
      'initiative1Title', 'initiative1Desc',
      'initiative2Title', 'initiative2Desc',
      'initiative3Title', 'initiative3Desc',
      'address', 'phone', 'fax', 'website', 'email',
      'established', 'employees', 'business',
      'firstIssue', 'lastIssue', 'status', 'notes',
    ];

    // 行データをオブジェクトに変換
    const company: Record<string, string> = {};
    fieldKeys.forEach((key, index) => {
      company[key] = companyRow[index] || '';
    });

    return NextResponse.json({
      success: true,
      company,
    });
  } catch (error: any) {
    console.error('企業詳細取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業詳細の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
