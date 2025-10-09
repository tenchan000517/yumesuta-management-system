import { NextResponse } from 'next/server';
import { getSheetData, appendSheetRow, updateSheetRow } from '@/lib/google-sheets';

/**
 * 企業情報保存API
 * 企業マスターに新規企業を登録、または既存企業を更新
 */

// 企業マスターの列順序に従ってデータを配列に変換
function convertFormDataToRowArray(data: Record<string, string>): any[] {
  return [
    data.companyId || '',            // A列
    data.companyName || '',          // B列
    data.companyNameKana || '',      // C列
    data.industry || '',             // D列
    data.area || '',                 // E列
    data.description || '',          // F列
    data.logoPath || '',             // G列
    data.heroPath || '',             // H列
    data.qrPath || '',               // I列
    data.slogan || '',               // J列
    data.presidentName || '',        // K列
    data.presidentNameEn || '',      // L列
    data.presidentPosition || '',    // M列
    data.presidentPhoto || '',       // N列
    data.service1ImagePath || '',    // O列
    data.service1Title || '',        // P列
    data.service1Desc || '',         // Q列
    data.service2ImagePath || '',    // R列
    data.service2Title || '',        // S列
    data.service2Desc || '',         // T列
    data.service3ImagePath || '',    // U列
    data.service3Title || '',        // V列
    data.service3Desc || '',         // W列
    data.presidentMessage || '',     // X列
    data.member1ImagePath || '',     // Y列
    data.member1Question || '',      // Z列
    data.member1Answer || '',        // AA列
    data.member2ImagePath || '',     // AB列
    data.member2Question || '',      // AC列
    data.member2Answer || '',        // AD列
    data.member3ImagePath || '',     // AE列
    data.member3Question || '',      // AF列
    data.member3Answer || '',        // AG列
    data.initiative1Title || '',     // AH列
    data.initiative1Desc || '',      // AI列
    data.initiative2Title || '',     // AJ列
    data.initiative2Desc || '',      // AK列
    data.initiative3Title || '',     // AL列
    data.initiative3Desc || '',      // AM列
    data.address || '',              // AN列
    data.phone || '',                // AO列
    data.fax || '',                  // AP列
    data.website || '',              // AQ列
    data.email || '',                // AR列
    data.established || '',          // AS列
    data.employees || '',            // AT列
    data.business || '',             // AU列
    data.firstIssue || '',           // AV列
    data.lastIssue || '',            // AW列
    data.status || 'active',         // AX列
    data.notes || '',                // AY列
  ];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mode, companyName, data } = body;

    if (!mode || !companyName || !data) {
      return NextResponse.json(
        { success: false, error: 'mode, companyName, dataが必須です' },
        { status: 400 }
      );
    }

    if (mode !== 'new' && mode !== 'existing') {
      return NextResponse.json(
        { success: false, error: 'modeは new または existing である必要があります' },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 1. 企業マスターを取得
    const companyData = await getSheetData(spreadsheetId, '企業マスター!A2:AY200');

    // 2. 既存モードの場合、対象企業を検索
    let existingRowIndex = -1;
    if (mode === 'existing') {
      existingRowIndex = companyData.findIndex((row: any[]) => row[1] === companyName);

      if (existingRowIndex === -1) {
        return NextResponse.json(
          { success: false, error: `企業 "${companyName}" が見つかりません` },
          { status: 404 }
        );
      }
    }

    // 3. フォームデータを配列形式に変換
    const rowData = convertFormDataToRowArray(data);

    // 4. スプレッドシートに書き込み
    if (mode === 'new') {
      // 新規行追加
      await appendSheetRow(spreadsheetId, '企業マスター', rowData);
      console.log(`✅ 新規企業登録: ${data.companyName}`);
    } else {
      // 既存行更新
      const targetRow = existingRowIndex + 2; // +2はヘッダー行とインデックス調整
      await updateSheetRow(spreadsheetId, '企業マスター', targetRow, rowData);
      console.log(`✅ 企業情報更新: ${companyName} (行${targetRow})`);
    }

    return NextResponse.json({
      success: true,
      message: `企業情報を${mode === 'new' ? '登録' : '更新'}しました`,
      companyName: data.companyName,
      mode,
    });
  } catch (error: any) {
    console.error('企業情報保存エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '企業情報の保存に失敗しました',
      },
      { status: 500 }
    );
  }
}
