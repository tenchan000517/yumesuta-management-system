import { NextResponse } from 'next/server';
import { google } from 'googleapis';

function getDriveClient() {
  const credentialsJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!credentialsJson) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }

  const credentials = JSON.parse(credentialsJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return google.drive({ version: 'v3', auth });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { folderId, email, role } = body;

    if (!folderId || !email) {
      return NextResponse.json(
        { success: false, error: 'folderId and email are required' },
        { status: 400 }
      );
    }

    const drive = getDriveClient();

    // フォルダに権限を追加
    const permission = await drive.permissions.create({
      fileId: folderId,
      requestBody: {
        type: 'user',
        role: role || 'writer', // reader, writer, owner
        emailAddress: email,
      },
      fields: 'id, emailAddress, role',
    });

    return NextResponse.json({
      success: true,
      permission: permission.data,
      message: `${email}に${role || 'writer'}権限を付与しました`,
    });

  } catch (error: any) {
    console.error('Share folder error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
