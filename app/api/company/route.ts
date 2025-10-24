import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { CompanyInfo } from '@/types/company-info';

/**
 * 企業情報保存API (POST)
 * Google Sheetsの「企業マスター」シートに新規企業情報を追加
 */
export async function POST(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const companyData: Partial<CompanyInfo> = body;

    // バリデーション: 必須フィールドのチェック
    if (!companyData.企業名) {
      return NextResponse.json(
        { success: false, error: '企業名は必須です' },
        { status: 400 }
      );
    }

    if (!companyData.業種) {
      return NextResponse.json(
        { success: false, error: '業種は必須です' },
        { status: 400 }
      );
    }

    if (!companyData.住所) {
      return NextResponse.json(
        { success: false, error: '住所は必須です' },
        { status: 400 }
      );
    }

    if (!companyData.電話番号) {
      return NextResponse.json(
        { success: false, error: '電話番号は必須です' },
        { status: 400 }
      );
    }

    // Google Sheets API の認証
    const serviceAccountKey = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'
    );
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 企業マスターシートから既存データを取得（企業IDの最大値を取得するため）
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '企業マスター!A:A',
    });

    const rows = existingData.data.values || [];

    // 新しい企業IDを生成（既存の最大ID + 1）
    let newCompanyId = 1;
    if (rows.length > 1) {
      // ヘッダー行を除く
      const existingIds = rows
        .slice(1)
        .map(row => parseInt(row[0] || '0'))
        .filter(id => !isNaN(id));

      if (existingIds.length > 0) {
        newCompanyId = Math.max(...existingIds) + 1;
      }
    }

    // 企業マスターシートの列構造に合わせてデータを配列に変換
    // 列順: A-AZ列（52列）
    const rowData = [
      newCompanyId.toString(),                    // A: 企業ID
      companyData.企業名 || '',                   // B: 企業名
      companyData.企業名_カナ || '',              // C: 企業名（カナ）
      companyData.業種 || '',                     // D: 業種
      companyData.事業エリア || '',               // E: 事業エリア
      companyData.説明文_一覧用 || '',            // F: 説明文（一覧用）
      companyData.ロゴ画像パス || '',             // G: ロゴ画像パス
      companyData.ヒーロー画像パス || '',         // H: ヒーロー画像パス
      companyData.QRコード画像パス || '',         // I: QRコード画像パス
      companyData.スローガン || '',               // J: スローガン
      companyData.代表者名 || '',                 // K: 代表者名
      companyData.代表者名_英語 || '',            // L: 代表者名（英語）
      companyData.代表者役職 || '',               // M: 代表者役職
      companyData.代表者写真パス || '',           // N: 代表者写真パス
      companyData.サービス1_画像パス || '',       // O: サービス1_画像パス
      companyData.サービス1_タイトル || '',       // P: サービス1_タイトル
      companyData.サービス1_説明 || '',           // Q: サービス1_説明
      companyData.サービス2_画像パス || '',       // R: サービス2_画像パス
      companyData.サービス2_タイトル || '',       // S: サービス2_タイトル
      companyData.サービス2_説明 || '',           // T: サービス2_説明
      companyData.サービス3_画像パス || '',       // U: サービス3_画像パス
      companyData.サービス3_タイトル || '',       // V: サービス3_タイトル
      companyData.サービス3_説明 || '',           // W: サービス3_説明
      companyData.社長メッセージ || '',           // X: 社長メッセージ
      companyData.社員1_画像パス || '',           // Y: 社員1_画像パス
      companyData.社員1_質問 || '',               // Z: 社員1_質問
      companyData.社員1_回答 || '',               // AA: 社員1_回答
      companyData.社員2_画像パス || '',           // AB: 社員2_画像パス
      companyData.社員2_質問 || '',               // AC: 社員2_質問
      companyData.社員2_回答 || '',               // AD: 社員2_回答
      companyData.社員3_画像パス || '',           // AE: 社員3_画像パス
      companyData.社員3_質問 || '',               // AF: 社員3_質問
      companyData.社員3_回答 || '',               // AG: 社員3_回答
      companyData.取り組み1_タイトル || '',       // AH: 取り組み1_タイトル
      companyData.取り組み1_説明 || '',           // AI: 取り組み1_説明
      companyData.取り組み2_タイトル || '',       // AJ: 取り組み2_タイトル
      companyData.取り組み2_説明 || '',           // AK: 取り組み2_説明
      companyData.取り組み3_タイトル || '',       // AL: 取り組み3_タイトル
      companyData.取り組み3_説明 || '',           // AM: 取り組み3_説明
      companyData.住所 || '',                     // AN: 住所
      companyData.電話番号 || '',                 // AO: 電話番号
      companyData.FAX番号 || '',                  // AP: FAX番号
      companyData.ウェブサイト || '',             // AQ: ウェブサイト
      companyData.問い合わせメール || '',         // AR: 問い合わせメール
      companyData.設立年 || '',                   // AS: 設立年
      companyData.従業員数 || '',                 // AT: 従業員数
      companyData.事業内容 || '',                 // AU: 事業内容
      companyData.初掲載号 || '',                 // AV: 初掲載号
      companyData.最終更新号 || '',               // AW: 最終更新号
      companyData.ステータス || 'アクティブ',     // AX: ステータス
      companyData.備考 || '',                     // AY: 備考
    ];

    // データを追加
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '企業マスター!A:AY',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      companyId: newCompanyId,
      message: '企業情報を保存しました',
    });
  } catch (error: any) {
    console.error('Company save API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '企業情報の保存に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 企業情報一覧取得API (GET)
 * Google Sheetsの「企業マスター」シートから企業情報を取得
 */
export async function GET(request: Request) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    // Google Sheets API の認証
    const serviceAccountKey = JSON.parse(
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'
    );
    const auth = new google.auth.JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 企業マスターシートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '企業マスター!A:AY',
      valueRenderOption: 'FORMATTED_VALUE',
    });

    const rows = response.data.values || [];

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        companies: [],
      });
    }

    // ヘッダー行を除いてデータをパース
    const companies: CompanyInfo[] = rows.slice(1).map((row) => ({
      企業ID: row[0] || '',
      企業名: row[1] || '',
      企業名_カナ: row[2] || '',
      業種: row[3] || '',
      事業エリア: row[4] || '',
      説明文_一覧用: row[5] || '',
      ロゴ画像パス: row[6] || '',
      ヒーロー画像パス: row[7] || '',
      QRコード画像パス: row[8] || '',
      スローガン: row[9] || '',
      代表者名: row[10] || '',
      代表者名_英語: row[11] || '',
      代表者役職: row[12] || '',
      代表者写真パス: row[13] || '',
      サービス1_画像パス: row[14] || '',
      サービス1_タイトル: row[15] || '',
      サービス1_説明: row[16] || '',
      サービス2_画像パス: row[17] || '',
      サービス2_タイトル: row[18] || '',
      サービス2_説明: row[19] || '',
      サービス3_画像パス: row[20] || '',
      サービス3_タイトル: row[21] || '',
      サービス3_説明: row[22] || '',
      社長メッセージ: row[23] || '',
      社員1_画像パス: row[24] || '',
      社員1_質問: row[25] || '',
      社員1_回答: row[26] || '',
      社員2_画像パス: row[27] || '',
      社員2_質問: row[28] || '',
      社員2_回答: row[29] || '',
      社員3_画像パス: row[30] || '',
      社員3_質問: row[31] || '',
      社員3_回答: row[32] || '',
      取り組み1_タイトル: row[33] || '',
      取り組み1_説明: row[34] || '',
      取り組み2_タイトル: row[35] || '',
      取り組み2_説明: row[36] || '',
      取り組み3_タイトル: row[37] || '',
      取り組み3_説明: row[38] || '',
      住所: row[39] || '',
      電話番号: row[40] || '',
      FAX番号: row[41] || '',
      ウェブサイト: row[42] || '',
      問い合わせメール: row[43] || '',
      設立年: row[44] || '',
      従業員数: row[45] || '',
      事業内容: row[46] || '',
      初掲載号: row[47] || '',
      最終更新号: row[48] || '',
      ステータス: row[49] || '',
      備考: row[50] || '',
    }));

    return NextResponse.json({
      success: true,
      companies,
    });
  } catch (error: any) {
    console.error('Company list API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '企業情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
