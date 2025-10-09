import { NextResponse } from 'next/server';
import { generateAuthUrl } from '@/lib/google-oauth';

export async function GET() {
  try {
    const authUrl = generateAuthUrl();

    // 認証URLにリダイレクト
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
