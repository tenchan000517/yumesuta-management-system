import { getSheetData } from '@/lib/google-sheets';

/**
 * 契約・入金管理シートの次の契約IDを生成
 *
 * ロジック:
 * 1. A列の全データを取得
 * 2. 最大値を求める
 * 3. 最大値 + 1 を返す
 */
export async function generateNextContractId(spreadsheetId: string): Promise<number> {
  const contractSheet = await getSheetData(
    spreadsheetId,
    '契約・入金管理!A:A'
  );

  const maxId = contractSheet
    .slice(2) // タイトル行とヘッダー行をスキップ
    .map(row => parseInt(row[0]) || 0)
    .reduce((max, id) => Math.max(max, id), 0);

  return maxId + 1;
}
