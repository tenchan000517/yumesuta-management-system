// app/api/contract/list/route.ts
import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { ContractData } from '@/types/workflow';

export async function GET() {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const sheetName = '契約・入金管理';

    // Google Sheetsから全データ取得
    const rawData = await getSheetData(
      spreadsheetId,
      `${sheetName}!A:AD`
    );

    // データパース
    const contracts = parseContractData(rawData);

    return NextResponse.json({
      success: true,
      data: contracts
    });
  } catch (error) {
    console.error('契約データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

function parseContractData(rows: any[][]): ContractData[] {
  const data: ContractData[] = [];

  if (!rows || rows.length === 0) return data;

  // 1行目（ヘッダー）をスキップ
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // 空行をスキップ
    if (!row || row.length === 0) continue;

    // ID列が数値でない場合はヘッダーまたは無効な行としてスキップ
    const id = parseInt(row[0]);
    if (isNaN(id) || id === 0) continue;

    // 企業名が空の場合もスキップ
    if (!row[2] || row[2].trim() === '') continue;

    data.push({
      id: id,
      companyId: parseInt(row[1]),
      companyName: row[2] || '',
      contractService: row[3] || '',
      contractDate: row[4] || '',
      amount: row[5] || '',
      paymentMethod: row[6] || '',
      contractSentDate: row[7] || undefined,
      contractReceivedDate: row[8] || undefined,
      applicationSentDate: row[9] || undefined,
      applicationReceivedDate: row[10] || undefined,
      paymentDueDate: row[11] || '',
      paymentActualDate: row[12] || undefined,
      paymentStatus: row[13] || '未入金',
      delayDays: parseInt(row[14]) || undefined,
      publicationIssue: row[15] || '',
      notes: row[16] || undefined
    });
  }

  return data;
}
