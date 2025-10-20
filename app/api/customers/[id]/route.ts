import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';
import type {
  YumeMagaCompany,
  CompanyField,
  CompanyProgress,
  CompanyDetailResponse,
  CompanyUpdateRequest,
  CompanyUpdateResponse,
} from '@/types/customer';

/**
 * 企業マスター51列のフィールド定義
 */
const COMPANY_FIELDS = [
  { index: 0, name: '企業ID', key: 'companyId', required: true },
  { index: 1, name: '企業名', key: 'companyName', required: true },
  { index: 2, name: '企業名(カナ)', key: 'companyNameKana', required: false },
  { index: 3, name: '業種', key: 'industry', required: false },
  { index: 4, name: '事業エリア', key: 'area', required: false },
  { index: 5, name: '説明文(一覧用)', key: 'description', required: false },
  { index: 6, name: 'ロゴ画像パス', key: 'logoPath', required: false },
  { index: 7, name: 'ヒーロー画像パス', key: 'heroPath', required: false },
  { index: 8, name: 'QRコード画像パス', key: 'qrPath', required: false },
  { index: 9, name: 'スローガン', key: 'slogan', required: false },
  { index: 10, name: '代表者名', key: 'presidentName', required: false },
  { index: 11, name: '代表者名(英語)', key: 'presidentNameEn', required: false },
  { index: 12, name: '代表者役職', key: 'presidentPosition', required: false },
  { index: 13, name: '代表者写真パス', key: 'presidentPhoto', required: false },
  { index: 14, name: 'サービス1_画像パス', key: 'service1ImagePath', required: false },
  { index: 15, name: 'サービス1_タイトル', key: 'service1Title', required: false },
  { index: 16, name: 'サービス1_説明', key: 'service1Desc', required: false },
  { index: 17, name: 'サービス2_画像パス', key: 'service2ImagePath', required: false },
  { index: 18, name: 'サービス2_タイトル', key: 'service2Title', required: false },
  { index: 19, name: 'サービス2_説明', key: 'service2Desc', required: false },
  { index: 20, name: 'サービス3_画像パス', key: 'service3ImagePath', required: false },
  { index: 21, name: 'サービス3_タイトル', key: 'service3Title', required: false },
  { index: 22, name: 'サービス3_説明', key: 'service3Desc', required: false },
  { index: 23, name: '社長メッセージ', key: 'presidentMessage', required: false },
  { index: 24, name: '社員1_画像パス', key: 'member1ImagePath', required: false },
  { index: 25, name: '社員1_質問', key: 'member1Question', required: false },
  { index: 26, name: '社員1_回答', key: 'member1Answer', required: false },
  { index: 27, name: '社員2_画像パス', key: 'member2ImagePath', required: false },
  { index: 28, name: '社員2_質問', key: 'member2Question', required: false },
  { index: 29, name: '社員2_回答', key: 'member2Answer', required: false },
  { index: 30, name: '社員3_画像パス', key: 'member3ImagePath', required: false },
  { index: 31, name: '社員3_質問', key: 'member3Question', required: false },
  { index: 32, name: '社員3_回答', key: 'member3Answer', required: false },
  { index: 33, name: '取り組み1_タイトル', key: 'initiative1Title', required: false },
  { index: 34, name: '取り組み1_説明', key: 'initiative1Desc', required: false },
  { index: 35, name: '取り組み2_タイトル', key: 'initiative2Title', required: false },
  { index: 36, name: '取り組み2_説明', key: 'initiative2Desc', required: false },
  { index: 37, name: '取り組み3_タイトル', key: 'initiative3Title', required: false },
  { index: 38, name: '取り組み3_説明', key: 'initiative3Desc', required: false },
  { index: 39, name: '住所', key: 'address', required: false },
  { index: 40, name: '電話番号', key: 'phone', required: false },
  { index: 41, name: 'FAX番号', key: 'fax', required: false },
  { index: 42, name: 'ウェブサイト', key: 'website', required: false },
  { index: 43, name: '問い合わせメール', key: 'email', required: false },
  { index: 44, name: '設立年', key: 'established', required: false },
  { index: 45, name: '従業員数', key: 'employees', required: false },
  { index: 46, name: '事業内容', key: 'business', required: false },
  { index: 47, name: '初掲載号', key: 'firstIssue', required: false },
  { index: 48, name: '最終更新号', key: 'lastIssue', required: false },
  { index: 49, name: 'ステータス', key: 'status', required: false },
  { index: 50, name: '備考', key: 'notes', required: false },
] as const;

/**
 * ステータスを正規化（「新規」→「new」）
 */
function normalizeStatus(rawStatus: string): 'new' | 'updated' | 'existing' | 'archive' | undefined {
  const status = rawStatus.trim();

  if (status === '新規') return 'new';
  if (status === '変更') return 'updated';
  if (status === '継続' || status === 'active') return 'existing';
  if (status === 'アーカイブ' || status === 'inactive') return 'archive';

  return undefined;
}

/**
 * ステータスを日本語に変換（「new」→「新規」）
 */
function denormalizeStatus(status: string): string {
  if (status === 'new') return '新規';
  if (status === 'updated') return '変更';
  if (status === 'existing') return '継続';
  if (status === 'archive') return 'アーカイブ';
  return status;
}

/**
 * スプレッドシート行データをYumeMagaCompany型に変換
 */
function parseCompanyRow(row: any[]): YumeMagaCompany {
  return {
    companyId: row[0] || '',
    companyName: row[1] || '',
    companyNameKana: row[2] || undefined,
    industry: row[3] || undefined,
    area: row[4] || undefined,
    description: row[5] || undefined,
    logoPath: row[6] || undefined,
    heroPath: row[7] || undefined,
    qrPath: row[8] || undefined,
    slogan: row[9] || undefined,
    presidentName: row[10] || undefined,
    presidentNameEn: row[11] || undefined,
    presidentPosition: row[12] || undefined,
    presidentPhoto: row[13] || undefined,
    service1ImagePath: row[14] || undefined,
    service1Title: row[15] || undefined,
    service1Desc: row[16] || undefined,
    service2ImagePath: row[17] || undefined,
    service2Title: row[18] || undefined,
    service2Desc: row[19] || undefined,
    service3ImagePath: row[20] || undefined,
    service3Title: row[21] || undefined,
    service3Desc: row[22] || undefined,
    presidentMessage: row[23] || undefined,
    member1ImagePath: row[24] || undefined,
    member1Question: row[25] || undefined,
    member1Answer: row[26] || undefined,
    member2ImagePath: row[27] || undefined,
    member2Question: row[28] || undefined,
    member2Answer: row[29] || undefined,
    member3ImagePath: row[30] || undefined,
    member3Question: row[31] || undefined,
    member3Answer: row[32] || undefined,
    initiative1Title: row[33] || undefined,
    initiative1Desc: row[34] || undefined,
    initiative2Title: row[35] || undefined,
    initiative2Desc: row[36] || undefined,
    initiative3Title: row[37] || undefined,
    initiative3Desc: row[38] || undefined,
    address: row[39] || undefined,
    phone: row[40] || undefined,
    fax: row[41] || undefined,
    website: row[42] || undefined,
    email: row[43] || undefined,
    established: row[44] || undefined,
    employees: row[45] || undefined,
    business: row[46] || undefined,
    firstIssue: row[47] || undefined,
    lastIssue: row[48] || undefined,
    status: normalizeStatus(row[49] || ''),
    notes: row[50] || undefined,
  };
}

/**
 * 51列の入力進捗を計算
 */
function calculateProgress(row: any[]): CompanyProgress {
  const totalColumns = 51;
  const filledColumns = row.slice(0, 51).filter(cell => {
    if (cell === null || cell === undefined) return false;
    const str = String(cell).trim();
    return str !== '';
  }).length;

  return {
    total: totalColumns,
    filled: filledColumns,
    notFilled: totalColumns - filledColumns,
    progressRate: Math.round((filledColumns / totalColumns) * 100),
  };
}

/**
 * フィールド詳細情報を生成
 */
function generateFields(row: any[]): CompanyField[] {
  return COMPANY_FIELDS.map(field => ({
    index: field.index,
    name: field.name,
    key: field.key as keyof YumeMagaCompany,
    value: row[field.index] || '',
    filled: !!(row[field.index] && String(row[field.index]).trim() !== ''),
    required: field.required,
  }));
}

/**
 * 企業詳細取得API
 * GET /api/customers/[id]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業マスター51列を取得（A-AY列）
    const data = await getSheetData(spreadsheetId, '企業マスター!A:AY');

    if (!data || data.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: '企業マスターが見つかりません',
        } as CompanyDetailResponse,
        { status: 404 }
      );
    }

    // 企業IDで検索（ヘッダー行をスキップ）
    const companyRow = data.slice(1).find((row) => row[0] === companyId);

    if (!companyRow) {
      return NextResponse.json(
        {
          success: false,
          error: `企業ID「${companyId}」が見つかりません`,
        } as CompanyDetailResponse,
        { status: 404 }
      );
    }

    // 企業情報をパース
    const company = parseCompanyRow(companyRow);

    // 進捗情報を計算
    const progress = calculateProgress(companyRow);

    // フィールド詳細情報を生成
    const fields = generateFields(companyRow);

    console.log(`✅ 企業詳細取得: ${companyId} (${company.companyName}) - 進捗${progress.progressRate}%`);

    const response: CompanyDetailResponse = {
      success: true,
      company: {
        ...company,
        progress,
        fields,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('企業詳細取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業詳細の取得に失敗しました',
      } as CompanyDetailResponse,
      { status: 500 }
    );
  }
}

/**
 * 企業情報更新API
 * PUT /api/customers/[id]
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const updates: CompanyUpdateRequest = await request.json();

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業マスター51列を取得（A-AY列）
    const data = await getSheetData(spreadsheetId, '企業マスター!A:AY');

    if (!data || data.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: '企業マスターが見つかりません',
        } as CompanyUpdateResponse,
        { status: 404 }
      );
    }

    // 企業IDで検索（ヘッダー行をスキップ）
    const companyRowIndex = data.slice(1).findIndex((row) => row[0] === companyId);

    if (companyRowIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: `企業ID「${companyId}」が見つかりません`,
        } as CompanyUpdateResponse,
        { status: 404 }
      );
    }

    // 実際の行番号（ヘッダー行+データ行の開始位置を考慮）
    const actualRowIndex = companyRowIndex + 2; // +1 (ヘッダー) +1 (1-indexed)

    // 更新データを構築
    const updatedRow = [...data[companyRowIndex + 1]]; // 現在の行データをコピー

    // フィールドごとに更新
    COMPANY_FIELDS.forEach((field) => {
      const key = field.key as string;
      if (key in updates && updates[key] !== undefined) {
        let value = updates[key];

        // ステータスの場合は日本語に変換
        if (key === 'status' && value) {
          value = denormalizeStatus(value as string);
        }

        updatedRow[field.index] = value || '';
      }
    });

    // 企業IDは変更不可
    updatedRow[0] = companyId;

    // バリデーション: 必須フィールドチェック
    if (!updatedRow[0] || !updatedRow[1]) {
      return NextResponse.json(
        {
          success: false,
          error: '企業IDと企業名は必須です',
        } as CompanyUpdateResponse,
        { status: 400 }
      );
    }

    // スプレッドシートを更新
    await updateSheetData(
      spreadsheetId,
      `企業マスター!A${actualRowIndex}:AY${actualRowIndex}`,
      [updatedRow]
    );

    // 更新後のデータを返却
    const updatedCompany = parseCompanyRow(updatedRow);

    console.log(`✅ 企業情報更新: ${companyId} (${updatedCompany.companyName})`);

    const response: CompanyUpdateResponse = {
      success: true,
      company: updatedCompany,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('企業情報更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業情報の更新に失敗しました',
      } as CompanyUpdateResponse,
      { status: 500 }
    );
  }
}
