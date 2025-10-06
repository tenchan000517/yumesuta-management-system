import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

export interface DomainPowerData {
  domain: string;
  domainRating: number;
  backlinks: number;
  dofollowPercentage: number;
  linkingWebsites: number;
  linkingWebsitesDofollow: number;
  updatedAt: string;
}

/**
 * ドメインパワー取得API
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.TASKS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'TASKS_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    // スプレッドシートからドメインパワーデータを取得
    const data = await getSheetData(spreadsheetId, 'ドメイン評価!A1:H10');

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    // ヘッダー行を除いてパース（最新の1件のみ）
    const rows = data.slice(1);

    if (rows.length === 0 || !rows[0][0]) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    const row = rows[0];
    const domainPower: DomainPowerData = {
      domain: row[0] || '',
      domainRating: parseFloat(row[1]) || 0,
      backlinks: parseInt(row[2]) || 0,
      dofollowPercentage: parseFloat(row[3]) || 0,
      linkingWebsites: parseInt(row[4]) || 0,
      linkingWebsitesDofollow: parseFloat(row[5]) || 0,
      updatedAt: row[6] || '',
    };

    return NextResponse.json({
      success: true,
      data: domainPower,
    });
  } catch (error: any) {
    console.error('Failed to fetch domain power:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * ドメインパワー保存API
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      domain,
      domainRating,
      backlinks,
      dofollowPercentage,
      linkingWebsites,
      linkingWebsitesDofollow,
    } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'domain is required' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.TASKS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'TASKS_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const now = new Date().toISOString();

    // ヘッダー行
    const headers = [
      'ドメイン',
      'ドメイン評価',
      '被リンク数',
      'Dofollow率(%)',
      'リンク元サイト数',
      'Dofollowサイト率(%)',
      '最終更新日時',
    ];

    // データ行（常に最新の1件のみ保存）
    const dataRow = [
      domain,
      domainRating,
      backlinks,
      dofollowPercentage,
      linkingWebsites,
      linkingWebsitesDofollow,
      now,
    ];

    // スプレッドシートに書き込み
    const allData = [headers, dataRow];
    await updateSheetData(spreadsheetId, 'ドメイン評価!A1:G2', allData);

    return NextResponse.json({
      success: true,
      message: 'ドメインパワーを保存しました',
      data: {
        domain,
        domainRating,
        backlinks,
        dofollowPercentage,
        linkingWebsites,
        linkingWebsitesDofollow,
        updatedAt: now,
      },
    });
  } catch (error: any) {
    console.error('Failed to save domain power:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
