import { NextResponse } from 'next/server';
import { getSearchRank } from '@/lib/google-custom-search';

export async function GET() {
  try {
    const result = await getSearchRank('ゆめマガ', 'yumesuta.com');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
