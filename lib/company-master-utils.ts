import { google } from 'googleapis';
import { normalizeCompanyName } from './normalize-company-name';

/**
 * 企業IDを取得（既存企業）または新規作成
 *
 * ロジック:
 * 1. 契約企業マスタのW列（顧客マスタ企業名）を検索
 * 2. 正規化名で比較
 * 3. 既存企業が見つかればその企業IDを返す
 * 4. 見つからなければ新規企業として登録し、新しい企業IDを返す
 */
export async function getOrCreateCompanyId(
  sheets: any,
  spreadsheetId: string,
  companyName: string
): Promise<number> {
  const sheetName = '契約企業マスタ';

  // 既存の企業を確認（W列で検索、正規化名で比較）
  const existingData = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:W`
  });

  const normalizedInputName = normalizeCompanyName(companyName);

  if (existingData.data.values && existingData.data.values.length > 1) {
    const existingCompany = existingData.data.values
      .slice(1)
      .find((row: string[]) =>
        normalizeCompanyName(row[22]) === normalizedInputName // W列: 顧客マスタ企業名
      );

    if (existingCompany) {
      // 既存企業が見つかった場合、その企業IDを返す
      return parseInt(existingCompany[0]);
    }
  }

  // 新規企業として登録
  const maxId = existingData.data.values && existingData.data.values.length > 1
    ? Math.max(...existingData.data.values.slice(1).map((row: string[]) => parseInt(row[0]) || 0))
    : 0;

  const newCompanyId = maxId + 1;

  // 今日の日付（YYYY/MM/DD形式）
  const today = new Date();
  const formattedDate = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  // 最小限の情報で企業マスタに登録
  const newRow = [
    newCompanyId,                    // A: 企業ID
    companyName,                     // B: 企業正式名称（仮）
    '',                              // C: 企業略称
    '',                              // D: 代表者役職
    '',                              // E: 代表者名
    '',                              // F: 郵便番号
    '',                              // G: 住所
    '',                              // H: 電話番号
    '',                              // I: FAX番号
    '',                              // J: メールアドレス
    '',                              // K: HP URL
    '',                              // L: 担当者名
    '',                              // M: 担当者メールアドレス
    '',                              // N: 担当者電話番号
    '',                              // O: 業種
    '',                              // P: 従業員数
    '',                              // Q: 資本金
    '',                              // R: 設立年月日
    '',                              // S: 備考
    formattedDate,                   // T: 登録日
    formattedDate,                   // U: 最終更新日
    '顧客マスタ連動',                // V: データソース
    companyName,                     // W: 顧客マスタ企業名
    0,                               // X: 契約実績
    ''                               // Y: 最新契約ID
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A:Y`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [newRow]
    }
  });

  return newCompanyId;
}
