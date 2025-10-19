import { NextRequest, NextResponse } from 'next/server';
import { getRequestCount, getRequestLogs, resetRequestCount } from '@/lib/google-sheets';

/**
 * GET /api/debug/request-count
 * 現在のGoogle Sheets APIリクエスト数とログを取得
 */
export async function GET() {
  try {
    const count = getRequestCount();
    const logs = getRequestLogs();

    return NextResponse.json({
      success: true,
      data: {
        count,
        logs,
        quota: {
          limit: 60,
          remaining: 60 - count,
          percentUsed: ((count / 60) * 100).toFixed(1) + '%',
        },
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/debug/request-count
 * リクエストカウンターをリセット
 */
export async function POST() {
  try {
    resetRequestCount();

    return NextResponse.json({
      success: true,
      message: 'Request counter has been reset',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
