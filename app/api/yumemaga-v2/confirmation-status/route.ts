import { NextResponse } from 'next/server';
import { getSheetData, updateSheetData } from '@/lib/google-sheets';

/**
 * 先方確認ステータスを更新
 * カテゴリIDまたは工程Noを受け付ける
 * カテゴリIDの場合、そのカテゴリに属する全工程を一括更新
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { issue, processNo, status } = body;

    if (!issue || !processNo || !status) {
      return NextResponse.json(
        { success: false, error: '月号、工程No/カテゴリID、ステータスを指定してください' },
        { status: 400 }
      );
    }

    // ステータス値の検証（Phase 3: 拡張ステータス対応）
    const validStatuses = ['制作中', '内部チェック', '確認送付', '確認待ち', '確認OK', '未送付', '-'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `無効なステータスです: ${status}` },
        { status: 400 }
      );
    }

    const spreadsheetId = process.env.YUMEMAGA_SPREADSHEET_ID!;

    // 進捗入力シートから該当行を検索
    const progressData = await getSheetData(spreadsheetId, '進捗入力シート!A1:J1000');

    // カテゴリIDか工程Noかを判定（ハイフンがあれば工程No、なければカテゴリID）
    const isCategoryId = !processNo.includes('-');

    if (isCategoryId) {
      // カテゴリIDの場合、ステータスに応じて更新対象の工程を決定
      // - '内部チェック' → 「内部チェック」工程を更新
      // - それ以外 → 「確認送付」工程を更新
      const targetKeyword = status === '内部チェック' ? '内部チェック' : '確認送付';
      const targetRows: number[] = [];

      progressData.forEach((row, i) => {
        if (i === 0) return; // ヘッダー行をスキップ
        const rowProcessNo = row[0]; // A列: 工程No
        const rowProcessName = row[1]; // B列: 工程名
        const rowIssue = row[3]; // D列: 月号

        // カテゴリIDで始まり、工程名に対象キーワードが含まれる行
        const categoryPrefix = rowProcessNo?.split('-')[0];
        if (categoryPrefix === processNo && rowProcessName?.includes(targetKeyword) && (rowIssue === issue || !rowIssue)) {
          targetRows.push(i + 1); // 1-indexed行番号
        }
      });

      if (targetRows.length === 0) {
        return NextResponse.json(
          { success: false, error: `カテゴリ ${processNo} で「${targetKeyword}」工程が見つかりません` },
          { status: 404 }
        );
      }

      // 各行のH列を更新
      for (const rowNum of targetRows) {
        await updateSheetData(
          spreadsheetId,
          `進捗入力シート!H${rowNum}`,
          [[status]]
        );
      }

      console.log(`✅ 先方確認ステータスを更新: カテゴリ ${processNo} の「${targetKeyword}」工程 (${targetRows.length}件) → ${status}`);

      return NextResponse.json({
        success: true,
        message: `先方確認ステータスを更新しました (${targetRows.length}工程)`,
        categoryId: processNo,
        updatedCount: targetRows.length,
        status,
      });
    } else {
      // 工程Noの場合、単一工程を更新
      const rowIndex = progressData.findIndex((row, i) => {
        if (i === 0) return false; // ヘッダー行をスキップ
        return row[0] === processNo && (row[3] === issue || !row[3]);
      });

      if (rowIndex === -1) {
        return NextResponse.json(
          { success: false, error: '工程が見つかりません' },
          { status: 404 }
        );
      }

      // H列（先方確認ステータス）を更新（行番号は1-indexed）
      await updateSheetData(
        spreadsheetId,
        `進捗入力シート!H${rowIndex + 1}`,
        [[status]]
      );

      console.log(`✅ 先方確認ステータスを更新: ${processNo} → ${status}`);

      return NextResponse.json({
        success: true,
        message: '先方確認ステータスを更新しました',
        processNo,
        status,
      });
    }
  } catch (error: any) {
    console.error('先方確認ステータス更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '先方確認ステータスの更新に失敗しました',
      },
      { status: 500 }
    );
  }
}
