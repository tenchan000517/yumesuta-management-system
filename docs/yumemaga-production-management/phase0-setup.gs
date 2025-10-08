/**
 * ゆめマガ進捗管理システム - Phase 0 自動セットアップスクリプト
 *
 * 使い方:
 * 1. Google Sheetsで「拡張機能」→「Apps Script」を開く
 * 2. このスクリプトをコピー&ペースト
 * 3. 保存して「setupPhase0Menu」を実行（初回のみ）
 * 4. スプレッドシートに戻り、「Phase 0」メニューから実行
 *
 * 作成日: 2025-10-08
 * 作成者: Claude Code
 */

// ==================== メニュー追加 ====================

/**
 * スプレッドシート起動時に自動実行される
 * Phase 0メニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Phase 0')
    .addItem('✅ 全シート自動作成', 'setupPhase0')
    .addSeparator()
    .addItem('1️⃣ カテゴリマスター作成', 'createCategoryMaster')
    .addItem('2️⃣ 企業マスター作成', 'createCompanyMaster')
    .addItem('3️⃣ 作業アシストマスター作成', 'createWorkAssistMaster')
    .addItem('4️⃣ 新工程マスタークリーンナップ', 'cleanupProcessMaster')
    .addSeparator()
    .addItem('🔍 Phase 0完了チェック', 'checkPhase0Completion')
    .addToUi();
}

// ==================== メイン実行関数 ====================

/**
 * Phase 0を一括実行
 */
function setupPhase0() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Phase 0セットアップ開始',
    '以下の処理を実行します:\n\n' +
    '1. カテゴリマスター作成（15カテゴリ）\n' +
    '2. 企業マスター作成（6社テンプレート）\n' +
    '3. 作業アシストマスター作成（6工程）\n' +
    '4. 新工程マスタークリーンナップ\n\n' +
    '既存のシートは上書きされます。続行しますか？',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    ui.alert('キャンセルされました');
    return;
  }

  try {
    Logger.log('Phase 0セットアップ開始...');

    // 1. カテゴリマスター作成
    Logger.log('1/4: カテゴリマスター作成中...');
    createCategoryMaster();

    // 2. 企業マスター作成
    Logger.log('2/4: 企業マスター作成中...');
    createCompanyMaster();

    // 3. 作業アシストマスター作成
    Logger.log('3/4: 作業アシストマスター作成中...');
    createWorkAssistMaster();

    // 4. 新工程マスタークリーンナップ
    Logger.log('4/4: 新工程マスタークリーンナップ中...');
    cleanupProcessMaster();

    Logger.log('Phase 0セットアップ完了！');
    ui.alert(
      '✅ Phase 0セットアップ完了！',
      '以下のシートが作成されました:\n\n' +
      '✅ カテゴリマスター（15カテゴリ）\n' +
      '✅ 企業マスター（6社テンプレート）\n' +
      '✅ 作業アシストマスター（6工程）\n' +
      '✅ 新工程マスタークリーンナップ完了\n\n' +
      '次のステップ: Phase 1（カテゴリ動的管理）の実装',
      ui.ButtonSet.OK
    );
  } catch (error) {
    Logger.log('エラー発生: ' + error);
    ui.alert('❌ エラー発生', error.toString(), ui.ButtonSet.OK);
  }
}

// ==================== 1. カテゴリマスター作成 ====================

/**
 * カテゴリマスター作成（15カテゴリ）
 */
function createCategoryMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存シートを削除
  let sheet = ss.getSheetByName('カテゴリマスター');
  if (sheet) {
    ss.deleteSheet(sheet);
  }

  // 新規シート作成
  sheet = ss.insertSheet('カテゴリマスター');

  // ヘッダー行
  const headers = [
    'カテゴリID',
    'カテゴリ名',
    '説明',
    '確認送付必須',
    '必要データ',
    '表示順',
    'アイコン',
    '色テーマ',
    'ステータス'
  ];

  // データ（15カテゴリ）
  const data = [
    ['A', 'メインインタビュー', 'メイン記事の取材・制作', true, '録音データ,写真データ', 1, '📝', 'blue', 'active'],
    ['K', 'インタビュー②', 'サブインタビュー記事', true, '録音データ,写真データ', 2, '📝', 'green', 'active'],
    ['H', 'STAR①', 'STAR記事1本目', true, '録音データ,写真データ', 3, '⭐', 'yellow', 'active'],
    ['I', 'STAR②', 'STAR記事2本目', true, '録音データ,写真データ', 4, '⭐', 'yellow', 'active'],
    ['L', '記事L', '企画記事L', true, '撮影データ', 5, '📄', 'purple', 'active'],
    ['M', '記事M', '企画記事M', true, '撮影データ', 6, '📄', 'purple', 'active'],
    ['C', '新規企業', '新規企業紹介ページ', true, '情報シート,写真データ', 7, '🏢', 'orange', 'active'],
    ['E', '既存企業', '既存企業紹介ページ', true, '情報シート,写真データ', 8, '🏢', 'orange', 'active'],
    ['P', 'パートナー一覧', 'パートナー一覧ページ', true, '写真データ', 9, '🤝', 'teal', 'active'],
    ['Z', '全体進捗', '全体の最終工程', false, '', 10, '✅', 'gray', 'active'],
    ['B', '全体調整', '全体のタイトル調整', false, '', 11, '🔧', 'gray', 'active'],
    ['F', '固定ページ', '固定コンテンツ', false, '', 12, '📋', 'gray', 'active'],
    ['J', 'STAR導入', 'STAR企画導入ページ', false, '', 13, '⭐', 'yellow', 'active'],
    ['N', '修正対応', '全体修正対応', false, '', 14, '🔨', 'red', 'active'],
    ['S', 'スタート', '企画決定・企画書作成', false, '', 15, '🚀', 'indigo', 'active']
  ];

  // ヘッダー書き込み
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4A90E2').setFontColor('#FFFFFF');

  // データ書き込み
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);

  // 列幅調整
  sheet.setColumnWidth(1, 100); // カテゴリID
  sheet.setColumnWidth(2, 150); // カテゴリ名
  sheet.setColumnWidth(3, 200); // 説明
  sheet.setColumnWidth(4, 120); // 確認送付必須
  sheet.setColumnWidth(5, 200); // 必要データ
  sheet.setColumnWidth(6, 80);  // 表示順
  sheet.setColumnWidth(7, 80);  // アイコン
  sheet.setColumnWidth(8, 100); // 色テーマ
  sheet.setColumnWidth(9, 100); // ステータス

  // 行の固定
  sheet.setFrozenRows(1);

  Logger.log('✅ カテゴリマスター作成完了（15カテゴリ）');
}

// ==================== 2. 企業マスター作成 ====================

/**
 * 企業マスター作成（6社テンプレート）
 */
function createCompanyMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存シートを削除
  let sheet = ss.getSheetByName('企業マスター');
  if (sheet) {
    ss.deleteSheet(sheet);
  }

  // 新規シート作成
  sheet = ss.insertSheet('企業マスター');

  // ヘッダー行
  const headers = [
    '企業ID', '企業名', '企業名（カナ）', '業種', '代表者名', '代表者名（英語）', '役職',
    'ロゴURL', '代表者写真URL', 'QR URL',
    'HP URL', '住所', '電話番号', 'メールアドレス',
    '社長あいさつ', '企業紹介',
    '社員の声1_名前', '社員の声1_役職', '社員の声1_コメント',
    '社員の声2_名前', '社員の声2_役職', '社員の声2_コメント',
    '社員の声3_名前', '社員の声3_役職', '社員の声3_コメント',
    '初掲載号', '最終更新号', 'ステータス', '備考'
  ];

  // サンプルデータ（6社のテンプレート）
  const data = [
    [
      'marutomo', '株式会社マルトモ', 'カブシキガイシャマルトモ', '食品製造', '山田太郎', 'taro-yamada', '代表取締役社長',
      'https://example.com/logo/marutomo.png', 'https://example.com/ceo/marutomo.jpg', 'https://example.com/qr/marutomo.png',
      'https://www.marutomo.co.jp', '愛知県名古屋市中区栄1-1-1', '052-XXX-XXXX', 'info@marutomo.co.jp',
      '弊社は創業以来、品質第一をモットーに...\n（ここに社長あいさつの長文を入力してください）',
      '株式会社マルトモは、食品製造業界で...\n（ここに企業紹介の長文を入力してください）',
      '佐藤花子', '営業部', '入社3年目ですが、とても働きやすい環境です...\n（コメント）',
      '鈴木一郎', '製造部', '毎日やりがいを持って仕事をしています...\n（コメント）',
      '田中美咲', '企画部', 'チームワークが良く、楽しく働いています...\n（コメント）',
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'sample-company-2', '【企業名2】', '', '【業種2】', '【代表者名2】', 'ceo-2', '代表取締役',
      '', '', '',
      '', '', '', '',
      '【社長あいさつ2】\n（ここに長文を入力）', '【企業紹介2】\n（ここに長文を入力）',
      '', '', '',
      '', '', '',
      '', '', '',
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'sample-company-3', '【企業名3】', '', '【業種3】', '【代表者名3】', 'ceo-3', '代表取締役',
      '', '', '',
      '', '', '', '',
      '【社長あいさつ3】', '【企業紹介3】',
      '', '', '',
      '', '', '',
      '', '', '',
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'sample-company-4', '【企業名4】', '', '【業種4】', '【代表者名4】', 'ceo-4', '代表取締役',
      '', '', '',
      '', '', '', '',
      '【社長あいさつ4】', '【企業紹介4】',
      '', '', '',
      '', '', '',
      '', '', '',
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'sample-company-5', '【企業名5】', '', '【業種5】', '【代表者名5】', 'ceo-5', '代表取締役',
      '', '', '',
      '', '', '', '',
      '【社長あいさつ5】', '【企業紹介5】',
      '', '', '',
      '', '', '',
      '', '', '',
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'sample-company-6', '【企業名6】', '', '【業種6】', '【代表者名6】', 'ceo-6', '代表取締役',
      '', '', '',
      '', '', '', '',
      '【社長あいさつ6】', '【企業紹介6】',
      '', '', '',
      '', '', '',
      '', '', '',
      '2024年10月号', '2025年11月号', 'active', ''
    ]
  ];

  // ヘッダー書き込み
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E67E22').setFontColor('#FFFFFF');

  // データ書き込み
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);

  // 列幅調整
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 150);
  }

  // 長文列は幅を広げる
  sheet.setColumnWidth(15, 300); // 社長あいさつ
  sheet.setColumnWidth(16, 300); // 企業紹介
  sheet.setColumnWidth(19, 250); // 社員の声1_コメント
  sheet.setColumnWidth(22, 250); // 社員の声2_コメント
  sheet.setColumnWidth(25, 250); // 社員の声3_コメント

  // 行の固定
  sheet.setFrozenRows(1);

  Logger.log('✅ 企業マスター作成完了（6社テンプレート）');
}

// ==================== 3. 作業アシストマスター作成 ====================

/**
 * 作業アシストマスター作成（6工程）
 */
function createWorkAssistMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存シートを削除
  let sheet = ss.getSheetByName('作業アシストマスター');
  if (sheet) {
    ss.deleteSheet(sheet);
  }

  // 新規シート作成
  sheet = ss.insertSheet('作業アシストマスター');

  // ヘッダー行
  const headers = [
    '工程No',
    'ツール名',
    'ツールURL',
    'プロンプトタイトル',
    'プロンプト内容',
    '説明'
  ];

  // プロンプト全文
  const prompt = `音声文字起こし：話者特定プロンプト

基本原則
音声を文字起こしする際は、以下のルールに従って話者を明確に特定してください。

話者ラベル
質問者：インタビューを進行する人
Aさん：回答者1（女性の場合は「Aさん」、男性の場合は必要に応じて「Aくん」）
Bくん：回答者2（男性）
Cくん：回答者3（男性）

文字起こしフォーマット
質問者：[発言内容]
Aさん：[発言内容]
Bくん：[発言内容]
Cくん：[発言内容]

話者特定の手がかり
声の特徴：音程、話し方、アクセントの違いに注目
発言内容の一貫性：同じ人物の体験談や意見は一貫している
呼びかけの方向：「あなたは？」などの質問の向き先
相づちのパターン：「うん」「はい」「そうですね」などの特徴
語尾や口調：「です・ます調」「だ・である調」「方言」など

特定困難な場合の対処法
話者が不明な短い相づちは [相づち] と表記
複数人が同時に話している場合は [複数人] と表記
聞き取り困難な部分は [不明瞭] と表記
話者推定が50%未満の場合は [話者不明] と表記

チェックポイント
✅ 各質問に対して3人全員が回答しているか確認
✅ 同一人物の発言に矛盾がないか確認
✅ 話者の切り替わりが明確にマークされているか確認
✅ 長い発言の途中で話者が変わっていないか確認

品質管理
文字起こし完了後、話者ごとに発言をまとめて内容の一貫性を確認
不自然な話者の切り替わりがある場合は再検討
質問への回答が論理的に対応しているか確認`;

  // データ（6工程）
  const data = [
    ['A-3', 'Google AI Studio', 'https://aistudio.google.com/prompts/new_chat', '音声文字起こし：話者特定', prompt, '複数人インタビューの話者特定用'],
    ['K-3', 'Google AI Studio', 'https://aistudio.google.com/prompts/new_chat', '音声文字起こし：話者特定', prompt, '複数人インタビューの話者特定用'],
    ['L-5', 'Google AI Studio', 'https://aistudio.google.com/prompts/new_chat', '音声文字起こし：話者特定', prompt, '複数人インタビューの話者特定用'],
    ['M-5', 'Google AI Studio', 'https://aistudio.google.com/prompts/new_chat', '音声文字起こし：話者特定', prompt, '複数人インタビューの話者特定用'],
    ['H-3', 'Google AI Studio', 'https://aistudio.google.com/prompts/new_chat', '音声文字起こし：話者特定', prompt, '複数人インタビューの話者特定用'],
    ['I-3', 'Google AI Studio', 'https://aistudio.google.com/prompts/new_chat', '音声文字起こし：話者特定', prompt, '複数人インタビューの話者特定用']
  ];

  // ヘッダー書き込み
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#9B59B6').setFontColor('#FFFFFF');

  // データ書き込み
  sheet.getRange(2, 1, data.length, data[0].length).setValues(data);

  // 列幅調整
  sheet.setColumnWidth(1, 100);  // 工程No
  sheet.setColumnWidth(2, 150);  // ツール名
  sheet.setColumnWidth(3, 300);  // ツールURL
  sheet.setColumnWidth(4, 200);  // プロンプトタイトル
  sheet.setColumnWidth(5, 500);  // プロンプト内容
  sheet.setColumnWidth(6, 200);  // 説明

  // 行の固定
  sheet.setFrozenRows(1);

  Logger.log('✅ 作業アシストマスター作成完了（6工程）');
}

// ==================== 4. 新工程マスタークリーンナップ ====================

/**
 * 新工程マスターのクリーンナップ
 * 工程名（B列）からカテゴリ情報を削除
 */
function cleanupProcessMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('新工程マスター');

  if (!sheet) {
    throw new Error('「新工程マスター」シートが見つかりません');
  }

  // データ範囲を取得（ヘッダー除く）
  const lastRow = sheet.getLastRow();
  const processNames = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // B列（工程名）

  // クリーンナップするパターン
  const patterns = [
    { find: 'メインインタビュー', replace: '' },
    { find: 'メイン', replace: '' },
    { find: 'インタビュー②', replace: '' },
    { find: 'STAR①', replace: '' },
    { find: 'STAR②', replace: '' },
    { find: 'STAR', replace: '' },
    { find: '記事L', replace: '' },
    { find: '記事M', replace: '' },
    { find: '新規企業', replace: '' },
    { find: '既存企業', replace: '' }
  ];

  let cleanedCount = 0;

  // 各工程名をクリーンナップ
  for (let i = 0; i < processNames.length; i++) {
    let processName = processNames[i][0];
    let originalName = processName;

    if (!processName) continue;

    // パターンマッチング
    for (const pattern of patterns) {
      if (processName.includes(pattern.find)) {
        processName = processName.replace(pattern.find, pattern.replace).trim();
      }
    }

    // 変更があった場合のみ更新
    if (processName !== originalName) {
      sheet.getRange(i + 2, 2).setValue(processName);
      cleanedCount++;
      Logger.log(`クリーンナップ: ${originalName} → ${processName}`);
    }
  }

  Logger.log(`✅ 新工程マスタークリーンナップ完了（${cleanedCount}件の工程名を修正）`);
}

// ==================== 完了チェック ====================

/**
 * Phase 0完了チェック
 */
function checkPhase0Completion() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();

  let report = '📋 Phase 0完了チェック\n\n';
  let allComplete = true;

  // 1. カテゴリマスターチェック
  const categorySheet = ss.getSheetByName('カテゴリマスター');
  if (categorySheet) {
    const categoryRows = categorySheet.getLastRow() - 1;
    report += `✅ カテゴリマスター: 存在（${categoryRows}カテゴリ）\n`;
    if (categoryRows < 15) {
      report += `   ⚠️ 15カテゴリ必要（現在${categoryRows}カテゴリ）\n`;
      allComplete = false;
    }
  } else {
    report += '❌ カテゴリマスター: 未作成\n';
    allComplete = false;
  }

  // 2. 企業マスターチェック
  const companySheet = ss.getSheetByName('企業マスター');
  if (companySheet) {
    const companyRows = companySheet.getLastRow() - 1;
    report += `✅ 企業マスター: 存在（${companyRows}社）\n`;
    if (companyRows < 6) {
      report += `   ⚠️ 6社必要（現在${companyRows}社）\n`;
      allComplete = false;
    }
  } else {
    report += '❌ 企業マスター: 未作成\n';
    allComplete = false;
  }

  // 3. 作業アシストマスターチェック
  const assistSheet = ss.getSheetByName('作業アシストマスター');
  if (assistSheet) {
    const assistRows = assistSheet.getLastRow() - 1;
    report += `✅ 作業アシストマスター: 存在（${assistRows}工程）\n`;
    if (assistRows < 6) {
      report += `   ⚠️ 6工程必要（現在${assistRows}工程）\n`;
      allComplete = false;
    }
  } else {
    report += '❌ 作業アシストマスター: 未作成\n';
    allComplete = false;
  }

  // 4. 新工程マスターチェック
  const processSheet = ss.getSheetByName('新工程マスター');
  if (processSheet) {
    report += '✅ 新工程マスター: 存在\n';
  } else {
    report += '❌ 新工程マスター: 未作成\n';
    allComplete = false;
  }

  // 完了判定
  report += '\n';
  if (allComplete) {
    report += '🎉 Phase 0完了！\n\n次のステップ: Phase 1（カテゴリ動的管理）の実装';
  } else {
    report += '⚠️ Phase 0未完了\n\n「Phase 0」メニューから「✅ 全シート自動作成」を実行してください';
  }

  ui.alert('Phase 0完了チェック', report, ui.ButtonSet.OK);
  Logger.log(report);
}
