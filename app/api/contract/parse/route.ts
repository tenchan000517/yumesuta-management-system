import { NextResponse } from 'next/server';
import type { ParsedContractForm } from '@/types/workflow';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    const errors: string[] = [];

    // 正規表現で各フィールドを抽出
    const parsed: ParsedContractForm = {
      companyName: extractField(rawText, /企業名・団体名:\s*(.+)/, errors, '企業名'),
      representativeTitle: extractField(rawText, /代表者役職:\s*(.+)/, errors, '代表者役職'),
      representativeName: extractField(rawText, /代表者名:\s*(.+)/, errors, '代表者名'),
      address: extractField(rawText, /住所:〒?\s*(.+)/, errors, '住所'),
      phone: extractField(rawText, /電話番号:\s*(.+)/, errors, '電話番号'),
      email: extractField(rawText, /メールアドレス:\s*(.+)/, errors, 'メールアドレス'),
      contactPerson: extractField(rawText, /送信先担当者名:\s*(.+)/, errors, '送信先担当者名'),
      contactEmail: extractField(rawText, /送信先メールアドレス:\s*(.+)/, errors, '送信先メールアドレス'),
      contractDate: parseWarekiDate(rawText, /契約締結日:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/, errors, '契約締結日'),
      annualFee: parseNumber(rawText, /契約料金（税別）:\s*([0-9,]+)\s*円\/年/, errors, '契約料金'),
      monthlyFee: parseNumber(rawText, /自動更新後の月額料金（税別）:\s*([0-9,]+)\s*円\/月/, errors, '月額料金'),
      publicationStart: extractField(rawText, /掲載開始:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月号/, errors, '掲載開始', (match) => {
        const reiwaYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = 2018 + reiwaYear; // 令和元年 = 2019年
        return `${year}年${month}月号`;
      }),
      publicationEnd: extractField(rawText, /掲載終了:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月号/, errors, '掲載終了', (match) => {
        const reiwaYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = 2018 + reiwaYear;
        return `${year}年${month}月号`;
      }),
      adSize: extractField(rawText, /掲載サイズ:\s*(.+)/, errors, '掲載サイズ'),
      adPosition: extractField(rawText, /掲載位置:\s*(.+)/, errors, '掲載位置'),
      designFormat: extractField(rawText, /デザイン形式:\s*(.+)/, errors, 'デザイン形式'),
      sendBasicContract: /基本契約書の送付:.*?[☑✓]\s*有/.test(rawText),
      sendApplication: /申込書の送付:.*?[☑✓]\s*有/.test(rawText),
      paymentDeadline: parseWarekiDate(rawText, /支払期限:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/, errors, '支払期限')
    };

    return NextResponse.json({
      success: errors.length === 0,
      parsed,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}

// ヘルパー関数
function extractField(
  text: string,
  pattern: RegExp,
  errors: string[],
  fieldName: string,
  transform?: (match: RegExpMatchArray) => string
): string {
  const match = text.match(pattern);
  if (!match) {
    errors.push(`${fieldName}が見つかりません`);
    return '';
  }
  return transform ? transform(match) : match[1].trim();
}

function parseNumber(
  text: string,
  pattern: RegExp,
  errors: string[],
  fieldName: string
): number {
  const match = text.match(pattern);
  if (!match) {
    errors.push(`${fieldName}が見つかりません`);
    return 0;
  }
  return parseInt(match[1].replace(/,/g, ''));
}

function parseWarekiDate(
  text: string,
  pattern: RegExp,
  errors: string[],
  fieldName: string
): string {
  const match = text.match(pattern);
  if (!match) {
    errors.push(`${fieldName}が見つかりません`);
    return '';
  }

  const reiwaYear = parseInt(match[1]);
  const month = parseInt(match[2]);
  const day = parseInt(match[3]);
  const year = 2018 + reiwaYear; // 令和元年 = 2019年

  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}
