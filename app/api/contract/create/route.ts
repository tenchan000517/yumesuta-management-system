import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { ParsedContractForm } from '@/types/workflow';
import { normalizeCompanyName } from '@/lib/normalize-company-name';

/**
 * 情報収集フォーマート受領後に契約情報を更新
 * 既存の契約レコード（企業ID・企業名のみ）に契約詳細を追記
 */
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

    // 1. 契約企業マスタから企業IDを取得（正規化名で検索）
    const companyMasterData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '契約企業マスタ!A:W'
    });

    const normalizedInputName = normalizeCompanyName(parsedData.companyName);
    const companyInMaster = companyMasterData.data.values
      ?.slice(1)
      .find(row => {
        // B列（企業正式名称）で検索し、W列（顧客マスタ企業名）がある場合はそちらも検索
        const normalizedBColumn = normalizeCompanyName(row[1] || '');
        const normalizedWColumn = normalizeCompanyName(row[22] || '');
        return normalizedBColumn === normalizedInputName || normalizedWColumn === normalizedInputName;
      });

    if (!companyInMaster) {
      return NextResponse.json(
        { success: false, error: '契約企業マスタに該当する企業が見つかりません' },
        { status: 404 }
      );
    }

    const companyId = parseInt(companyInMaster[0]); // A列: 企業ID

    // 契約企業マスタの詳細情報を更新
    await updateCompanyMaster(sheets, spreadsheetId, parsedData, companyId);

    // 2. 契約・入金管理シートで該当企業の行を検索（企業IDのみで検索、D列の有無は問わない）
    const sheetName = '契約・入金管理';
    const contractSheet = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:P`
    });

    const rows = contractSheet.data.values || [];

    // B列（企業ID）が一致する最初の行を検索
    let targetRowIndex = -1;
    let contractId = -1;

    for (let i = 2; i < rows.length; i++) {
      const row = rows[i];
      if (row && parseInt(row[1]) === companyId) { // B列=企業ID
        targetRowIndex = i + 1;
        contractId = parseInt(row[0]) || (i - 1);
        break;
      }
    }

    if (targetRowIndex === -1) {
      return NextResponse.json(
        { success: false, error: '該当する企業の契約レコードが見つかりません' },
        { status: 404 }
      );
    }

    // 3. 契約詳細を更新
    // D列（契約種別）は営業担当が手動入力するため、絶対に上書きしない
    // フォーマットに値がある場合のみ、該当列を個別に更新
    const currentRow = rows[targetRowIndex - 1];

    // E列: 契約日（フォーマットに値がある場合のみ）
    if (parsedData.contractDate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!E${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[parsedData.contractDate]]
        }
      });
    }

    // F列: 契約金額（フォーマットに値がある場合のみ）
    if (parsedData.annualFee && parsedData.annualFee > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!F${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[parsedData.annualFee]]
        }
      });
    }

    // L列: 入金予定日（フォーマットに値がある場合のみ）
    if (parsedData.paymentDeadline) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!L${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[parsedData.paymentDeadline]]
        }
      });
    }

    // P列: 掲載開始号（フォーマットに値があり、かつ有効な値の場合のみ）
    // N/A や「該当せず」などは書き込まない（ゆめマガ以外の契約種別では該当しない項目）
    if (
      parsedData.publicationStart &&
      parsedData.publicationStart !== 'N/A' &&
      !parsedData.publicationStart.includes('該当せず')
    ) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!P${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[parsedData.publicationStart]]
        }
      });
    }

    // R列: 契約開始日（フォーマットに値がある場合のみ）
    if (parsedData.contractStartDate) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!R${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[parsedData.contractStartDate]]
        }
      });
    }

    // S列: 契約期間（月数）（フォーマットに値がある場合のみ）
    if (parsedData.contractPeriodMonths && parsedData.contractPeriodMonths > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!S${targetRowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[parsedData.contractPeriodMonths]]
        }
      });
    }

    // T列: 自動更新有無（〇/✖）
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${sheetName}!T${targetRowIndex}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[parsedData.autoRenewal ? '〇' : '✖']]
      }
    });

    return NextResponse.json({
      success: true,
      contractId,
      companyId: currentRow[1] // B列の企業ID
    });

  } catch (error) {
    console.error('契約更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '不明なエラー'
      },
      { status: 500 }
    );
  }
}

/**
 * 契約企業マスタの詳細情報を更新
 */
async function updateCompanyMaster(
  sheets: any,
  spreadsheetId: string,
  parsedData: ParsedContractForm,
  companyId: number
): Promise<void> {
  const sheetName = '契約企業マスタ';

  // 企業IDで該当行を検索
  const existingData = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:W`
  });

  if (!existingData.data.values || existingData.data.values.length <= 1) {
    throw new Error('契約企業マスタに該当する企業が見つかりません');
  }

  // A列（企業ID）で検索
  let targetRowIndex = -1;
  for (let i = 1; i < existingData.data.values.length; i++) {
    const row = existingData.data.values[i];
    if (parseInt(row[0]) === companyId) {
      targetRowIndex = i + 1; // シートの行番号に変換
      break;
    }
  }

  if (targetRowIndex === -1) {
    throw new Error('契約企業マスタに該当する企業が見つかりません');
  }

  // 元々のB列の値（略称として保存）
  const currentRow = existingData.data.values[targetRowIndex - 1];
  const originalName = currentRow[1] || ''; // B列

  // 郵便番号を住所から抽出（〒XXX-XXXX形式）
  const postalCodeMatch = parsedData.address.match(/〒?(\d{3}-\d{4})/);
  const postalCode = postalCodeMatch ? postalCodeMatch[1] : '';

  // 住所から郵便番号部分を削除
  const addressWithoutPostalCode = parsedData.address
    .replace(/^〒?\d{3}-\d{4}\s*/, '') // 先頭の郵便番号を削除
    .trim();

  // 今日の日付（YYYY/MM/DD形式）
  const today = new Date();
  const formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  // 詳細情報を更新（B列〜V列）
  const updateValues = [
    parsedData.companyName,          // B: 企業正式名称（新しい正式名称で上書き）
    originalName,                    // C: 企業略称（元々のB列の値を保存）
    parsedData.representativeTitle,  // D: 代表者役職
    parsedData.representativeName,   // E: 代表者名
    postalCode,                      // F: 郵便番号
    addressWithoutPostalCode,        // G: 住所（郵便番号を除いたもの）
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
    // T: 登録日 - 変更しない
    formattedDate,                   // U: 最終更新日
    '情報収集フォーマット'           // V: データソース
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!B${targetRowIndex}:V${targetRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [updateValues]
    }
  });
}
