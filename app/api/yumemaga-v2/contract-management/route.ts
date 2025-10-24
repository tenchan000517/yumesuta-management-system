import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type {
  ContractRecord,
  NewCompany,
  RenewalReminder,
  ContractManagementData,
} from '@/types/contract';

/**
 * 掲載開始号から年月を抽出
 * 例: "2025年12月号" → { year: 2025, month: 12 }
 */
function parseIssueDate(掲載開始号: string): { year: number; month: number } | null {
  if (!掲載開始号 || typeof 掲載開始号 !== 'string') return null;
  const match = 掲載開始号.match(/(\d{4})年(\d{1,2})月号/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
  };
}

/**
 * 契約終了日を計算
 */
function calculateContractEnd(契約開始日: string, 契約期間: number): Date | null {
  if (!契約開始日 || typeof 契約開始日 !== 'string') return null;
  try {
    const startDate = new Date(契約開始日);
    if (isNaN(startDate.getTime())) return null;

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 契約期間);
    return endDate;
  } catch {
    return null;
  }
}

/**
 * 契約終了までの日数を計算
 */
function getDaysUntilEnd(契約終了日: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  契約終了日.setHours(0, 0, 0, 0);

  const diffTime = 契約終了日.getTime() - today.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 契約更新リマインドが必要かチェック
 */
function needsRenewalReminder(
  契約終了日: Date,
  自動更新有無: string
): boolean {
  const daysUntilEnd = getDaysUntilEnd(契約終了日);

  // 自動更新なしの場合、終了90日前～終了日までリマインド
  if (自動更新有無 === '✖' && daysUntilEnd <= 90 && daysUntilEnd >= 0) {
    return true;
  }

  // 自動更新ありの場合、終了30日前～終了日までリマインド
  if (自動更新有無 === '〇' && daysUntilEnd <= 30 && daysUntilEnd >= 0) {
    return true;
  }

  return false;
}

/**
 * メール文を自動生成
 */
function generateMailTemplate(
  企業名: string,
  契約サービス: string,
  契約開始日: string,
  契約期間: number,
  契約終了日: Date,
  自動更新有無: string,
  自動更新後の金額?: string
): string {
  const 契約終了日文字列 = 契約終了日.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).replace(/\//g, '/');

  if (自動更新有無 === '✖') {
    // 自動更新なしの企業向け
    return `件名: 【${契約サービス}】契約期間終了のご案内（${企業名}様）

${企業名} ご担当者様

いつもお世話になっております。
株式会社ゆめスタでございます。

貴社とのご契約について、以下の通り契約期間が終了いたします。

■ 契約情報
契約サービス: ${契約サービス}
契約開始日: ${契約開始日}
契約期間: ${契約期間}ヶ月
契約終了日: ${契約終了日文字列}

つきましては、契約継続のご意向をお伺いしたく、ご連絡させていただきました。

引き続きご契約いただける場合は、お手数ですがご返信いただけますと幸いです。

ご不明な点がございましたら、お気軽にお問い合わせください。

何卒よろしくお願い申し上げます。`;
  } else {
    // 自動更新ありの企業向け
    const 次回契約開始日 = new Date(契約終了日);
    次回契約開始日.setDate(次回契約開始日.getDate() + 1);
    const 次回契約開始日文字列 = 次回契約開始日.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).replace(/\//g, '/');

    const 解約期限日 = new Date(契約終了日);
    解約期限日.setDate(解約期限日.getDate() - 30);
    const 解約期限日文字列 = 解約期限日.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).replace(/\//g, '/');

    return `件名: 【${契約サービス}】契約自動更新のご案内（${企業名}様）

${企業名} ご担当者様

いつもお世話になっております。
株式会社ゆめスタでございます。

貴社とのご契約について、以下の通り自動更新が予定されております。

■ 契約情報
契約サービス: ${契約サービス}
現在の契約終了日: ${契約終了日文字列}
次回契約開始日: ${次回契約開始日文字列}
${自動更新後の金額 ? `更新後の金額: ${自動更新後の金額}/月` : ''}

自動更新を希望されない場合は、${解約期限日文字列}までにご連絡ください。

ご不明な点がございましたら、お気軽にお問い合わせください。

何卒よろしくお願い申し上げます。`;
  }
}

/**
 * 契約・入金管理データを取得
 */
export async function GET(request: Request) {
  try {
    const spreadsheetId = process.env.SALES_SPREADSHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'SALES_SPREADSHEET_ID not configured' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const targetYear = parseInt(searchParams.get('targetYear') || '', 10);
    const targetMonth = parseInt(searchParams.get('targetMonth') || '', 10);

    if (!targetYear || !targetMonth) {
      return NextResponse.json(
        { success: false, error: 'targetYear and targetMonth are required' },
        { status: 400 }
      );
    }

    // 契約・入金管理シートから全データを取得
    const sheetData = await getSheetData(
      spreadsheetId,
      '契約・入金管理!A1:Z1000'
    );

    if (!sheetData || sheetData.length < 2) {
      return NextResponse.json({
        success: true,
        data: {
          newCompanies: [],
          renewalReminders: [],
        },
      });
    }

    // ヘッダー行をスキップ（最初の2行はヘッダー）
    const dataRows = sheetData.slice(2);

    const newCompanies: NewCompany[] = [];
    const renewalReminders: RenewalReminder[] = [];

    for (const row of dataRows) {
      if (!row || row.length === 0 || !row[0]) continue; // 空行をスキップ

      const record: ContractRecord = {
        契約ID: row[0] || '',
        企業ID: row[1] || '',
        企業名: row[2] || '',
        契約サービス: row[3] || '',
        契約日: row[4] || '',
        契約金額: row[5] || '',
        入金方法: row[6] || '',
        契約書送付: row[7] || '',
        契約書回収: row[8] || '',
        申込書送付: row[9] || '',
        申込書回収: row[10] || '',
        入金予定日: row[11] || '',
        入金実績日: row[12] || '',
        入金ステータス: row[13] || '',
        遅延日数: row[14] || '',
        掲載開始号: row[15] || '',
        備考: row[16] || '',
        契約開始日: row[17] || '',
        契約期間: parseInt(row[18], 10) || 0,
        自動更新有無: row[19] || '',
        自動更新後の金額: row[20] || '',
        ステップ1完了日: row[21] || '',
        ステップ2完了日: row[22] || '',
        ステップ3完了日: row[23] || '',
        ステップ4完了日: row[24] || '',
        ステップ5完了日: row[25] || '',
      };

      // 1. 新規企業判定（掲載開始号が該当月と一致）
      if (record.掲載開始号) {
        const issueDate = parseIssueDate(record.掲載開始号);
        if (
          issueDate &&
          issueDate.year === targetYear &&
          issueDate.month === targetMonth
        ) {
          newCompanies.push({
            契約ID: record.契約ID,
            企業名: record.企業名,
            契約サービス: record.契約サービス,
            掲載開始号: record.掲載開始号,
            契約金額: record.契約金額,
            契約開始日: record.契約開始日,
          });
        }
      }

      // 2. 契約更新リマインド判定
      if (record.契約開始日 && record.契約期間 > 0) {
        const 契約終了日 = calculateContractEnd(
          record.契約開始日,
          record.契約期間
        );

        if (契約終了日 && needsRenewalReminder(契約終了日, record.自動更新有無)) {
          const daysUntilEnd = getDaysUntilEnd(契約終了日);
          const mailTemplate = generateMailTemplate(
            record.企業名,
            record.契約サービス,
            record.契約開始日,
            record.契約期間,
            契約終了日,
            record.自動更新有無,
            record.自動更新後の金額
          );

          renewalReminders.push({
            契約ID: record.契約ID,
            企業名: record.企業名,
            契約サービス: record.契約サービス,
            契約開始日: record.契約開始日,
            契約終了日: 契約終了日.toISOString().split('T')[0],
            daysUntilEnd,
            自動更新有無: record.自動更新有無,
            自動更新後の金額: record.自動更新後の金額,
            mailTemplate,
          });
        }
      }
    }

    // 契約終了が近い順にソート
    renewalReminders.sort((a, b) => a.daysUntilEnd - b.daysUntilEnd);

    const result: ContractManagementData = {
      newCompanies,
      renewalReminders,
    };

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Contract management API error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
