import { NextResponse } from 'next/server';
import { getOAuthClient, saveTokens } from '@/lib/google-oauth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code not found' },
        { status: 400 }
      );
    }

    // 認証コードをトークンに交換
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    // トークンを保存
    saveTokens(tokens);

    // 成功ページにリダイレクト
    return NextResponse.redirect('http://localhost:3000/auth/success');
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
