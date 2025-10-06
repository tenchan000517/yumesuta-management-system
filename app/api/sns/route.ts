import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type {
  SNSData,
  PostHistory,
  PostSchedule,
  SNSType,
  SNSAccount,
  PostStatus,
} from '@/types/sns';

/**
 * SNS投稿データ取得API
 *
 * GET /api/sns
 *
 * Google Sheets「SNS投稿管理」スプレッドシートから投稿履歴・投稿予定データを取得
 */
export async function GET() {
  try {
    const spreadsheetId = process.env.SNS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      return NextResponse.json(
        { success: false, error: 'SNS_SPREADSHEET_ID is not configured' },
        { status: 500 }
      );
    }

    // 投稿履歴データ取得
    const historyData = await getSheetData(spreadsheetId, '投稿履歴!A2:I1000');
    const history = parsePostHistory(historyData);

    // 投稿予定データ取得
    const scheduleData = await getSheetData(spreadsheetId, '投稿予定!A2:F1000');
    const schedule = parsePostSchedule(scheduleData);

    // 統計情報計算
    const overdueCount = schedule.filter((item) => item.status === '期限切れ').length;
    const todayScheduledCount = getTodayScheduledCount(schedule);
    const weekScheduledCount = getWeekScheduledCount(schedule);

    const responseData: SNSData = {
      history,
      schedule,
      overdueCount,
      todayScheduledCount,
      weekScheduledCount,
    };

    return NextResponse.json({ success: true, data: responseData });
  } catch (error) {
    console.error('SNS投稿データ取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'SNS投稿データの取得に失敗しました',
      },
      { status: 500 }
    );
  }
}

/**
 * 投稿履歴データをパース
 */
function parsePostHistory(data: any[][]): PostHistory[] {
  if (!data || data.length === 0) {
    return [];
  }

  return data
    .filter((row) => row && row.length > 0 && row[0]) // 空行除外
    .map((row) => {
      const history: PostHistory = {
        postedAt: formatDateTime(row[0]),
        snsType: (row[1] || 'Instagram') as SNSType,
        accountName: (row[2] || '公式') as SNSAccount,
        content: row[3] || '',
        imageUrl: row[4] || undefined,
        linkUrl: row[5] || undefined,
        likes: parseNumber(row[6]),
        engagements: parseNumber(row[7]),
        note: row[8] || undefined,
      };
      return history;
    });
}

/**
 * 投稿予定データをパース
 */
function parsePostSchedule(data: any[][]): PostSchedule[] {
  if (!data || data.length === 0) {
    return [];
  }

  const now = new Date();

  return data
    .filter((row) => row && row.length > 0 && row[0]) // 空行除外
    .map((row) => {
      const scheduledAt = formatDateTime(row[0]);
      const status = (row[4] || '予定') as PostStatus;

      // 期限切れ判定（投稿予定日時 < 現在日時 かつ ステータス = "予定"）
      const isOverdue =
        status === '予定' && new Date(scheduledAt) < now;

      const schedule: PostSchedule = {
        scheduledAt,
        snsType: (row[1] || 'Instagram') as SNSType,
        accountName: (row[2] || '公式') as SNSAccount,
        content: row[3] || '',
        status,
        note: row[5] || undefined,
        isOverdue,
      };
      return schedule;
    });
}

/**
 * 日時フォーマット変換（Google Sheetsの日時 → ISO 8601形式）
 */
function formatDateTime(value: any): string {
  if (!value) return '';

  // 既にISO形式の文字列の場合
  if (typeof value === 'string') {
    // Google Sheetsの日時形式（YYYY-MM-DD HH:MM）をパース
    const dateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (dateMatch) {
      const [, year, month, day, hour, minute] = dateMatch;
      return `${year}-${month}-${day}T${hour}:${minute}:00`;
    }
    return value;
  }

  // Date オブジェクトの場合
  if (value instanceof Date) {
    return value.toISOString();
  }

  // 数値の場合（Excelシリアル値）
  if (typeof value === 'number') {
    const date = excelSerialToDate(value);
    return date.toISOString();
  }

  return String(value);
}

/**
 * Excelシリアル値をDateオブジェクトに変換
 */
function excelSerialToDate(serial: number): Date {
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400;
  const dateInfo = new Date(utcValue * 1000);

  const fractionalDay = serial - Math.floor(serial) + 0.0000001;
  let totalSeconds = Math.floor(86400 * fractionalDay);
  const seconds = totalSeconds % 60;
  totalSeconds -= seconds;
  const hours = Math.floor(totalSeconds / (60 * 60));
  const minutes = Math.floor(totalSeconds / 60) % 60;

  return new Date(
    dateInfo.getFullYear(),
    dateInfo.getMonth(),
    dateInfo.getDate(),
    hours,
    minutes,
    seconds
  );
}

/**
 * 数値パース（空文字・undefinedの場合はundefined）
 */
function parseNumber(value: any): number | undefined {
  if (value === '' || value === null || value === undefined) {
    return undefined;
  }
  const num = Number(value);
  return isNaN(num) ? undefined : num;
}

/**
 * 今日の投稿予定件数を取得
 */
function getTodayScheduledCount(schedule: PostSchedule[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return schedule.filter((item) => {
    if (item.status !== '予定') return false;
    const scheduledDate = new Date(item.scheduledAt);
    return scheduledDate >= today && scheduledDate < tomorrow;
  }).length;
}

/**
 * 今週の投稿予定件数を取得
 */
function getWeekScheduledCount(schedule: PostSchedule[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 今週の日曜日
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay());

  // 来週の日曜日
  const nextSunday = new Date(sunday);
  nextSunday.setDate(sunday.getDate() + 7);

  return schedule.filter((item) => {
    if (item.status !== '予定') return false;
    const scheduledDate = new Date(item.scheduledAt);
    return scheduledDate >= sunday && scheduledDate < nextSunday;
  }).length;
}
