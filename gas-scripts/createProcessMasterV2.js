/**
 * 新工程マスター_V2を自動生成するスクリプト
 *
 * 実行方法:
 * 1. Google スプレッドシートを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトをコピペして保存
 * 4. 関数 createProcessMasterV2 を実行
 */

function createProcessMasterV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存のシートを削除（存在する場合）
  const existingSheet = ss.getSheetByName('新工程マスター_V2');
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }

  // 新しいシートを作成
  const sheet = ss.insertSheet('新工程マスター_V2');

  // ヘッダー行を作成
  sheet.appendRow(['カテゴリID', '工程No', '工程名', 'フェーズ', '順序', 'データ型']);

  // データを追加
  const data = [];

  // A, D, K, H, I, J カテゴリ（8工程）
  ['A', 'D', 'K', 'H', 'I', 'J'].forEach(catId => {
    data.push([catId, `${catId}-1`, '実施日報告', '準備', 1, '日付']);
    data.push([catId, `${catId}-2`, 'データ提出・撮影', '準備', 2, '日付']);
    data.push([catId, `${catId}-3`, '文字起こし', '制作', 3, '日付']);
    data.push([catId, `${catId}-4`, '内容整理', '制作', 4, '日付']);
    data.push([catId, `${catId}-5`, '写真レタッチ', '制作', 5, '日付']);
    data.push([catId, `${catId}-6`, 'ページ制作', '制作', 6, '日付']);
    data.push([catId, `${catId}-7`, '内部チェック', '全体進捗', 7, '日付']);
    data.push([catId, `${catId}-8`, '確認送付', '全体進捗', 8, 'JSON']);
  });

  // L, M カテゴリ（9工程）
  ['L', 'M'].forEach(catId => {
    data.push([catId, `${catId}-1`, '実施日報告', '準備', 1, '日付']);
    data.push([catId, `${catId}-2`, 'データ提出・撮影', '準備', 2, '日付']);
    data.push([catId, `${catId}-3`, 'ネーム作成', '準備', 3, '日付']);
    data.push([catId, `${catId}-4`, '文字起こし', '制作', 4, '日付']);
    data.push([catId, `${catId}-5`, '内容整理', '制作', 5, '日付']);
    data.push([catId, `${catId}-6`, '写真レタッチ', '制作', 6, '日付']);
    data.push([catId, `${catId}-7`, 'ページ制作', '制作', 7, '日付']);
    data.push([catId, `${catId}-8`, '内部チェック', '全体進捗', 8, '日付']);
    data.push([catId, `${catId}-9`, '確認送付', '全体進捗', 9, 'JSON']);
  });

  // C, E カテゴリ（7工程）
  ['C', 'E'].forEach(catId => {
    data.push([catId, `${catId}-1`, '契約企業確認', '準備', 1, '日付']);
    data.push([catId, `${catId}-2`, '情報入力フォーム送付', '準備', 2, '日付']);
    data.push([catId, `${catId}-3`, 'データ提出', '準備', 3, '日付']);
    data.push([catId, `${catId}-4`, 'ページ制作', '制作', 4, '日付']);
    data.push([catId, `${catId}-5`, '内部チェック', '全体進捗', 5, '日付']);
    data.push([catId, `${catId}-6`, '確認送付/修正', '全体進捗', 6, 'JSON']);
  });

  // B カテゴリ（2工程）
  data.push(['B', 'B-1', '目次作成', '全体管理', 1, '日付']);
  data.push(['B', 'B-2', 'アンケートフォーム作成', '全体管理', 2, '日付']);

  // S カテゴリ（2工程）
  data.push(['S', 'S-1', '次月号企画決定', '全体管理', 1, '日付']);
  data.push(['S', 'S-2', '次月号企画書作成', '全体管理', 2, '日付']);

  // F, P カテゴリ（2工程）
  ['F', 'P'].forEach(catId => {
    data.push([catId, `${catId}-1`, '変更確認', '全体管理', 1, '日付']);
    data.push([catId, `${catId}-2`, '確認送付/修正', '全体管理', 2, 'JSON']);
  });

  // データを一括で追加
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, 6).setValues(data);
  }

  // ヘッダー行を太字にする
  sheet.getRange(1, 1, 1, 6).setFontWeight('bold');

  // ヘッダー行の背景色を設定
  sheet.getRange(1, 1, 1, 6).setBackground('#4285f4').setFontColor('#ffffff');

  // 列幅を自動調整
  sheet.autoResizeColumns(1, 6);

  // シートを固定（ヘッダー行）
  sheet.setFrozenRows(1);

  Logger.log('✅ 新工程マスター_V2を作成しました');
  Logger.log(`   合計工程数: ${data.length}`);
  Logger.log(`   カテゴリ数: ${new Set(data.map(row => row[0])).size}`);

  // 完了メッセージを表示
  SpreadsheetApp.getUi().alert(
    '新工程マスター_V2作成完了',
    `合計 ${data.length} 工程を作成しました。\n\n` +
    `カテゴリ別工程数:\n` +
    `- A, D, K, H, I, J: 8工程\n` +
    `- L, M: 9工程\n` +
    `- C, E: 7工程\n` +
    `- B, S, F, P: 2工程`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
