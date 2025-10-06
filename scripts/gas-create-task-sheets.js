/**
 * Google Apps Script: タスク管理シート作成
 *
 * 【実行方法】
 * 1. Google Sheetsを開く: https://docs.google.com/spreadsheets/d/1yUrlBRsbvUvVLrSukQO0N-TTygBxl7DY1OqDQgGY06k
 * 2. 拡張機能 → Apps Script でGASエディタを開く
 * 3. このコードをコピー&ペースト
 * 4. 関数 createTaskSheets() を実行
 */

function createTaskSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存シートを削除（あれば）
  const existingSheets = ss.getSheets();
  existingSheets.forEach(sheet => {
    const name = sheet.getName();
    if (['タスクマスタ', 'タスク実施履歴', '定期タスクスケジュール', 'プロジェクトタスク'].includes(name)) {
      ss.deleteSheet(sheet);
    }
  });

  Logger.log('既存シート削除完了');

  // 1. タスクマスタシート作成
  const taskMaster = ss.insertSheet('タスクマスタ');
  taskMaster.appendRow([
    'タスクID', 'タスク名', 'カテゴリ', '頻度種別', '頻度詳細', '所要時間', '優先度', '抜けもれリスク',
    '関連URL1', '関連URL1名称', '関連URL2', '関連URL2名称', '関連URL3', '関連URL3名称',
    '関連パス1', '関連パス1名称', '関連パス2', '関連パス2名称',
    '関連コマンド', '関連情報', '依存タスクID', '備考'
  ]);

  // ヘッダー行をフォーマット
  const headerRange1 = taskMaster.getRange('A1:V1');
  headerRange1.setBackground('#4285F4');
  headerRange1.setFontColor('#FFFFFF');
  headerRange1.setFontWeight('bold');
  headerRange1.setHorizontalAlignment('center');

  Logger.log('✅ タスクマスタシート作成完了');

  // 2. タスク実施履歴シート作成
  const taskHistory = ss.insertSheet('タスク実施履歴');
  taskHistory.appendRow([
    '実施日', 'タスクID', 'タスク名', 'ステータス', '実施時刻', '所要時間実績',
    '結果・メモ', '関連URLクリック', '次のアクション', 'アラート設定日', 'タイムスタンプ', '備考'
  ]);

  const headerRange2 = taskHistory.getRange('A1:L1');
  headerRange2.setBackground('#34A853');
  headerRange2.setFontColor('#FFFFFF');
  headerRange2.setFontWeight('bold');
  headerRange2.setHorizontalAlignment('center');

  Logger.log('✅ タスク実施履歴シート作成完了');

  // 3. 定期タスクスケジュールシート作成
  const scheduled = ss.insertSheet('定期タスクスケジュール');
  scheduled.appendRow([
    '予定日', 'タスクID', 'タスク名', '予定時刻', 'ステータス', 'アラート', '実施日', '備考', 'タイムスタンプ'
  ]);

  const headerRange3 = scheduled.getRange('A1:I1');
  headerRange3.setBackground('#FBBC04');
  headerRange3.setFontColor('#FFFFFF');
  headerRange3.setFontWeight('bold');
  headerRange3.setHorizontalAlignment('center');

  Logger.log('✅ 定期タスクスケジュールシート作成完了');

  // 4. プロジェクトタスクシート作成
  const project = ss.insertSheet('プロジェクトタスク');
  project.appendRow([
    'プロジェクト名', 'タスクID', 'タスク名', '開始予定日', '完了予定日', 'ステータス',
    '実際開始日', '実際完了日', '遅延日数', '担当者', '依存タスク完了', '備考', 'タイムスタンプ'
  ]);

  const headerRange4 = project.getRange('A1:M1');
  headerRange4.setBackground('#EA4335');
  headerRange4.setFontColor('#FFFFFF');
  headerRange4.setFontWeight('bold');
  headerRange4.setHorizontalAlignment('center');

  Logger.log('✅ プロジェクトタスクシート作成完了');

  Logger.log('========================================');
  Logger.log('✅ 全4シート作成完了！');
  Logger.log('次のステップ: populateTaskMaster() 関数を実行してデータを入力してください');
  Logger.log('========================================');
}
