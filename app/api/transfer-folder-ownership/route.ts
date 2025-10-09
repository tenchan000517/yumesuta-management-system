import { NextResponse } from 'next/server';
import { getDriveClient } from '@/lib/google-drive';

const USER_EMAIL = 'tenchan1341@gmail.com';

export async function POST(request: Request) {
  try {
    const { folderIds } = await request.json();

    if (!folderIds || !Array.isArray(folderIds)) {
      return NextResponse.json(
        { success: false, error: 'folderIds array is required' },
        { status: 400 }
      );
    }

    const drive = getDriveClient();
    const results = [];

    for (const folderId of folderIds) {
      try {
        // 所有権を移譲するには、新しい所有者に対してrole='owner'の権限を追加し、
        // transferOwnership=trueを設定する
        await drive.permissions.create({
          fileId: folderId,
          requestBody: {
            type: 'user',
            role: 'owner',
            emailAddress: USER_EMAIL,
          },
          transferOwnership: true,
          supportsAllDrives: true,
        });

        results.push({
          folderId,
          success: true,
          message: `Ownership transferred to ${USER_EMAIL}`,
        });
      } catch (error: any) {
        results.push({
          folderId,
          success: false,
          error: error.message,
        });
      }
    }

    const allSucceeded = results.every(r => r.success);

    return NextResponse.json({
      success: allSucceeded,
      results,
      summary: {
        total: folderIds.length,
        succeeded: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
    });

  } catch (error: any) {
    console.error('Transfer ownership error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
