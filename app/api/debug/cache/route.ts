import { NextResponse } from 'next/server';
import { getCacheStats, clearCache } from '@/lib/google-sheets';

/**
 * GET /api/debug/cache
 * キャッシュ統計を取得
 */
export async function GET() {
  try {
    const stats = getCacheStats();

    return NextResponse.json({
      success: true,
      data: {
        cacheEntries: stats.entries,
        batchCacheEntries: stats.batchEntries,
        totalEntries: stats.entries + stats.batchEntries,
        cacheTTL: '5 minutes',
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
 * DELETE /api/debug/cache
 * キャッシュをクリア
 */
export async function DELETE() {
  try {
    clearCache();

    return NextResponse.json({
      success: true,
      message: 'Cache has been cleared',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
