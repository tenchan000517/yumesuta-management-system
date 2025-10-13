import { NextResponse } from 'next/server';
import { getBatchSheetData } from '@/lib/google-sheets';
import { ensureDirectoryWithOAuth, listFilesInFolderWithOAuth } from '@/lib/google-drive';

/**
 * 企業別ページ制作進捗API
 * GET /api/yumemaga-v2/company-page-production?issue=2025年11月号
 *
 * 今号の新規企業・変更企業の制作工程進捗を返す
 */

type CompanyFolderType = 'ロゴ' | 'ヒーロー画像' | 'QRコード' | '代表者写真' | 'サービス画像' | '社員写真' | '情報シート' | 'その他';

const COMPANY_FOLDER_TYPES: CompanyFolderType[] = [
  'ロゴ',
  'ヒーロー画像',
  'QRコード',
  '代表者写真',
  'サービス画像',
  '社員写真',
  '情報シート',
  'その他',
];

/**
 * 企業マスター51列の入力状況から進捗を計算
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

interface TaskDetail {
  type?: 'file' | 'form' | 'folder' | 'process';
  name?: string;
  folder?: string;
  fileCount?: number;
  filledCount?: number;
  totalCount?: number;
  completed?: boolean;
  hasFiles?: boolean;
  progress?: number;
  processNo?: string;
  plannedDate?: string;
  actualDate?: string;
}

interface Task {
  taskId: string;
  taskName: string;
  progress: number;
  details?: TaskDetail[];
  note?: string;
}

interface CompanyProduction {
  companyId: string;
  companyName: string;
  status: string;
  categoryId: string;
  progress: number;
  tasks: Task[];
}

interface Summary {
  totalNew: number;
  completedNew: number;
  totalUpdated: number;
  completedUpdated: number;
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

    // 1. バッチで必要なシートを一括取得（4つのシートを1回のAPIリクエストで取得）
    const ganttSheetName = `逆算配置_ガント_${issue}`;
    const [companyData, categoryData, progressData, ganttData] = await getBatchSheetData(
      spreadsheetId,
      [
        '企業マスター!A2:AZ100',
        'カテゴリマスター!A2:J100',
        '進捗入力シート!A2:J1000',
        `${ganttSheetName}!A1:ZZ1000`,
      ]
    );

    // 今号の企業をフィルタリング（最終更新号が今号 または 初掲載号が今号）
    const currentIssueCompanies = companyData
      .filter((row: any[]) => {
        const companyId = row[0];
        const companyName = row[1];
        const firstIssue = row[47] || '';  // AV列: 初掲載号
        const lastIssue = row[48] || '';   // AW列: 最終更新号
        const status = row[49] || '';       // AX列: ステータス

        // 今号に関連する企業（初掲載 or 最終更新が今号）
        const isCurrentIssue = firstIssue === issue || lastIssue === issue;

        // ステータスが新規/変更のみ対象
        const isTargetStatus = status === '新規' || status === '変更';

        return companyId && companyName && isCurrentIssue && isTargetStatus;
      })
      .map((row: any[]) => ({
        companyId: row[0],
        companyName: row[1],
        status: row[49] || '',
        rawRow: row, // 進捗計算用に元データを保持
      }));

    console.log(`📊 今号の対象企業: ${currentIssueCompanies.length}社`);

    // 2. カテゴリC（企業情報）のDriveフォルダID取得
    const categoryCRow = categoryData.find((row: any[]) => row[0] === 'C');
    const categoryCDriveId = categoryCRow ? categoryCRow[9] : null;

    if (!categoryCDriveId) {
      console.warn('⚠️ カテゴリCのDriveフォルダIDが見つかりません。ファイルアップロード状況の取得をスキップします。');
    }

    const processSchedule: Record<string, string> = {};
    if (ganttData.length > 0) {
      const headers = ganttData[0];
      const dateHeaders = headers.slice(3);
      console.log(`📅 ガントシートのヘッダー数: ${dateHeaders.length}, 行数: ${ganttData.length - 1}`);

      ganttData.slice(1).forEach(row => {
        const processName = row[0];
        if (!processName) return;

        const match = processName.match(/^([A-Z]-\d+)/);
        if (!match) return;

        const processNo = match[1];

        for (let i = 0; i < dateHeaders.length; i++) {
          if (row[i + 3]) {
            processSchedule[processNo] = dateHeaders[i];
            console.log(`📅 ${processNo} の予定日: ${dateHeaders[i]}`);
            break;
          }
        }
      });
      console.log(`📅 取得した予定日数: ${Object.keys(processSchedule).length}`);
    } else {
      console.warn('⚠️ ガントシートが空です');
    }

    // 3. 各企業の制作工程を取得
    const newCompanies: CompanyProduction[] = [];
    const updatedCompanies: CompanyProduction[] = [];

    for (const company of currentIssueCompanies) {
      const categoryId = company.status === '新規' ? 'C' : 'E';

      // 企業マスター51列の進捗計算
      const masterProgress = calculateCompanyMasterProgress(company.rawRow);

      // 該当カテゴリの工程を取得（進捗入力シートから）
      const companyProcesses = progressData.filter((row: any[]) => {
        const processNo = row[0];
        const processIssue = row[3];

        // 月号が指定されている場合は月号もチェック、空の場合はカテゴリIDのみでマッチ
        const issueMatch = !processIssue || processIssue === issue;

        return processNo && processNo.startsWith(categoryId) && issueMatch;
      });

      // ファイルアップロード状況を取得
      const fileUpload: Record<CompanyFolderType, { uploaded: boolean; fileCount: number }> = {} as any;

      if (categoryCDriveId) {
        for (const folderType of COMPANY_FOLDER_TYPES) {
          try {
            // パス: カテゴリC_DriveID/企業名/フォルダ種別/
            const folderPath = await ensureDirectoryWithOAuth(categoryCDriveId, [company.companyName, folderType]);
            const files = await listFilesInFolderWithOAuth(folderPath);

            fileUpload[folderType] = {
              uploaded: files.length > 0,
              fileCount: files.length,
            };
          } catch (error) {
            console.error(`❌ Error checking ${company.companyName}/${folderType}:`, error);
            fileUpload[folderType] = {
              uploaded: false,
              fileCount: 0,
            };
          }
        }
      } else {
        // カテゴリCのDriveフォルダIDがない場合は全て0で初期化
        for (const folderType of COMPANY_FOLDER_TYPES) {
          fileUpload[folderType] = {
            uploaded: false,
            fileCount: 0,
          };
        }
      }

      // タスクリスト生成
      const tasks: Task[] = [];

      // タスク1: 情報提供依頼
      const infoSheetFileCount = fileUpload['情報シート']?.fileCount || 0;
      const infoSheetProgress = infoSheetFileCount > 0 ? 100 : 0;
      const infoProvisionProgress = Math.round((infoSheetProgress + masterProgress.progressRate) / 2);

      tasks.push({
        taskId: 'info-provision',
        taskName: '情報提供依頼',
        progress: infoProvisionProgress,
        details: [
          {
            type: 'file',
            name: '情報シート',
            fileCount: infoSheetFileCount,
            completed: infoSheetFileCount > 0,
            progress: infoSheetProgress,
          },
          {
            type: 'form',
            name: '企業情報入力フォーム',
            filledCount: masterProgress.filled,
            totalCount: masterProgress.total,
            progress: masterProgress.progressRate,
          },
        ],
      });

      // タスク2: 写真取得（情報シートを除く7フォルダ）
      const photoFolders: CompanyFolderType[] = ['ロゴ', 'ヒーロー画像', 'QRコード', '代表者写真', 'サービス画像', '社員写真', 'その他'];
      const photoDetails = photoFolders.map(folder => {
        const fileData = fileUpload[folder] || { uploaded: false, fileCount: 0 };
        return {
          type: 'folder' as const,
          folder,
          fileCount: fileData.fileCount,
          hasFiles: fileData.uploaded,
        };
      });

      const completedFolders = photoDetails.filter(d => d.hasFiles).length;
      const photoProgress = Math.round((completedFolders / photoFolders.length) * 100);

      tasks.push({
        taskId: 'photo-collection',
        taskName: '写真取得',
        progress: photoProgress,
        details: photoDetails,
      });

      // タスク3: ページ制作（進捗入力シートの工程実績から計算）
      const pageProductionProcesses = companyProcesses.filter(row => {
        const processNo = row[0];
        // C-6以降の工程（写真レタッチ、ページ制作、内部チェック、先方確認送付、追加可能期間など）
        if (!processNo) return false;
        const match = processNo.match(/^([A-Z])-(\d+)$/);
        if (!match) return false;
        const processNum = parseInt(match[2]);
        return processNum >= 6; // C-6, C-7, C-8, C-9, C-10...
      });

      const pageProductionDetails = pageProductionProcesses.map(row => {
        const processNo = row[0];
        let processName = row[1] || '';
        const plannedDate = processSchedule[processNo] || row[4] || '-'; // ガントシートから取得、なければE列
        const actualDate = row[6] || ''; // G列: 実績日

        // 工程名から工程Noを除去
        const match = processName.match(/^[A-Z]-\d+\s+(.+)$/);
        if (match) {
          processName = match[1];
        }

        // 「新規企業①」などのプレフィックスを除去
        processName = processName
          .replace(/^新規企業①?/, '')
          .replace(/^既存企業/, '')
          .trim();

        return {
          type: 'process' as const,
          processNo,
          name: processName,
          plannedDate,
          actualDate,
          completed: !!actualDate,
        };
      });

      const completedPageProcesses = pageProductionDetails.filter(d => d.completed).length;

      const pageProductionProgress = pageProductionProcesses.length > 0
        ? Math.round((completedPageProcesses / pageProductionProcesses.length) * 100)
        : 0;

      tasks.push({
        taskId: 'page-production',
        taskName: 'ページ制作',
        progress: pageProductionProgress,
        details: pageProductionDetails,
        note: `制作工程 ${completedPageProcesses}/${pageProductionProcesses.length} 完了`,
      });

      // 全体進捗: 3つのタスクの平均
      const totalProgress = tasks.reduce((sum, t) => sum + t.progress, 0);
      const progress = tasks.length > 0 ? Math.round(totalProgress / tasks.length) : 0;

      const companyData: CompanyProduction = {
        companyId: company.companyId,
        companyName: company.companyName,
        status: company.status,
        categoryId,
        progress,
        tasks,
      };

      if (company.status === '新規') {
        newCompanies.push(companyData);
      } else {
        updatedCompanies.push(companyData);
      }
    }

    // 4. サマリー計算
    const summary: Summary = {
      totalNew: newCompanies.length,
      completedNew: newCompanies.filter(c => c.progress === 100).length,
      totalUpdated: updatedCompanies.length,
      completedUpdated: updatedCompanies.filter(c => c.progress === 100).length,
    };

    console.log(`✅ 新規企業: ${summary.totalNew}社 (完了: ${summary.completedNew}社)`);
    console.log(`✅ 変更企業: ${summary.totalUpdated}社 (完了: ${summary.completedUpdated}社)`);

    return NextResponse.json({
      success: true,
      issue,
      newCompanies,
      updatedCompanies,
      summary,
    });

  } catch (error: any) {
    console.error('企業別ページ制作進捗取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error.message || '取得に失敗しました' },
      { status: 500 }
    );
  }
}
