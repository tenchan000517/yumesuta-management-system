/**
 * 検索順位キャッシュの状態を返すAPI
 */
import { NextResponse } from 'next/server';
import { getCacheStatus } from '@/lib/cache/search-rank-cache';

export async function GET() {
  try {
    const status = getCacheStatus();
    return NextResponse.json({ success: true, cache: status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
