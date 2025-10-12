import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getSheetData } from '@/lib/google-sheets';
import { generateNextContractId } from '@/lib/generate-contract-id';

interface CreateContractForExistingRequest {
  companyId: number;
  contractService: string;
  contractDate: string;
  amount: number;
  paymentMethod: string;
  paymentDueDate: string;
  publicationIssue: string;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body: CreateContractForExistingRequest = await request.json();

    // 1. 契約企業マスタから企業情報を取得
    const companyMaster = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約企業マスタ!A:B'
    );

    const company = companyMaster
      .slice(1)
      .find(row => parseInt(row[0]) === body.companyId);

    if (!company) {
      return NextResponse.json(
        { success: false, error: '企業が見つかりません' },
        { status: 404 }
      );
    }

    const companyName = company[1]; // B列: 企業正式名称

    // 2. 契約IDを生成
    const newContractId = await generateNextContractId(process.env.SALES_SPREADSHEET_ID!);

    // 3. 新しい行を作成
    const newRow = [
      newContractId,                                    // A: 契約ID
      body.companyId,                                   // B: 企業ID
      companyName,                                      // C: 企業名
      body.contractService,                             // D: 契約サービス
      body.contractDate,                                // E: 契約日
      `¥${body.amount.toLocaleString()}`,               // F: 契約金額
      body.paymentMethod,                               // G: 入金方法
      '',                                               // H: 契約書送付
      '',                                               // I: 契約書回収
      '',                                               // J: 申込書送付
      '',                                               // K: 申込書回収
      body.paymentDueDate,                              // L: 入金予定日
      '',                                               // M: 入金実績日
      '未入金',                                         // N: 入金ステータス
      '',                                               // O: 遅延日数
      body.publicationIssue,                            // P: 掲載開始号
      body.notes || '',                                 // Q: 備考
      // R〜AD列（進捗管理列）は空欄
      '', '', '', '', '', '', '', '', '', '', '', '', ''
    ];

    // 4. Google Sheets APIで追加
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SALES_SPREADSHEET_ID!,
      range: '契約・入金管理!A:AD',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({
      success: true,
      contractId: newContractId,
      companyId: body.companyId
    });

  } catch (error) {
    console.error('既存企業契約作成エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
