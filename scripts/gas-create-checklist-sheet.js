/**
 * Google Apps Script: チェックリスト管理シート作成
 *
 * 目的: 営業予実管理スプレッドシートに「チェックリスト管理」シートを追加
 * Phase: チェックリスト機能実装
 * 作成日: 2025年10月12日
 *
 * 実行方法:
 * 1. 営業予実管理スプレッドシートを開く
 *    https://docs.google.com/spreadsheets/d/13PzSnGekGxDWX7B1_TwczNibR6j_JxDb3UuquPX1GyQ
 * 2. 拡張機能 → Apps Script
 * 3. このスクリプトをコピー&ペースト
 * 4. 関数 createChecklistSheet() を実行
 * 5. 権限を承認（初回のみ）
 */

function createChecklistSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  console.log('===== チェックリスト管理シート作成開始 =====');
  console.log('');

  // 既存のシートをチェック
  const existingSheet = spreadsheet.getSheetByName('チェックリスト管理');
  if (existingSheet) {
    console.log('⚠️  「チェックリスト管理」シートは既に存在します。');
    console.log('   処理を中断します。');
    console.log('');
    console.log('既存のシートを削除して再作成する場合:');
    console.log('1. 既存の「チェックリスト管理」シートを手動で削除');
    console.log('2. このスクリプトを再実行');
    return;
  }

  // 新規シート作成
  console.log('[1/3] 「チェックリスト管理」シートを作成中...');
  const sheet = spreadsheet.insertSheet('チェックリスト管理');
  console.log('✅ シート作成完了');
  console.log('');

  // ヘッダー行を設定（56列: A〜BD）
  // contract-workflow.tsのチェック項目IDと完全一致させる
  console.log('[2/3] ヘッダー行を設定中...');
  const headers = [
    '契約ID',                    // A列
    // ステップ1: 情報収集（4項目）
    's1-c1',                     // B列: 企業名は正式名称か
    's1-c2',                     // C列: 住所は「番地」「号」まで記載されているか
    's1-c3',                     // D列: 代表者役職が記入されているか
    's1-c4',                     // E列: 支払期限が記載されているか
    // ステップ2: 基本契約書作成（4項目）
    's2-c1',                     // F列: 企業名が正しく修正されているか
    's2-c2',                     // G列: 住所が正しく入力されているか
    's2-c3',                     // H列: 代表者名が正しく入力されているか
    's2-c4',                     // I列: 契約締結日が正しいか
    // ステップ3: 基本契約書の押印・送信（4項目）
    's3-c1',                     // J列: 押印位置が正しく配置されているか
    's3-c2',                     // K列: ゆめスタが押印したか
    's3-c3',                     // L列: 送信先メールアドレスが正しいか
    's3-c4',                     // M列: 基本契約書送付「有」を確認したか
    // ステップ4: 申込書兼個別契約書作成（6項目）
    's4-c1',                     // N列: ページ1: 申込日が正しいか
    's4-c2',                     // O列: ページ1: 顧客情報がすべて正しく入力されているか
    's4-c3',                     // P列: ページ1: 契約料金が税別で記入されているか
    's4-c4',                     // Q列: ページ1: 掲載期間が12ヶ月になっているか
    's4-c5',                     // R列: ページ3: 契約成立欄の顧客情報が正しいか
    's4-c6',                     // S列: ページ3: 署名欄の日付が正しいか
    // ステップ5: 申込書の押印・送信（4項目）
    's5-c1',                     // T列: 押印位置が正しく配置されているか
    's5-c2',                     // U列: ゆめスタが押印したか
    's5-c3',                     // V列: マネーフォワードから送信したか
    's5-c4',                     // W列: 送信完了メールを送ったか
    // ステップ6: 重要事項説明（6項目）
    's6-c1',                     // X列: 日程調整が完了したか
    's6-c2',                     // Y列: オンライン面談を実施したか
    's6-c3',                     // Z列: 契約期間・自動更新について説明したか
    's6-c4',                     // AA列: 中途解約・返金について説明したか
    's6-c5',                     // AB列: 原稿提出・掲載開始について説明したか
    's6-c6',                     // AC列: 顧客の質問に回答したか
    // ステップ7: 契約完了確認（3項目）
    's7-c1',                     // AD列: マネーフォワードで契約完了になっているか
    's7-c2',                     // AE列: 顧客が押印しているか
    's7-c3',                     // AF列: 基本契約書と申込書の両方が完了しているか
    // ステップ8: 請求書作成・送付（4項目）
    's8-c1',                     // AG列: 請求書の件名が正しいか
    's8-c2',                     // AH列: 単価が税別で記入されているか
    's8-c3',                     // AI列: 支払期限が正しいか
    's8-c4',                     // AJ列: 顧客に送信したか
    // ステップ9: 入金確認（3項目）
    's9-c1',                     // AK列: ゆうちょダイレクトで確認したか
    's9-c2',                     // AL列: 入金額が正しいか
    's9-c3',                     // AM列: 入金日を記録したか
    // ステップ10: 入金管理シート更新（4項目）
    's10-c1',                    // AN列: 顧客名が正しく記入されているか
    's10-c2',                    // AO列: 入金日が正しく記入されているか
    's10-c3',                    // AP列: 入金額が正しく記入されているか
    's10-c4',                    // AQ列: 掲載期間が正しく記入されているか
    // ステップ11: 入金確認連絡・原稿依頼（4項目）
    's11-c1',                    // AR列: 入金確認メールを送ったか
    's11-c2',                    // AS列: 原稿情報フォームを送ったか
    's11-c3',                    // AT列: 提出期限（7日以内）を伝えたか
    's11-c4',                    // AU列: 初稿提出期限（翌月7日）を伝えたか
    // ステップ12: 制作・校正（5項目）
    's12-c1',                    // AV列: 制作陣に通知したか
    's12-c2',                    // AW列: 原稿情報を共有したか
    's12-c3',                    // AX列: 校正用原稿を送付したか
    's12-c4',                    // AY列: 校正依頼メールを送ったか
    's12-c5',                    // AZ列: 修正期限を伝えたか
    // ステップ13: 掲載（4項目）
    's13-c1',                    // BA列: 顧客から確認OKをもらったか
    's13-c2',                    // BB列: 修正対応が完了したか（修正がある場合）
    's13-c3',                    // BC列: 原稿を掲載したか
    's13-c4'                     // BD列: 掲載完了メールを送ったか
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  console.log('✅ ヘッダー行設定完了（' + headers.length + '列）');
  console.log('');

  // ヘッダー行のスタイル設定
  console.log('[3/3] スタイル設定中...');
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#4285F4');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');

  // 列幅を調整
  sheet.setColumnWidth(1, 80);   // A: 契約ID

  // チェック項目の列幅（全て同じ幅）
  for (let i = 2; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 120);
  }

  // 1行目を固定
  sheet.setFrozenRows(1);

  console.log('✅ スタイル設定完了');
  console.log('');

  console.log('===== チェックリスト管理シート作成完了 =====');
  console.log('');
  console.log('✅ シート「チェックリスト管理」が正常に作成されました！');
  console.log('');
  console.log('📋 シート情報:');
  console.log('   列数: ' + headers.length + '列（A〜BD）');
  console.log('   - A列: 契約ID');
  console.log('   - B〜BD列: チェック項目（55項目）');
  console.log('   ヘッダー行: 青色背景、白文字、太字');
  console.log('   固定行: 1行目（スクロール時も常に表示）');
  console.log('');
  console.log('チェック項目の内訳（contract-workflow.tsと完全一致）:');
  console.log('   ステップ1: 4項目（s1-c1 〜 s1-c4）');
  console.log('   ステップ2: 4項目（s2-c1 〜 s2-c4）');
  console.log('   ステップ3: 4項目（s3-c1 〜 s3-c4）');
  console.log('   ステップ4: 6項目（s4-c1 〜 s4-c6）');
  console.log('   ステップ5: 4項目（s5-c1 〜 s5-c4）');
  console.log('   ステップ6: 6項目（s6-c1 〜 s6-c6）');
  console.log('   ステップ7: 3項目（s7-c1 〜 s7-c3）');
  console.log('   ステップ8: 4項目（s8-c1 〜 s8-c4）');
  console.log('   ステップ9: 3項目（s9-c1 〜 s9-c3）');
  console.log('   ステップ10: 4項目（s10-c1 〜 s10-c4）');
  console.log('   ステップ11: 4項目（s11-c1 〜 s11-c4）');
  console.log('   ステップ12: 5項目（s12-c1 〜 s12-c5）');
  console.log('   ステップ13: 4項目（s13-c1 〜 s13-c4）');
  console.log('');
  console.log('次のステップ:');
  console.log('1. ✅ シートが正しく作成されているか確認');
  console.log('2. ✅ ヘッダー行（A1〜BD1）が正しく設定されているか確認');
  console.log('3. 📝 チェックリストAPI実装へ進む');
  console.log('      → /api/contract/checklist/[id]/route.ts');
  console.log('');
}
