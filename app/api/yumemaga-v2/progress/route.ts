import { NextResponse } from 'next/server';
import { getBatchSheetData, getSheetData } from '@/lib/google-sheets';
import { ensureDirectoryWithOAuth, listFilesInFolderWithOAuth } from '@/lib/google-drive';

/**
 * カテゴリ別進捗データ取得 (V2対応)
 *
 * V2の変更点:
 * - 進捗入力シート_V2（横持ち構造）から該当月号の1行のみ読み込み
 * - 新工程マスター_V2から工程定義を取得
 * - API負荷: 約58倍削減（10,000セル → 173セル）
 */
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

    // 1. バッチで必要なシートを一括取得
    const ganttSheetName = `逆算配置_ガント_${issue}`;
    const [ganttData, processMasterData, categoryMasterData, progressSheetData] = await getBatchSheetData(
      spreadsheetId,
      [
        `${ganttSheetName}!A1:ZZ1000`,
        '新工程マスター_V2!A1:F200',
        'カテゴリマスター!A1:J100',
        '進捗入力シート_V2!A1:GV100',
      ]
    );

    if (ganttData.length === 0) {
      return NextResponse.json(
        { success: false, error: `ガントシート「${ganttSheetName}」が見つかりません` },
        { status: 404 }
      );
    }

    // 2. ガントシートから各工程の予定日を抽出
    const headers = ganttData[0];
    const dateHeaders = headers.slice(3); // A,B,C列をスキップ

    const processSchedule: Record<string, string> = {};
    const nextMonthProcessNos = new Set<string>();

    ganttData.slice(1).forEach(row => {
      const processName = row[0];
      const layer = row[1];
      if (!processName) return;

      const match = processName.match(/^([A-Z]-\d+)/);
      if (!match) return;

      const processNo = match[1];

      // 次月号工程を記録
      if (layer === '次月号') {
        nextMonthProcessNos.add(processNo);
        return;
      }

      // 最初の予定日を取得
      for (let i = 0; i < dateHeaders.length; i++) {
        if (row[i + 3]) {
          processSchedule[processNo] = dateHeaders[i];
          break;
        }
      }
    });

    console.log(`📅 ガントシート: ${Object.keys(processSchedule).length}工程のスケジュールを取得`);

    // 3. 新工程マスター_V2から工程定義を取得
    if (processMasterData.length === 0) {
      return NextResponse.json(
        { success: false, error: '新工程マスター_V2が見つかりません' },
        { status: 404 }
      );
    }

    const processMaster: Record<string, { processName: string; phase: string; dataType: string; order: number }> = {};
    processMasterData.slice(1).forEach(row => {
      const processNo = row[1]; // B列: 工程No
      const processName = row[2]; // C列: 工程名
      const phase = row[3]; // D列: フェーズ
      const order = row[4]; // E列: 順序
      const dataType = row[5]; // F列: データ型

      if (processNo) {
        processMaster[processNo] = { processName, phase, dataType, order };
      }
    });

    console.log(`📋 新工程マスター_V2: ${Object.keys(processMaster).length}工程を取得`);

    // 4. カテゴリマスターから動的にカテゴリを取得
    const categories: Record<string, any[]> = {};
    const categoryMetadata: Record<string, { driveFolderId: string; requiredData: string[] }> = {};

    categoryMasterData.slice(1).forEach(row => {
      const categoryId = row[0];
      const requiredDataStr = row[4] || '';
      const status = row[8];
      const driveFolderId = row[9];

      if (categoryId && status === 'active') {
        categories[categoryId] = [];
        categoryMetadata[categoryId] = {
          driveFolderId: driveFolderId || '',
          requiredData: requiredDataStr.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0),
        };
      }
    });

    // 5. 進捗入力シート_V2から該当月号の行を取得
    if (progressSheetData.length === 0) {
      return NextResponse.json(
        { success: false, error: '進捗入力シート_V2が見つかりません' },
        { status: 404 }
      );
    }

    const progressHeaders = progressSheetData[0];
    const progressRow = progressSheetData.slice(1).find(row => row[0] === issue);

    if (!progressRow) {
      console.log(`⚠️  月号 ${issue} の進捗データが見つかりません。空データで返します。`);
    }

    // 6. 工程データを構築（横持ち構造から抽出）
    // ヘッダー行から工程Noと予定/実績を抽出
    // 例: "S-1予定", "S-1実績", "S-2予定", "S-2実績", ...
    const headerMap: Record<string, { plannedCol: number; actualCol: number }> = {};

    for (let col = 1; col < progressHeaders.length; col++) {
      const header = progressHeaders[col];
      if (!header) continue;

      // "A-1予定" or "A-1実績" or "A-1実績(JSON)"
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

    console.log(`📊 進捗入力シート_V2: ${Object.keys(headerMap).length}工程の列マッピングを作成`);

    // 7. 内部チェック・確認送付工程は確認ステータス取得のために別管理
    const confirmationProcesses: Record<string, { internalCheck?: any; confirmation?: any }> = {};

    // 8. カテゴリ別に工程データを構築
    Object.keys(processMaster).forEach(processNo => {
      const master = processMaster[processNo];
      const categoryId = processNo.split('-')[0];

      // 次月号工程を除外
      if (nextMonthProcessNos.has(processNo)) return;

      // カテゴリが存在しない場合はスキップ
      if (!categories[categoryId]) return;

      const cols = headerMap[processNo];
      if (!cols) return;

      const plannedDate = processSchedule[processNo] || (progressRow ? progressRow[cols.plannedCol] : '') || '-';
      const actualDate = progressRow ? (progressRow[cols.actualCol] || '') : '';

      // 確認送付工程はJSON管理
      let confirmationStatus = '-';
      if (master.dataType === 'JSON') {
        // 確認送付工程の場合、JSONをパース
        if (actualDate && typeof actualDate === 'string' && actualDate.trim().startsWith('{')) {
          try {
            const confirmationData = JSON.parse(actualDate);
            // finalVersionがあればステータスを判定
            if (confirmationData.finalVersion) {
              confirmationStatus = '確認OK';
            } else if (confirmationData.drafts && confirmationData.drafts.length > 0) {
              const latestDraft = confirmationData.drafts[confirmationData.drafts.length - 1];
              if (latestDraft.status === '修正') {
                confirmationStatus = '確認待ち';
              } else {
                confirmationStatus = '確認送付';
              }
            } else {
              confirmationStatus = '未送付';
            }
          } catch (error) {
            console.error(`JSON解析エラー (${processNo}):`, error);
            confirmationStatus = '-';
          }
        } else {
          confirmationStatus = '制作中';
        }

        // 確認送付工程を別管理に記録
        if (!confirmationProcesses[categoryId]) {
          confirmationProcesses[categoryId] = {};
        }

        if (master.processName.includes('内部チェック')) {
          confirmationProcesses[categoryId].internalCheck = {
            confirmationStatus,
            rowIndex: -1, // V2では行番号は不要
          };
        } else if (master.processName.includes('確認送付')) {
          confirmationProcesses[categoryId].confirmation = {
            confirmationStatus,
            rowIndex: -1,
          };
        }

        // 確認送付工程はカテゴリリストには含めない（V1と同じ挙動）
        return;
      }

      // 内部チェック工程も別管理
      if (master.processName.includes('内部チェック')) {
        if (!confirmationProcesses[categoryId]) {
          confirmationProcesses[categoryId] = {};
        }
        confirmationProcesses[categoryId].internalCheck = {
          confirmationStatus: actualDate ? '内部チェック' : '制作中',
          rowIndex: -1,
        };
        return;
      }

      // 通常工程をカテゴリリストに追加
      categories[categoryId].push({
        processNo,
        processName: master.processName,
        plannedDate,
        actualDate,
        confirmationStatus: '-',
        rowIndex: -1, // V2では行番号は不要（列インデックスで管理）
      });
    });

    // 9. Google Driveファイルチェックによる自動実施日設定
    const issueFormatted = issue.replace(/(\d{4})年(\d{1,2})月号/, (_, year, month) => {
      const paddedMonth = month.padStart(2, '0');
      return `${year}_${paddedMonth}`;
    });

    console.log(`🔍 Google Driveファイルチェック開始 (${Object.keys(categories).length}カテゴリ)`);

    for (const cat of Object.keys(categories)) {
      const metadata = categoryMetadata[cat];
      if (!metadata || !metadata.driveFolderId) {
        console.log(`⏭️  カテゴリ${cat}: メタデータまたはDriveフォルダIDなし`);
        continue;
      }

      const processes = categories[cat];

      // データ提出・撮影工程を探す
      const dataSubmissionProcess = processes.find((p: any) =>
        p.processName.includes('データ提出') ||
        p.processName.includes('撮影') ||
        p.processName.includes('原稿提出')
      );

      // データ提出工程が見つからない、または既に実施日が入力されている場合はスキップ
      if (!dataSubmissionProcess) {
        console.log(`⏭️  カテゴリ${cat}: データ提出工程が見つかりません`);
        continue;
      }

      if (dataSubmissionProcess.actualDate) {
        console.log(`⏭️  カテゴリ${cat}: 実施日が既に入力されています (${dataSubmissionProcess.actualDate})`);
        continue;
      }

      // 録音データフォルダをチェック
      try {
        const recordingFolderId = await ensureDirectoryWithOAuth(metadata.driveFolderId, ['録音データ', issueFormatted]);
        const files = await listFilesInFolderWithOAuth(recordingFolderId);

        const mp3Files = files.filter(file =>
          file.mimeType === 'audio/mpeg' ||
          file.name?.toLowerCase().endsWith('.mp3')
        );

        if (mp3Files.length > 0) {
          // ファイルが存在する場合、最新ファイルのmodifiedTimeを実施日として設定
          const latestFile = mp3Files.reduce((latest, file) => {
            const fileTime = new Date(file.modifiedTime || file.createdTime || 0);
            const latestTime = new Date(latest.modifiedTime || latest.createdTime || 0);
            return fileTime > latestTime ? file : latest;
          });

          const fileDate = new Date(latestFile.modifiedTime || latestFile.createdTime || '');
          const formattedDate = `${fileDate.getFullYear()}-${String(fileDate.getMonth() + 1).padStart(2, '0')}-${String(fileDate.getDate()).padStart(2, '0')}`;

          console.log(`✅ カテゴリ${cat}: ファイルが見つかりました。実施日を ${formattedDate} に設定`);
          dataSubmissionProcess.actualDate = formattedDate;
        } else {
          console.log(`⏭️  カテゴリ${cat}: ファイルが見つかりません`);
        }
      } catch (error) {
        console.error(`❌ カテゴリ${cat}: Driveチェックエラー:`, error);
      }
    }

    // 10. カテゴリ別の進捗率を計算
    const result = Object.keys(categories).map(cat => {
      const processes = categories[cat];
      const total = processes.length;
      const completed = processes.filter((p: any) => p.actualDate).length;
      const progressRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // カテゴリ別の確認送付ステータスを取得
      const confirmationData = confirmationProcesses[cat];
      const confirmationProcess = confirmationData?.confirmation || confirmationData?.internalCheck;
      const categoryConfirmationStatus = confirmationProcess?.confirmationStatus || '制作中';

      console.log(`📋 カテゴリ${cat}: ${completed}/${total}工程完了 (${progressRate}%), ステータス: ${categoryConfirmationStatus}`);

      return {
        categoryId: cat,
        progress: progressRate,
        completed,
        total,
        confirmationStatus: categoryConfirmationStatus,
        processes,
      };
    });

    return NextResponse.json({
      success: true,
      issue,
      categories: result,
    });

  } catch (error: any) {
    console.error('進捗データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '進捗データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}
