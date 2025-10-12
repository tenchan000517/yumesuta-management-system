import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { ReminderCard } from '@/types/workflow';
import { google } from 'googleapis';
import { normalizeCompanyName } from '@/lib/normalize-company-name';
import { generateNextContractId } from '@/lib/generate-contract-id';
import { getOrCreateCompanyId } from '@/lib/company-master-utils';

// ステップ番号とタイトルのマッピング
const STEP_TITLES: Record<number, string> = {
  1: '情報収集',
  2: '基本契約書作成',
  3: '基本契約書の押印・送信',
  4: '申込書兼個別契約書作成',
  5: '申込書の押印・送信',
  6: '重要事項説明（推奨・任意）',
  7: '契約完了確認',
  8: '請求書作成・送付',
  9: '入金確認',
  10: '入金管理シート更新',
  11: '入金確認連絡・原稿依頼',
  12: '制作・校正',
  13: '掲載'
};

export async function GET() {
  try {
    // 1. 顧客マスタから「受注」ステータスの企業を取得
    const customerMaster = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '顧客マスタ!A:S'
    );

    const receivedOrders = customerMaster
      .slice(2) // タイトル行（1行目）とヘッダー行（2行目）をスキップ
      .filter(row => row[18] === '受注') // S列（インデックス18）
      .map(row => ({
        companyName: row[1] // B列（インデックス1）
      }));

    // 2. 契約・入金管理シートから全契約を取得
    const contractSheet = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約・入金管理!A:AD'
    );

    const reminders: ReminderCard[] = [];

    // 3. 新規契約必要チェック（初回のみ、自動作成あり）
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;

    for (const order of receivedOrders) {
      // 企業マスタで企業IDを取得（または新規作成）
      const companyId = await getOrCreateCompanyId(sheets, spreadsheetId, order.companyName);

      // 契約・入金管理シートにこの企業IDの契約が存在するか
      const hasExistingContract = contractSheet
        .slice(2)
        .some(row => parseInt(row[1]) === companyId); // B列: 企業ID

      if (!hasExistingContract) {
        // 初回契約のみ自動作成
        const contractId = await generateNextContractId(spreadsheetId);

        const newRow = [
          contractId,                     // A: 契約ID
          companyId,                      // B: 企業ID
          order.companyName,              // C: 企業名
          '', '', '', '', '', '', '', '', '', '', '', '', '', // D〜Q列: 空欄
          '', '', '', '', '', '', '', '', '', '', '', '', ''  // R〜AD列: 空欄
        ];

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: '契約・入金管理!A:AD',
          valueInputOption: 'USER_ENTERED',
          requestBody: {
            values: [newRow]
          }
        });

        // リマインダーカードを表示
        reminders.push({
          type: 'new-contract-required',
          companyName: order.companyName,
          contractId,
          priority: 'high'
        });
      }

      // 既に契約が存在する場合は何もしない（2件目以降は手動登録）
    }

    // 4. 既存契約の進捗チェック
    for (let i = 2; i < contractSheet.length; i++) { // タイトル行とヘッダー行をスキップ
      const row = contractSheet[i];

      // 空行をスキップ
      if (!row[0] || !row[2]) continue; // A列（契約ID）とC列（企業名）をチェック

      const contractId = parseInt(row[0]); // A列
      const companyName = row[2]; // C列（企業名）
      const paymentStatus = row[13]; // N列（入金ステータス）
      const paymentDueDate = row[11]; // L列（入金予定日）
      const publicationIssue = row[15]; // P列（掲載開始号）

      // 進捗列（R〜AD列 = インデックス17〜29）
      const stepCompletions = row.slice(17, 30);
      const completedSteps = stepCompletions.filter(d => d && d !== '').length;

      // 次に進むべきステップを計算
      let nextStep = 1;
      for (let step = 1; step <= 13; step++) {
        if (!stepCompletions[step - 1] || stepCompletions[step - 1] === '') {
          nextStep = step;
          break;
        }
      }

      // 4-1. 進行中チェック（13ステップ未完了）
      if (completedSteps < 13) {
        // ステップ⑧（請求書作成・送付）完了後のみ入金チェックを行う
        const step8Completed = stepCompletions[7] && stepCompletions[7] !== ''; // インデックス7 = ステップ⑧

        if (step8Completed && paymentStatus === '未入金') {
          // ステップ⑧完了 & 未入金の場合
          if (paymentDueDate) {
            const dueDate = new Date(paymentDueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dueDate.setHours(0, 0, 0, 0);

            if (dueDate < today) {
              // 入金遅延
              const delayDays = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              reminders.push({
                type: 'payment-overdue',
                companyName,
                contractId,
                paymentDueDate,
                delayDays,
                priority: 'high',
                completedSteps,
                totalSteps: 13,
                nextStep: 9, // ステップ⑨: 入金確認
                nextStepTitle: STEP_TITLES[9]
              });
              continue;
            } else {
              // 入金待ち
              reminders.push({
                type: 'payment-pending',
                companyName,
                contractId,
                paymentDueDate,
                priority: 'medium',
                completedSteps,
                totalSteps: 13,
                nextStep: 9, // ステップ⑨: 入金確認
                nextStepTitle: STEP_TITLES[9]
              });
              continue;
            }
          } else {
            // 入金予定日未設定だが請求書発行済
            reminders.push({
              type: 'payment-pending',
              companyName,
              contractId,
              priority: 'medium',
              completedSteps,
              totalSteps: 13,
              nextStep: 9, // ステップ⑨: 入金確認
              nextStepTitle: STEP_TITLES[9]
            });
            continue;
          }
        }

        // 通常の進行中カード
        reminders.push({
          type: 'in-progress',
          companyName,
          contractId,
          completedSteps,
          totalSteps: 13,
          nextStep,
          nextStepTitle: STEP_TITLES[nextStep],
          priority: 'low'
        });
        continue;
      }

      // 4-2. 完了チェック（13ステップ完了 & 入金済）
      if (completedSteps === 13 && paymentStatus === '入金済') {
        // 契約満了日を計算（契約日 + 1年）
        const contractEndDate = calculateContractEndDateFromContractDate(row[4]); // E列 = 契約日
        const daysUntilExpiry = calculateDaysUntil(contractEndDate);

        // 60日以内なら「契約満了近い」
        if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
          reminders.push({
            type: 'contract-expiry-near',
            companyName,
            contractId,
            contractEndDate,
            daysUntilExpiry,
            priority: 'medium'
          });
        } else {
          // それ以外は完了カード（フィルタで非表示）
          reminders.push({
            type: 'completed',
            companyName,
            contractId,
            contractEndDate,
            priority: 'low'
          });
        }
      }
    }

    // 優先度順にソート
    reminders.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return NextResponse.json({
      success: true,
      reminders
    });

  } catch (error) {
    console.error('リマインダー取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function calculateContractEndDateFromContractDate(contractDate: string): string {
  // 例: "2024/10/12" → "2025/10/12"
  if (!contractDate) return '';

  const date = new Date(contractDate);
  date.setFullYear(date.getFullYear() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}

function calculateDaysUntil(dateString: string): number {
  const targetDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  return Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
