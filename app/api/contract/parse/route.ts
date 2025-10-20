import { NextResponse } from 'next/server';
import type { ParsedContractForm } from '@/types/workflow';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    const errors: string[] = [];

    // 正規表現で各フィールドを抽出
    const parsed: ParsedContractForm = {
      // 必須フィールド（全契約種別共通）
      companyName: extractField(rawText, /企業名(?:・団体名)?[：:\s]*(.+)/, errors, '企業名'),
      representativeTitle: extractField(rawText, /代表者役職:\s*(.+)/, errors, '代表者役職'),
      representativeName: extractField(rawText, /代表者名:\s*(.+)/, errors, '代表者名'),
      address: extractField(rawText, /住所:〒?\s*(.+)/, errors, '住所'),
      phone: extractField(rawText, /電話番号:\s*(.+)/, errors, '電話番号'),
      email: extractField(rawText, /メールアドレス:\s*(.+)/, errors, 'メールアドレス'),
      contactPerson: extractField(rawText, /送信先担当者名:\s*(.+)/, errors, '送信先担当者名'),
      contactEmail: extractField(rawText, /送信先メールアドレス:\s*(.+)/, errors, '送信先メールアドレス'),
      contractDate: parseWarekiDateOptional(rawText, /契約締結日:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/),
      annualFee: parseNumber(rawText, /契約料金（税別）:\s*([0-9,]+)\s*円\/年/, errors, '契約料金'),
      monthlyFee: parseNumberOptional(rawText, /自動更新後の月額料金（税別）:\s*([0-9,]+)\s*円\/月/),
      contractStartDate: parseWarekiDateOptional(rawText, /契約開始日:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月\s*(\d+)\s*日/),
      contractPeriodMonths: parseNumberOptional(rawText, /契約期間:\s*([0-9,]+)\s*ヶ月/),
      autoRenewal: /自動更新:.*?[☑✓]\s*有/.test(rawText),

      // 任意フィールド（ゆめマガ専用・エラーを追加しない）
      publicationStart: extractFieldOptional(rawText, /掲載開始:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月号/, (match) => {
        const reiwaYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = 2018 + reiwaYear; // 令和元年 = 2019年
        return `${year}年${month}月号`;
      }),
      publicationEnd: extractFieldOptional(rawText, /掲載終了:\s*令和\s*(\d+)\s*年\s*(\d+)\s*月号/, (match) => {
        const reiwaYear = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = 2018 + reiwaYear;
        return `${year}年${month}月号`;
      }),
      adSize: extractFieldOptional(rawText, /掲載サイズ:\s*(.+)/),
      adPosition: extractFieldOptional(rawText, /掲載位置:\s*(.+)/),
      designFormat: extractFieldOptional(rawText, /デザイン形式:\s*(.+)/),

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

// 任意フィールド用（エラーを追加しない）
function extractFieldOptional(
  text: string,
  pattern: RegExp,
  transform?: (match: RegExpMatchArray) => string
): string {
  const match = text.match(pattern);
  if (!match) {
    return '';  // エラーを追加せず空文字を返す
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

// 任意の数値フィールド用（エラーを追加しない）
function parseNumberOptional(
  text: string,
  pattern: RegExp
): number {
  const match = text.match(pattern);
  if (!match) {
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

// 任意の和暦日付フィールド用（エラーを追加しない）
function parseWarekiDateOptional(
  text: string,
  pattern: RegExp
): string {
  const match = text.match(pattern);
  if (!match) {
    return '';
  }

  const reiwaYear = parseInt(match[1]);
  const month = parseInt(match[2]);
  const day = parseInt(match[3]);
  const year = 2018 + reiwaYear; // 令和元年 = 2019年

  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}
