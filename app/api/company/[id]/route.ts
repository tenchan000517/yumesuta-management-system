import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { CompanyInfo } from '@/types/company-info';

/**
 * 特定企業情報取得API (GET)
 * Google Sheetsの「企業マスター」シートから指定企業IDのデータを取得
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const { id: companyId } = await params;

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
      return NextResponse.json(
        { success: false, error: '企業情報が見つかりません' },
        { status: 404 }
      );
    }

    // 指定された企業IDの行を探す
    const companyRow = rows.slice(1).find((row) => row[0] === companyId);

    if (!companyRow) {
      return NextResponse.json(
        { success: false, error: `企業ID ${companyId} が見つかりません` },
        { status: 404 }
      );
    }

    // データをパース
    const company: CompanyInfo = {
      企業ID: companyRow[0] || '',
      企業名: companyRow[1] || '',
      企業名_カナ: companyRow[2] || '',
      業種: companyRow[3] || '',
      事業エリア: companyRow[4] || '',
      説明文_一覧用: companyRow[5] || '',
      ロゴ画像パス: companyRow[6] || '',
      ヒーロー画像パス: companyRow[7] || '',
      QRコード画像パス: companyRow[8] || '',
      スローガン: companyRow[9] || '',
      代表者名: companyRow[10] || '',
      代表者名_英語: companyRow[11] || '',
      代表者役職: companyRow[12] || '',
      代表者写真パス: companyRow[13] || '',
      サービス1_画像パス: companyRow[14] || '',
      サービス1_タイトル: companyRow[15] || '',
      サービス1_説明: companyRow[16] || '',
      サービス2_画像パス: companyRow[17] || '',
      サービス2_タイトル: companyRow[18] || '',
      サービス2_説明: companyRow[19] || '',
      サービス3_画像パス: companyRow[20] || '',
      サービス3_タイトル: companyRow[21] || '',
      サービス3_説明: companyRow[22] || '',
      社長メッセージ: companyRow[23] || '',
      社員1_画像パス: companyRow[24] || '',
      社員1_質問: companyRow[25] || '',
      社員1_回答: companyRow[26] || '',
      社員2_画像パス: companyRow[27] || '',
      社員2_質問: companyRow[28] || '',
      社員2_回答: companyRow[29] || '',
      社員3_画像パス: companyRow[30] || '',
      社員3_質問: companyRow[31] || '',
      社員3_回答: companyRow[32] || '',
      取り組み1_タイトル: companyRow[33] || '',
      取り組み1_説明: companyRow[34] || '',
      取り組み2_タイトル: companyRow[35] || '',
      取り組み2_説明: companyRow[36] || '',
      取り組み3_タイトル: companyRow[37] || '',
      取り組み3_説明: companyRow[38] || '',
      住所: companyRow[39] || '',
      電話番号: companyRow[40] || '',
      FAX番号: companyRow[41] || '',
      ウェブサイト: companyRow[42] || '',
      問い合わせメール: companyRow[43] || '',
      設立年: companyRow[44] || '',
      従業員数: companyRow[45] || '',
      事業内容: companyRow[46] || '',
      初掲載号: companyRow[47] || '',
      最終更新号: companyRow[48] || '',
      ステータス: companyRow[49] || '',
      備考: companyRow[50] || '',
    };

    return NextResponse.json({
      success: true,
      company,
    });
  } catch (error: any) {
    console.error('Company get API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '企業情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

/**
 * 企業情報更新API (PUT)
 * Google Sheetsの「企業マスター」シートの指定企業IDのデータを更新
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'YUMEMAGA_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const { id: companyId } = await params;
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

    // 企業マスターシートから既存データを取得
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '企業マスター!A:A',
    });

    const rows = existingData.data.values || [];

    // 指定された企業IDの行番号を探す
    const rowIndex = rows.findIndex((row) => row[0] === companyId);

    if (rowIndex === -1) {
      return NextResponse.json(
        { success: false, error: `企業ID ${companyId} が見つかりません` },
        { status: 404 }
      );
    }

    // 行番号は1-indexed（ヘッダーも考慮）
    const rowNumber = rowIndex + 1;

    // 企業マスターシートの列構造に合わせてデータを配列に変換
    const rowData = [
      companyId,                                  // A: 企業ID（変更不可）
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

    // データを更新
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `企業マスター!A${rowNumber}:AY${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    return NextResponse.json({
      success: true,
      message: '企業情報を更新しました',
    });
  } catch (error: any) {
    console.error('Company update API error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '企業情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}
