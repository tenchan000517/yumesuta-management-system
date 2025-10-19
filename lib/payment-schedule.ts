// lib/payment-schedule.ts
// 支払予定日の自動計算ロジック

import { getSheetData } from '@/lib/google-sheets';
import type { Expenditure, PaymentSetting } from '@/types/financial';

/**
 * 支払予定日を自動計算
 * @param expenditure - 支出データ
 * @returns 計算された支払予定日（YYYY/MM/DD形式）、または null
 */
export async function calculatePaymentScheduledDate(
  expenditure: Omit<Expenditure, 'id'>
): Promise<string | null> {
  const { paymentMethod, reimbursedPerson, date } = expenditure;

  // 発生日をDateオブジェクトに変換
  const occurrenceDate = new Date(date);
  if (isNaN(occurrenceDate.getTime())) {
    return null; // 無効な日付の場合はnull
  }

  // 1. 立替の場合
  if (paymentMethod === 'reimbursement') {
    // 企業立替判定：立替者名に「株式会社」が含まれる
    if (reimbursedPerson && reimbursedPerson.includes('株式会社')) {
      // 企業立替：月末締め翌月27日
      return calculateCorporateReimbursementDate(occurrenceDate);
    } else {
      // 個人立替：清算時に確定（null）
      return null;
    }
  }

  // 2. その他の支払方法：支払設定マスタから取得
  return await calculateFromPaymentSettings(paymentMethod, occurrenceDate);
}

/**
 * 企業立替の支払予定日を計算（月末締め翌月27日）
 * @param occurrenceDate - 発生日
 * @returns 支払予定日（YYYY/MM/DD形式）
 */
function calculateCorporateReimbursementDate(occurrenceDate: Date): string {
  // 発生月の翌月27日
  const paymentDate = new Date(occurrenceDate);
  paymentDate.setMonth(paymentDate.getMonth() + 1); // 翌月
  paymentDate.setDate(27); // 27日

  return formatDate(paymentDate);
}

/**
 * 支払設定マスタから支払予定日を計算
 * @param paymentMethod - 支払方法
 * @param occurrenceDate - 発生日
 * @returns 支払予定日（YYYY/MM/DD形式）、または null
 */
async function calculateFromPaymentSettings(
  paymentMethod: Expenditure['paymentMethod'],
  occurrenceDate: Date
): Promise<string | null> {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID!;
    const data = await getSheetData(spreadsheetId, '支払設定マスタ!A:D');

    // ヘッダー行を除く
    const rows = data.slice(1);

    // 支払方法の日本語表記に変換
    const paymentMethodJa = convertPaymentMethodToJapanese(paymentMethod);

    // 該当する支払方法のルールを検索
    const setting = rows.find(row => row[0] === paymentMethodJa);

    if (!setting) {
      // ルールが見つからない場合は即日
      return formatDate(occurrenceDate);
    }

    const paymentTiming = setting[1]; // B列: 支払日タイミング
    const withdrawalDay = setting[2]; // C列: 引き落とし日

    // 支払タイミングに応じて計算
    if (paymentTiming === '即日') {
      return formatDate(occurrenceDate);
    } else if (paymentTiming && paymentTiming.includes('翌月')) {
      // 翌月XX日
      if (withdrawalDay && !isNaN(parseInt(withdrawalDay))) {
        const day = parseInt(withdrawalDay);
        const paymentDate = new Date(occurrenceDate);
        paymentDate.setMonth(paymentDate.getMonth() + 1); // 翌月
        paymentDate.setDate(day);
        return formatDate(paymentDate);
      }
    } else if (paymentTiming === '個別設定') {
      // 請求書払いなど、個別に設定する場合はnull
      return null;
    }

    // デフォルトは即日
    return formatDate(occurrenceDate);
  } catch (error) {
    console.error('支払設定マスタ取得エラー:', error);
    // エラー時は即日を返す
    return formatDate(occurrenceDate);
  }
}

/**
 * 支払方法の英語 → 日本語変換
 */
function convertPaymentMethodToJapanese(method: Expenditure['paymentMethod']): string {
  switch (method) {
    case 'company_card':
      return '会社カード';
    case 'reimbursement':
      return '立替';
    case 'bank_transfer':
      return '銀行振込';
    case 'cash':
      return '現金';
    case 'invoice':
      return '請求書払い';
    default:
      return '現金';
  }
}

/**
 * Date → YYYY/MM/DD形式に変換
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
}
