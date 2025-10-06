/**
 * タスク管理スプレッドシート自動生成スクリプト
 *
 * 使い方:
 * 1. Google Apps Script エディタで新規プロジェクトを作成
 * 2. このコードを貼り付け
 * 3. createTaskSpreadsheet() を実行
 * 4. 実行後、スプレッドシートIDをコンソールから取得
 */

function createTaskSpreadsheet() {
  // 1. 新規スプレッドシート作成
  const spreadsheet = SpreadsheetApp.create('タスク管理');
  const spreadsheetId = spreadsheet.getId();

  Logger.log('タスク管理スプレッドシートを作成しました');
  Logger.log('スプレッドシートID: ' + spreadsheetId);
  Logger.log('URL: https://docs.google.com/spreadsheets/d/' + spreadsheetId + '/edit');

  // 2. シート1「タスク一覧」作成
  createTaskListSheet(spreadsheet);

  // 3. シート2「プロジェクト一覧」作成
  createProjectListSheet(spreadsheet);

  // 4. デフォルトの「Sheet1」を削除
  const defaultSheet = spreadsheet.getSheetByName('シート1');
  if (defaultSheet) {
    spreadsheet.deleteSheet(defaultSheet);
  }

  Logger.log('スプレッドシート作成完了！');
  Logger.log('次のステップ: サービスアカウントに閲覧権限を付与してください');
  Logger.log('サービスアカウントメール: yumesuta-management-sys@fair-yew-446514-q5.iam.gserviceaccount.com');

  return spreadsheetId;
}

/**
 * シート1「タスク一覧」作成
 */
function createTaskListSheet(spreadsheet) {
  const sheet = spreadsheet.getSheets()[0];
  sheet.setName('タスク一覧');

  // ヘッダー行設定
  const headers = [
    'タスクID',
    'タスク名',
    'プロジェクト名',
    '優先度',
    'ステータス',
    '開始予定日',
    '終了予定日',
    '実際の開始日',
    '実際の完了日',
    '進捗率',
    '担当者',
    '備考'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');

  // サンプルデータ
  const sampleData = [
    ['TASK-001', 'Phase4スケジューラー実装', '統合マネジメントシステム', '高', '完了', '2025-10-01', '2025-10-05', '2025-10-01', '2025-10-05', 100, '山田太郎', '完了'],
    ['TASK-002', 'SNS投稿管理機能実装', '統合マネジメントシステム', '高', '完了', '2025-10-05', '2025-10-05', '2025-10-05', '2025-10-05', 100, '山田太郎', '完了'],
    ['TASK-003', 'タスク管理機能実装', '統合マネジメントシステム', '高', '進行中', '2025-10-05', '2025-10-06', '2025-10-05', '', 70, '山田太郎', 'スプレッドシート設計完了'],
    ['TASK-004', '統合テスト・バグ修正', '統合マネジメントシステム', '中', '未着手', '2025-10-07', '2025-10-13', '', '', 0, '山田太郎', 'Phase1-8対応'],
    ['TASK-005', '営業先リスト更新', '-', '中', '進行中', '2025-10-04', '2025-10-06', '2025-10-04', '', 80, '山田太郎', 'あと3社'],
    ['TASK-006', 'ゆめマガ11月号コンテンツ確認', '-', '高', '未着手', '2025-10-06', '2025-10-08', '', '', 0, '山田太郎', '校正待ち'],
    ['TASK-007', '次回営業会議資料作成', '-', '低', '保留', '2025-10-10', '2025-10-12', '', '', 0, '山田太郎', '日程調整中']
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, headers.length);
  dataRange.setValues(sampleData);

  // 日付列のフォーマット設定
  sheet.getRange(2, 6, sampleData.length, 1).setNumberFormat('yyyy-mm-dd'); // 開始予定日
  sheet.getRange(2, 7, sampleData.length, 1).setNumberFormat('yyyy-mm-dd'); // 終了予定日
  sheet.getRange(2, 8, sampleData.length, 1).setNumberFormat('yyyy-mm-dd'); // 実際の開始日
  sheet.getRange(2, 9, sampleData.length, 1).setNumberFormat('yyyy-mm-dd'); // 実際の完了日

  // 進捗率列のフォーマット設定
  sheet.getRange(2, 10, sampleData.length, 1).setNumberFormat('0"%"');

  // 列幅自動調整
  sheet.autoResizeColumns(1, headers.length);

  Logger.log('「タスク一覧」シート作成完了');
}

/**
 * シート2「プロジェクト一覧」作成
 */
function createProjectListSheet(spreadsheet) {
  const sheet = spreadsheet.insertSheet('プロジェクト一覧');

  // ヘッダー行設定
  const headers = [
    'プロジェクトID',
    'プロジェクト名',
    '説明',
    'ステータス',
    '開始日',
    '終了予定日',
    '進捗率',
    '備考'
  ];

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');

  // サンプルデータ
  const sampleData = [
    ['PROJ-001', '統合マネジメントシステム', '業務統合管理システムMVP開発', '進行中', '2025-10-04', '2025-12-13', 70, 'Phase1-7実装中'],
    ['PROJ-002', 'ゆめマガリニューアル', 'ゆめマガのデザイン・コンテンツ刷新', '計画中', '2025-11-01', '2025-12-31', 0, '企画検討中']
  ];

  const dataRange = sheet.getRange(2, 1, sampleData.length, headers.length);
  dataRange.setValues(sampleData);

  // 日付列のフォーマット設定
  sheet.getRange(2, 5, sampleData.length, 1).setNumberFormat('yyyy-mm-dd'); // 開始日
  sheet.getRange(2, 6, sampleData.length, 1).setNumberFormat('yyyy-mm-dd'); // 終了予定日

  // 進捗率列のフォーマット設定
  sheet.getRange(2, 7, sampleData.length, 1).setNumberFormat('0"%"');

  // 列幅自動調整
  sheet.autoResizeColumns(1, headers.length);

  Logger.log('「プロジェクト一覧」シート作成完了');
}
