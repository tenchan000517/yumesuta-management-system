import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const TOKEN_PATH = path.join(process.cwd(), 'tokens.json');

/**
 * 認証トークンをクリアするAPI
 * トークンが期限切れで再認証が必要な場合に使用
 */
export async function POST() {
  try {
    if (fs.existsSync(TOKEN_PATH)) {
      fs.unlinkSync(TOKEN_PATH);
      return NextResponse.json({
        success: true,
        message: 'Authentication tokens cleared. Please re-authenticate.',
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No tokens found to clear.',
      });
    }
  } catch (error: any) {
    console.error('Failed to clear tokens:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to clear tokens',
      },
      { status: 500 }
    );
  }
}
