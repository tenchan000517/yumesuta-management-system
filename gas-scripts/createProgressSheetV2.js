/**
 * 進捗入力シート_V2を自動生成するスクリプト
 *
 * 実行方法:
 * 1. Google スプレッドシートを開く
 * 2. 拡張機能 > Apps Script を開く
 * 3. このスクリプトをコピペして保存
 * 4. 関数 createProgressSheetV2 を実行
 *
 * 構造:
 * - 横持ち構造（月号が行、工程が列）
 * - 各工程に2列（予定・実績）
 * - 合計173列（月号1列 + 86工程×2列）
 */

function createProgressSheetV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存のシートを削除（存在する場合）
  const existingSheet = ss.getSheetByName('進捗入力シート_V2');
  if (existingSheet) {
    ss.deleteSheet(existingSheet);
  }

  // 新しいシートを作成
  const sheet = ss.insertSheet('進捗入力シート_V2');

  // ヘッダー行を構築
  const headers = ['月号'];

  // 工程定義（時系列順）
  const categories = [
    // S（次月号準備）
    { id: 'S', count: 2, processes: [
      '次月号企画決定',
      '次月号企画書作成'
    ]},

    // A, D, K, H, I, J（制作系：8工程）
    ...['A', 'D', 'K', 'H', 'I', 'J'].map(id => ({
      id,
      count: 8,
      processes: [
        '実施日報告',
        'データ提出・撮影',
        '文字起こし',
        '内容整理',
        '写真レタッチ',
        'ページ制作',
        '内部チェック',
        '確認送付'
      ]
    })),

    // L, M（制作系：9工程）
    ...['L', 'M'].map(id => ({
      id,
      count: 9,
      processes: [
        '実施日報告',
        'データ提出・撮影',
        'ネーム作成',
        '文字起こし',
        '内容整理',
        '写真レタッチ',
        'ページ制作',
        '内部チェック',
        '確認送付'
      ]
    })),

    // C, E（企業管理：6工程）
    ...['C', 'E'].map(id => ({
      id,
      count: 6,
      processes: [
        '契約企業確認',
        '情報入力フォーム送付',
        'データ提出',
        'ページ制作',
        '内部チェック',
        '確認送付/修正'
      ]
    })),

    // B（全体管理）
    { id: 'B', count: 2, processes: [
      '目次作成',
      'アンケートフォーム作成'
    ]},

    // F, P（修正時のみ）
    ...['F', 'P'].map(id => ({
      id,
      count: 2,
      processes: [
        '変更確認',
        '確認送付/修正'
      ]
    }))
  ];

  // 確認送付工程のリスト（JSON管理対象）
  const confirmationProcesses = new Set([
    'A-8', 'D-8', 'K-8', 'H-8', 'I-8', 'J-8', 'L-9', 'M-9',
    'C-6', 'E-6', 'F-2', 'P-2'
  ]);

  // ヘッダー行を構築
  categories.forEach(cat => {
    for (let i = 0; i < cat.count; i++) {
      const processNo = `${cat.id}-${i + 1}`;
      const processName = cat.processes[i] || `工程${i + 1}`;

      headers.push(`${processNo}予定`);

      // 確認送付工程の実績列にはJSON注釈を追加
      if (confirmationProcesses.has(processNo)) {
        headers.push(`${processNo}実績(JSON)`);
      } else {
        headers.push(`${processNo}実績`);
      }
    }
  });

  // ヘッダー行を設定
  sheet.appendRow(headers);

  // ヘッダー行のスタイリング
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#4285f4');
  headerRange.setFontColor('#ffffff');
  headerRange.setHorizontalAlignment('center');

  // 列幅の設定
  sheet.setColumnWidth(1, 150); // 月号列
  for (let i = 2; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 120); // 工程列
  }

  // シートを固定（ヘッダー行と月号列）
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(1);

  // サンプルデータ行を追加（任意）
  const sampleRow = ['2025年11月号'];
  for (let i = 1; i < headers.length; i++) {
    sampleRow.push(''); // 空欄
  }
  sheet.appendRow(sampleRow);

  Logger.log('✅ 進捗入力シート_V2を作成しました');
  Logger.log(`   合計列数: ${headers.length}`);
  Logger.log(`   工程数: ${(headers.length - 1) / 2}`);

  // カテゴリ別工程数を計算
  const categoryStats = {};
  categories.forEach(cat => {
    if (!categoryStats[cat.id]) {
      categoryStats[cat.id] = 0;
    }
    categoryStats[cat.id] += cat.count;
  });

  // 完了メッセージを表示
  let statsMessage = 'カテゴリ別工程数:\n';
  Object.keys(categoryStats).forEach(catId => {
    statsMessage += `- ${catId}: ${categoryStats[catId]}工程\n`;
  });

  SpreadsheetApp.getUi().alert(
    '進捗入力シート_V2作成完了',
    `合計 ${(headers.length - 1) / 2} 工程、${headers.length} 列を作成しました。\n\n` + statsMessage,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
