import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/google-sheets';
import type { ContractData } from '@/types/workflow';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contractId = parseInt(id);

    // 契約・入金管理シートから全データ取得
    const contractSheet = await getSheetData(
      process.env.SALES_SPREADSHEET_ID!,
      '契約・入金管理!A:AD'
    );

    // 該当行を検索（タイトル行とヘッダー行をスキップ）
    const row = contractSheet.slice(2).find(r => parseInt(r[0]) === contractId);

    if (!row) {
      return NextResponse.json(
        { success: false, error: '契約が見つかりません' },
        { status: 404 }
      );
    }

    // ContractData 型に変換
    const contract: ContractData = {
      id: parseInt(row[0]),              // A列: 契約ID
      companyId: parseInt(row[1]),       // B列: 企業ID
      companyName: row[2],               // C列: 企業名
      contractService: row[3],           // D列
      contractDate: row[4],              // E列
      amount: row[5],                    // F列
      paymentMethod: row[6],             // G列
      contractSentDate: row[7] || undefined,         // H列
      contractReceivedDate: row[8] || undefined,     // I列
      applicationSentDate: row[9] || undefined,      // J列
      applicationReceivedDate: row[10] || undefined, // K列
      paymentDueDate: row[11],           // L列
      paymentActualDate: row[12] || undefined,       // M列
      paymentStatus: row[13],            // N列
      delayDays: parseInt(row[14]) || undefined,     // O列
      publicationIssue: row[15],         // P列
      notes: row[16] || undefined,       // Q列
      // 進捗管理列（R〜AD列）
      step1CompletedAt: row[17] || undefined,   // R列
      step2CompletedAt: row[18] || undefined,   // S列
      step3CompletedAt: row[19] || undefined,   // T列
      step4CompletedAt: row[20] || undefined,   // U列
      step5CompletedAt: row[21] || undefined,   // V列
      step6CompletedAt: row[22] || undefined,   // W列
      step7CompletedAt: row[23] || undefined,   // X列
      step8CompletedAt: row[24] || undefined,   // Y列
      step9CompletedAt: row[25] || undefined,   // Z列
      step10CompletedAt: row[26] || undefined,  // AA列
      step11CompletedAt: row[27] || undefined,  // AB列
      step12CompletedAt: row[28] || undefined,  // AC列
      step13CompletedAt: row[29] || undefined   // AD列
    };

    return NextResponse.json({
      success: true,
      contract
    });

  } catch (error) {
    console.error('契約取得エラー:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}
