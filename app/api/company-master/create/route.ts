import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { ParsedContractForm } from '@/types/workflow';

export async function POST(request: Request) {
  try {
    const { parsedData }: { parsedData: ParsedContractForm } = await request.json();

    // Google Sheets API クライアント初期化
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const sheetName = '契約企業マスタ';

    // 1. 既存の企業を確認（企業正式名称で重複チェック）
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:B`
    });

    if (existingData.data.values && existingData.data.values.length > 1) {
      // ヘッダー行をスキップして検索
      const existingCompany = existingData.data.values
        .slice(1)
        .find(row => row[1] === parsedData.companyName);

      if (existingCompany) {
        // 既存企業が見つかった場合、その企業IDを返す
        return NextResponse.json({
          success: true,
          companyId: parseInt(existingCompany[0]),
          isNew: false,
          message: '既存の企業情報を使用します'
        });
      }
    }

    // 2. 新規企業として登録
    // 最大企業IDを取得
    const maxId = existingData.data.values && existingData.data.values.length > 1
      ? Math.max(...existingData.data.values.slice(1).map(row => parseInt(row[0]) || 0))
      : 0;

    const newCompanyId = maxId + 1;

    // 郵便番号を住所から抽出（〒XXX-XXXX形式）
    const postalCodeMatch = parsedData.address.match(/〒?(\d{3}-\d{4})/);
    const postalCode = postalCodeMatch ? postalCodeMatch[1] : '';

    // 今日の日付（YYYY/MM/DD形式）
    const today = new Date();
    const formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    // 3. 新しい行を作成
    const newRow = [
      newCompanyId,                    // A: 企業ID
      parsedData.companyName,          // B: 企業正式名称
      '',                              // C: 企業略称
      parsedData.representativeTitle,  // D: 代表者役職
      parsedData.representativeName,   // E: 代表者名
      postalCode,                      // F: 郵便番号
      parsedData.address,              // G: 住所
      parsedData.phone,                // H: 電話番号
      '',                              // I: FAX番号
      parsedData.email,                // J: メールアドレス
      '',                              // K: HP URL
      parsedData.contactPerson,        // L: 担当者名
      parsedData.contactEmail,         // M: 担当者メールアドレス
      '',                              // N: 担当者電話番号
      '',                              // O: 業種
      '',                              // P: 従業員数
      '',                              // Q: 資本金
      '',                              // R: 設立年月日
      '',                              // S: 備考
      formattedDate,                   // T: 登録日
      formattedDate,                   // U: 最終更新日
      '情報収集フォーマット',          // V: データソース
      '',                              // W: 顧客マスタ企業名
      0,                               // X: 契約実績
      ''                               // Y: 最新契約ID
    ];

    // 4. シートに追加
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetName}!A:Y`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [newRow]
      }
    });

    return NextResponse.json({
      success: true,
      companyId: newCompanyId,
      isNew: true,
      message: '新規企業として登録しました'
    });

  } catch (error) {
    console.error('企業マスタ登録エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}
