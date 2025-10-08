import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';

/**
 * 企業別工程管理API
 * 企業マスターと進捗入力シートを紐付けて、企業ごとの進捗を返却
 */

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

interface CompanyStatus {
  status: 'new' | 'updated' | 'existing' | 'none';
  processCategoryId: string | null;
  description: string;
  badge: {
    label: string;
    bgColor: string;
    textColor: string;
  };
}

function getCompanyStatus(company: any, currentIssue: string): CompanyStatus {
  const companyStatus = (company.companyStatus || '').toString().trim();

  // AX列（index 49）のステータスで判定
  if (companyStatus === '新規') {
    return {
      status: 'new',
      processCategoryId: 'C',
      description: '新規企業（フル制作）',
      badge: {
        label: '新規',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
      },
    };
  }

  if (companyStatus === '変更') {
    return {
      status: 'updated',
      processCategoryId: 'E',
      description: '既存企業（一部変更）',
      badge: {
        label: '変更',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
      },
    };
  }

  if (companyStatus === '継続' || companyStatus === 'active') {
    return {
      status: 'existing',
      processCategoryId: 'E',
      description: '既存企業（継続掲載）',
      badge: {
        label: '継続',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
      },
    };
  }

  if (companyStatus === 'アーカイブ' || companyStatus === 'inactive') {
    return {
      status: 'none',
      processCategoryId: null,
      description: 'アーカイブ済み',
      badge: {
        label: 'アーカイブ',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-600',
      },
    };
  }

  // 空欄または不明な値の場合
  return {
    status: 'none',
    processCategoryId: null,
    description: '未設定',
    badge: {
      label: '未設定',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
    },
  };
}

/**
 * 企業マスターの51列入力状況から進捗を計算
 * @param companyRow 企業マスターの行データ（62列）
 */
function calculateCompanyMasterProgress(companyRow: any[]) {
  const totalColumns = 51;
  const filledColumns = companyRow.slice(0, 51).filter(cell => {
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
 * 工程の進捗を計算（参考情報用）
 */
function calculateProcessProgress(processes: any[]) {
  const total = processes.length;
  const completed = processes.filter(p => p.actualDate).length;
  const inProgress = processes.filter(p => !p.actualDate && p.status === 'in_progress').length;
  const notStarted = processes.filter(p => !p.actualDate && (p.status === 'not_started' || !p.status)).length;

  return {
    total,
    completed,
    inProgress,
    notStarted,
    progressRate: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const issue = searchParams.get('issue');

    if (!issue) {
      return NextResponse.json(
        { success: false, error: '月号を指定してください' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 企業マスター取得
    const companyMasterData = await getSheetData(spreadsheetId, '企業マスター!A1:AZ100');

    if (companyMasterData.length === 0) {
      return NextResponse.json(
        { success: false, error: '企業マスターが見つかりません' },
        { status: 404 }
      );
    }

    // 企業マスターのパース（62列構造に対応）
    // 注意: 元の行データも保持して進捗計算に使用
    const companies = companyMasterData.slice(1).map(row => ({
      companyId: row[0] || '',
      companyName: row[1] || '',
      companyNameKana: row[2] || '',
      industry: row[3] || '',
      area: row[4] || '',
      description: row[5] || '',
      logoPath: row[6] || '',
      heroPath: row[7] || '',
      qrPath: row[8] || '',
      firstIssue: row[47] || '', // AV列: 初掲載号
      lastIssue: row[48] || '',  // AW列: 最終更新号
      companyStatus: row[49] || '', // AX列: ステータス（新規/変更/継続/active/inactive）
      rawRow: row, // 進捗計算用に元データを保持
    })).filter(c => c.companyId);

    console.log(`📊 企業マスター: ${companies.length}社取得`);

    // 2. 進捗入力シートから工程データ取得
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    if (progressData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シートが見つかりません' },
        { status: 404 }
      );
    }

    // 3. ガントシートから予定日を取得
    const ganttSheetName = `逆算配置_ガント_${issue}`;
    const ganttData = await getSheetData(spreadsheetId, `${ganttSheetName}!A1:ZZ1000`);

    const processSchedule: Record<string, string> = {};
    if (ganttData.length > 0) {
      const headers = ganttData[0];
      const dateHeaders = headers.slice(3);

      ganttData.slice(1).forEach(row => {
        const processName = row[0];
        if (!processName) return;

        const match = processName.match(/^([A-Z]-\d+)/);
        if (!match) return;

        const processNo = match[1];

        for (let i = 0; i < dateHeaders.length; i++) {
          if (row[i + 3]) {
            processSchedule[processNo] = dateHeaders[i];
            break;
          }
        }
      });
    }

    console.log(`📅 ガントシート: ${Object.keys(processSchedule).length}工程のスケジュール取得`);

    // 4. 各企業の工程を抽出
    const companiesWithProcesses = companies.map(company => {
      const companyStatus = getCompanyStatus(company, issue);

      // 今号非掲載の企業はスキップ
      if (companyStatus.status === 'none') {
        return null;
      }

      const categoryId = companyStatus.processCategoryId;

      // 該当カテゴリ（C or E）の工程を抽出
      const companyProcesses = progressData
        .slice(1)
        .filter(row => {
          const processNo = row[0];
          const rowIssue = row[3];
          const processCategory = processNo ? processNo.split('-')[0] : '';

          return (
            processCategory === categoryId &&
            rowIssue === issue
          );
        })
        .map(row => {
          const processNo = row[0];
          let processName = row[1] || '';

          // 工程名から工程Noを除去（"C-1 データ提出" → "データ提出"）
          const match = processName.match(/^[A-Z]-\d+\s+(.+)$/);
          if (match) {
            processName = match[1];
          }

          return {
            processNo,
            processName,
            plannedDate: processSchedule[processNo] || row[4] || '-',
            actualDate: row[6] || '',
            status: row[8] || 'not_started',
          };
        });

      // 進捗計算: 企業マスター51列の入力状況
      const masterProgress = calculateCompanyMasterProgress(company.rawRow);

      // 工程進捗も参考情報として計算
      const processProgress = calculateProcessProgress(companyProcesses);

      console.log(`進捗計算: ${company.companyId} → ${masterProgress.filled}列/${masterProgress.total}列 (${masterProgress.progressRate}%)`);

      // 51列フィールドの入力状況を取得
      const fields = COMPANY_FIELDS.map(field => ({
        index: field.index,
        name: field.name,
        key: field.key,
        value: company.rawRow[field.index] || '',
        filled: !!(company.rawRow[field.index] && String(company.rawRow[field.index]).trim() !== ''),
        required: field.required,
      }));

      return {
        companyId: company.companyId,
        companyName: company.companyName,
        logoPath: company.logoPath,
        industry: company.industry,
        area: company.area,
        status: companyStatus.status,
        statusDescription: companyStatus.description,
        statusBadge: companyStatus.badge,
        progress: {
          total: masterProgress.total,
          completed: masterProgress.filled,
          inProgress: masterProgress.notFilled,
          notStarted: 0,
          progressRate: masterProgress.progressRate,
        },
        fields, // 51列フィールドの詳細情報
        processProgress, // 参考: 工程の進捗
        processes: companyProcesses,
      };
    }).filter(c => c !== null);

    console.log(`✅ 企業別工程: ${companiesWithProcesses.length}社の進捗を返却`);

    return NextResponse.json({
      success: true,
      companies: companiesWithProcesses,
      total: companiesWithProcesses.length,
    });
  } catch (error: any) {
    console.error('企業別工程取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業別工程の取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
