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
    const [companyData, categoryData, progressDataV2, processMasterData] = await getBatchSheetData(
      spreadsheetId,
      [
        '企業マスター!A2:AZ100',
        'カテゴリマスター!A2:J100',
        '進捗入力シート_V2!A1:GV100',
        '新工程マスター_V2!A1:F200',
      ]
    );

    // V2のヘッダー行から列マッピングを作成
    const progressHeaders = progressDataV2[0];
    const headerMap: Record<string, { plannedCol: number; actualCol: number }> = {};

    for (let col = 1; col < progressHeaders.length; col++) {
      const header = progressHeaders[col];
      if (!header) continue;

      const match = header.match(/^([A-Z]-\d+)(予定|実績.*)/);
      if (match) {
        const processNo = match[1];
        const type = match[2];

        if (!headerMap[processNo]) {
          headerMap[processNo] = { plannedCol: -1, actualCol: -1 };
        }

        if (type === '予定') {
          headerMap[processNo].plannedCol = col;
        } else if (type.startsWith('実績')) {
          headerMap[processNo].actualCol = col;
        }
      }
    }

    // 該当月号の行を取得
    const progressRow = progressDataV2.slice(1).find(row => row[0] === issue);

    // 工程マスターから工程情報を取得
    const processMasterMap: Record<string, { processName: string; phase: string }> = {};
    processMasterData.slice(1).forEach(row => {
      const processNo = row[1]; // B列: 工程No
      const processName = row[2]; // C列: 工程名
      const phase = row[3]; // D列: フェーズ

      if (processNo) {
        processMasterMap[processNo] = { processName, phase };
      }
    });

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

    // 3. 各企業の制作工程を取得
    const newCompanies: CompanyProduction[] = [];
    const updatedCompanies: CompanyProduction[] = [];

    for (const company of currentIssueCompanies) {
      const categoryId = company.status === '新規' ? 'C' : 'E';

      // 企業マスター51列の進捗計算
      const masterProgress = calculateCompanyMasterProgress(company.rawRow);

      // 該当カテゴリの工程を取得（V2: 工程マスターからフィルタリング）
      const companyProcesses = Object.keys(processMasterMap)
        .filter(processNo => {
          const processCategory = processNo.split('-')[0];
          return processCategory === categoryId;
        })
        .map(processNo => {
          const master = processMasterMap[processNo];
          const cols = headerMap[processNo];

          // 予定日と実績日を進捗入力シート_V2から取得
          let plannedDate = '-';
          let actualDate = '';

          if (progressRow && cols) {
            if (cols.plannedCol >= 0) {
              plannedDate = progressRow[cols.plannedCol] || '-';
            }
            if (cols.actualCol >= 0) {
              actualDate = progressRow[cols.actualCol] || '';
            }
          }

          return {
            processNo,
            processName: master.processName,
            plannedDate,
            actualDate,
          };
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

      // 工程を取得するヘルパー関数
      const getProcess = (processNo: string) => {
        return companyProcesses.find(p => p.processNo === processNo);
      };

      // 工程データを詳細形式に変換するヘルパー関数
      const createProcessDetail = (process: any) => {
        if (!process) return null;

        return {
          type: 'process' as const,
          processNo: process.processNo,
          name: process.processName,
          plannedDate: process.plannedDate || '-',
          actualDate: process.actualDate || '',
          completed: !!process.actualDate,
        };
      };

      // === 企業別ページ制作進捗用（既存のまま維持） ===

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

      // タスク2: 写真取得
      const photoFolders: CompanyFolderType[] = ['ロゴ', 'ヒーロー画像', 'QRコード', '代表者写真', 'サービス画像', '社員写真', 'その他'];
      const photoDetails: TaskDetail[] = photoFolders.map(folder => {
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

      // === 準備セクション（次月号事前準備用） ===

      // タスク1: 契約企業確認 (C-1/E-1)
      const process1 = getProcess(`${categoryId}-1`);
      if (process1) {
        const detail = createProcessDetail(process1);
        tasks.push({
          taskId: 'preparation-contract-check',
          taskName: '契約企業確認',
          progress: detail?.completed ? 100 : 0,
          details: detail ? [detail] : [],
        });
      }

      // タスク2: 情報入力フォーム送付 (C-2/E-2)
      const process2 = getProcess(`${categoryId}-2`);
      if (process2) {
        const detail = createProcessDetail(process2);
        tasks.push({
          taskId: 'preparation-form-send',
          taskName: '情報入力フォーム送付',
          progress: detail?.completed ? 100 : 0,
          details: detail ? [detail] : [],
        });
      }

      // タスク3: データ提出 (C-3/E-3)
      const process3 = getProcess(`${categoryId}-3`);
      if (process3) {
        const detail = createProcessDetail(process3);
        tasks.push({
          taskId: 'preparation-data-submission',
          taskName: 'データ提出',
          progress: detail?.completed ? 100 : 0,
          details: detail ? [detail] : [],
        });
      }

      // === 制作セクション ===

      // タスク4: ページ制作 (C-4/E-4)
      const process4 = getProcess(`${categoryId}-4`);
      if (process4) {
        const detail = createProcessDetail(process4);
        tasks.push({
          taskId: 'production-page',
          taskName: 'ページ制作',
          progress: detail?.completed ? 100 : 0,
          details: detail ? [detail] : [],
        });
      }

      // === 全体進捗セクション ===

      // タスク5: 内部チェック (C-5/E-5)
      const process5 = getProcess(`${categoryId}-5`);
      if (process5) {
        const detail = createProcessDetail(process5);
        tasks.push({
          taskId: 'overall-internal-check',
          taskName: '内部チェック',
          progress: detail?.completed ? 100 : 0,
          details: detail ? [detail] : [],
        });
      }

      // タスク6: 確認送付/修正 (C-6/E-6)
      const process6 = getProcess(`${categoryId}-6`);
      if (process6) {
        const detail = createProcessDetail(process6);
        tasks.push({
          taskId: 'overall-confirmation',
          taskName: '確認送付/修正',
          progress: detail?.completed ? 100 : 0,
          details: detail ? [detail] : [],
        });
      }

      // 全体進捗: 全タスクの平均
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
