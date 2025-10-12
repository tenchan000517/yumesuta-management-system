import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { CompanyMasterData } from '@/types/workflow';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = parseInt(id);

    if (isNaN(companyId)) {
      return NextResponse.json(
        { success: false, error: '無効な企業IDです' },
        { status: 400 }
      );
    }

    // 契約企業マスタから企業情報を取得
    const companyMasterData = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約企業マスタ!A:Y'
    );

    // 該当する企業を検索（A列 = 企業ID）
    const companyRow = companyMasterData.find(
      (row) => parseInt(row[0]) === companyId
    );

    if (!companyRow) {
      return NextResponse.json(
        { success: false, error: '企業が見つかりません' },
        { status: 404 }
      );
    }

    // CompanyMasterData 型に変換
    const company: CompanyMasterData = {
      companyId: parseInt(companyRow[0]),             // A列
      officialName: companyRow[1] || '',              // B列
      shortName: companyRow[2] || undefined,          // C列
      representativeTitle: companyRow[3] || '',       // D列
      representativeName: companyRow[4] || '',        // E列
      postalCode: companyRow[5] || '',                // F列
      address: companyRow[6] || '',                   // G列
      phone: companyRow[7] || '',                     // H列
      fax: companyRow[8] || undefined,                // I列
      email: companyRow[9] || '',                     // J列
      websiteUrl: companyRow[10] || undefined,        // K列
      contactPerson: companyRow[11] || '',            // L列
      contactEmail: companyRow[12] || '',             // M列
      contactPhone: companyRow[13] || undefined,      // N列
      industry: companyRow[14] || undefined,          // O列
      employeeCount: parseInt(companyRow[15]) || undefined, // P列
      capital: companyRow[16] || undefined,           // Q列
      establishedDate: companyRow[17] || undefined,   // R列
      notes: companyRow[18] || undefined,             // S列
      registeredDate: companyRow[19] || '',           // T列
      lastUpdatedDate: companyRow[20] || '',          // U列
      dataSource: companyRow[21] || '',               // V列
      customerMasterName: companyRow[22] || undefined, // W列
      contractCount: parseInt(companyRow[23]) || 0,   // X列
      latestContractId: parseInt(companyRow[24]) || undefined, // Y列
    };

    return NextResponse.json({
      success: true,
      company
    });

  } catch (error) {
    console.error('企業情報取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
