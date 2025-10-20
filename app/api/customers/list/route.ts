import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type {
  YumeMagaCompany,
  CompanySummary,
  CompanyListResponse,
  CompanySearchParams,
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
];

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
 * スプレッドシート行データをYumeMagaCompany型に変換
 */
function parseCompanyRow(row: any[]): YumeMagaCompany {
  const company: YumeMagaCompany = {
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

  return company;
}

/**
 * フィルタリング処理
 */
function filterCompanies(
  companies: YumeMagaCompany[],
  params: CompanySearchParams
): YumeMagaCompany[] {
  let filtered = companies;

  // 業種フィルター
  if (params.industry) {
    filtered = filtered.filter(c => c.industry === params.industry);
  }

  // エリアフィルター
  if (params.area) {
    filtered = filtered.filter(c => c.area === params.area);
  }

  // ステータスフィルター
  if (params.status) {
    filtered = filtered.filter(c => c.status === params.status);
  }

  // 検索（企業名・業種）
  if (params.search) {
    const searchLower = params.search.toLowerCase();
    filtered = filtered.filter(c => {
      const nameMatch = c.companyName?.toLowerCase().includes(searchLower);
      const industryMatch = c.industry?.toLowerCase().includes(searchLower);
      return nameMatch || industryMatch;
    });
  }

  return filtered;
}

/**
 * サマリー計算
 */
function calculateSummary(companies: YumeMagaCompany[]): CompanySummary {
  return {
    total: companies.length,
    new: companies.filter(c => c.status === 'new').length,
    updated: companies.filter(c => c.status === 'updated').length,
    existing: companies.filter(c => c.status === 'existing').length,
    archive: companies.filter(c => c.status === 'archive').length,
  };
}

/**
 * 企業一覧取得API
 * GET /api/customers/list
 *
 * クエリパラメータ:
 * - industry: 業種フィルター
 * - area: エリアフィルター
 * - status: ステータスフィルター (new/updated/existing/archive)
 * - search: 検索ワード（企業名・業種）
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // クエリパラメータ取得
    const params: CompanySearchParams = {
      industry: searchParams.get('industry') || undefined,
      area: searchParams.get('area') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      search: searchParams.get('search') || undefined,
    };

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 企業マスター51列を取得（A-AY列）
    const data = await getSheetData(spreadsheetId, '企業マスター!A:AY');

    if (!data || data.length < 2) {
      return NextResponse.json({
        success: true,
        companies: [],
        total: 0,
        summary: {
          total: 0,
          new: 0,
          updated: 0,
          existing: 0,
          archive: 0,
        },
      });
    }

    // ヘッダー行をスキップし、データ行のみ処理
    const companies = data
      .slice(1) // 1行目（ヘッダー）をスキップ
      .filter((row) => row[0]?.trim() && row[1]?.trim()) // 企業IDと企業名が両方存在
      .map(parseCompanyRow);

    // フィルタリング
    const filteredCompanies = filterCompanies(companies, params);

    // サマリー計算（フィルタリング前の全データ）
    const summary = calculateSummary(companies);

    console.log(`✅ 企業一覧取得: 全${companies.length}社 / フィルター後${filteredCompanies.length}社`);

    const response: CompanyListResponse = {
      success: true,
      companies: filteredCompanies,
      total: filteredCompanies.length,
      summary,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('企業一覧取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業一覧の取得に失敗しました',
      } as CompanyListResponse,
      { status: 500 }
    );
  }
}
