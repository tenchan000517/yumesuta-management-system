import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/google-oauth';

export async function GET() {
  const authenticated = isAuthenticated();

  return NextResponse.json({
    authenticated,
    message: authenticated
      ? 'OAuth authenticated'
      : 'Not authenticated. Please visit /api/auth/google',
  });
}
