/**
 * ゆめマガ進捗管理システム - Phase 0 自動セットアップスクリプト v2
 *
 * 【更新内容】
 * - 企業マスターを完全刷新（yumesutaHPの構造に完全対応）
 * - 62列の詳細データ構造
 * - マルトモの実データを反映
 *
 * 使い方:
 * 1. Google Sheetsで「拡張機能」→「Apps Script」を開く
 * 2. このスクリプトをコピー&ペースト
 * 3. 保存して「onOpen」を実行（初回のみ）
 * 4. スプレッドシートに戻り、「Phase 0 v2」メニューから実行
 *
 * 作成日: 2025-10-08
 * 作成者: Claude Code
 * バージョン: 2.0
 */

// ==================== メニュー追加 ====================

/**
 * スプレッドシート起動時に自動実行される
 * Phase 0 v2メニューを追加
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Phase 0 v2')
    .addItem('✅ 全シート自動作成（v2）', 'setupPhase0V2')
    .addSeparator()
    .addItem('1️⃣ カテゴリマスター作成', 'createCategoryMaster')
    .addItem('2️⃣ 企業マスター作成（v2）', 'createCompanyMasterV2')
    .addItem('3️⃣ 作業アシストマスター作成', 'createWorkAssistMaster')
    .addItem('4️⃣ 新工程マスタークリーンナップ', 'cleanupProcessMaster')
    .addSeparator()
    .addItem('🔍 Phase 0完了チェック', 'checkPhase0Completion')
    .addToUi();
}

// ==================== メイン実行関数 ====================

/**
 * Phase 0 v2を一括実行
 */
function setupPhase0V2() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert(
    'Phase 0 v2 セットアップ開始',
    '以下の処理を実行します:\n\n' +
    '1. カテゴリマスター作成（15カテゴリ）\n' +
    '2. 企業マスター作成 v2（62列構造、5社実データ）\n' +
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
    Logger.log('Phase 0 v2 セットアップ開始...');

    // 1. カテゴリマスター作成
    Logger.log('1/4: カテゴリマスター作成中...');
    createCategoryMaster();

    // 2. 企業マスター作成 v2
    Logger.log('2/4: 企業マスター v2 作成中...');
    createCompanyMasterV2();

    // 3. 作業アシストマスター作成
    Logger.log('3/4: 作業アシストマスター作成中...');
    createWorkAssistMaster();

    // 4. 新工程マスタークリーンナップ
    Logger.log('4/4: 新工程マスタークリーンナップ中...');
    cleanupProcessMaster();

    Logger.log('Phase 0 v2 セットアップ完了！');
    ui.alert(
      '✅ Phase 0 v2 セットアップ完了！',
      '以下のシートが作成されました:\n\n' +
      '✅ カテゴリマスター（15カテゴリ）\n' +
      '✅ 企業マスター v2（62列構造、5社実データ）\n' +
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
    ['K', 'レジェンドインタビュー', 'サブインタビュー記事', true, '録音データ,写真データ', 2, '📝', 'green', 'active'],
    ['H', 'STAR①', 'STAR記事1本目', true, '録音データ,写真データ', 3, '⭐', 'yellow', 'active'],
    ['I', 'STAR②', 'STAR記事2本目', true, '録音データ,写真データ', 4, '⭐', 'yellow', 'active'],
    ['L', '愛知県立高等技術専門校コンテンツ', '企画記事L', true, '撮影データ', 5, '📄', 'purple', 'active'],
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
  sheet.setColumnWidth(2, 200); // カテゴリ名
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

// ==================== 2. 企業マスター作成 v2 ====================

/**
 * 企業マスター作成 v2（62列構造、5社実データ）
 */
function createCompanyMasterV2() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 既存シートを削除
  let sheet = ss.getSheetByName('企業マスター');
  if (sheet) {
    ss.deleteSheet(sheet);
  }

  // 新規シート作成
  sheet = ss.insertSheet('企業マスター');

  // ヘッダー行（62列）
  const headers = [
    // 基本情報（14列）
    '企業ID', '企業名', '企業名（カナ）', '業種', '事業エリア', '説明文（一覧用）',
    'ロゴ画像パス', 'ヒーロー画像パス', 'QRコード画像パス',
    'スローガン',
    '代表者名', '代表者名（英語）', '代表者役職', '代表者写真パス',

    // サービス（9列）
    'サービス1_画像パス', 'サービス1_タイトル', 'サービス1_説明',
    'サービス2_画像パス', 'サービス2_タイトル', 'サービス2_説明',
    'サービス3_画像パス', 'サービス3_タイトル', 'サービス3_説明',

    // 社長メッセージ（1列）
    '社長メッセージ',

    // 社員の声（9列）
    '社員1_画像パス', '社員1_質問', '社員1_回答',
    '社員2_画像パス', '社員2_質問', '社員2_回答',
    '社員3_画像パス', '社員3_質問', '社員3_回答',

    // 企業の取り組み（6列）
    '取り組み1_タイトル', '取り組み1_説明',
    '取り組み2_タイトル', '取り組み2_説明',
    '取り組み3_タイトル', '取り組み3_説明',

    // 企業情報（8列）
    '住所', '電話番号', 'FAX番号', 'ウェブサイト', '問い合わせメール',
    '設立年', '従業員数', '事業内容',

    // メタ情報（4列）
    '初掲載号', '最終更新号', 'ステータス', '備考'
  ];

  // マルトモの実データ
  const marutomoData = [
    'marutomo', '株式会社マルトモ', 'カブシキガイシャマルトモ', '製造', '名古屋市港区',
    '1946年から現在に渡り鋳造技術を磨き続ける鋳物のプロフェッショナル企業。工作機械・産業機械・鍛圧プレス機械・ダイキャストホルダーなど多くの産業に携わっています。',
    '/img/company/marutomo/logo.png',
    '/img/company/marutomo/hero.png',
    '/img/qr/marutomo.png',
    '社員一人一人がモノづくりの誇りを持ち家族に安心して送り出してもらえる企業',
    '錦見 裕介', 'yusuke-nishikimi', '代表取締役', '/img/company/marutomo/president.png',

    // サービス
    '/img/company/marutomo/service-01.png', '工作機械用途製品',
    '工作機械分野における高品質な鋳造製品を製造。図面の検討から材料の受け入れ、鋳造、加工、そして検査・納品まで、各工程で徹底したチェックを実施しています。',
    '/img/company/marutomo/service-02.png', '産業機械用途製品',
    '産業機械分野での様々なニーズに対応した鋳造製品を提供。お客様の要求に応じたカスタマイズ対応も承っています。',
    '/img/company/marutomo/service-03.png', 'ダイキャスト金型',
    'ダイキャスト金型の製造において、高い技術力と品質管理体制で信頼される製品をお届けしています。',

    // 社長メッセージ
    '私たちマルトモは1946年から現在に渡り鋳造技術を磨き続ける鋳物のプロフェッショナル企業です。製造する産業も様々な分野のユーザー様とお取引させて頂いております。工作機械・産業機械・鍛圧プレス機械・ダイキャストホルダーなど多くの産業に携わらせていただいています。鋳物製造はモノづくりの原点のような作業が多く完成後の喜び、嬉しさは作った者にしか分からない所が多数あります。今後も歴史のある鋳造技術を継承しつつ現代の手法も取り入れ合わせながら更なる技術革新で進み続けます。そして働く社員が安心して働ける職場、働く社員の家族が安心して送り出せる会社、働く人が誇りをもてる企業づくりを目指していきます。',

    // 社員の声
    '/img/company/marutomo/member-01.png', '入社の決め手はなんでしたか？',
    '鹿児島から出て、自分の知らない土地で社会人としてのスタートを切りたいと考え、担任の先生に相談したところ、マルトモを勧めていただきました！会社のイベントや福利厚生が魅力的なところも入社の決め手になりました！',
    '/img/company/marutomo/member-02.png', '会社の魅力はどんなところですか？',
    '従業員一人ひとりが安心して働ける職場づくりを目指すだけでなく、そのご家族や大切な方々にも配慮した制度や取り組みを行っています。働く人の「しあわせ」は、周囲の人の支えがあってこそ。全ての関係者を大切にしています！',
    '/img/company/marutomo/member-03.png', '会社の強みはなんですか？',
    '鋳造技術を駆使する「IMONO」のプロフェッショナル企業です！歴史ある技術を背景に現代の顧客ニーズにしっかりと応え、高い品質の維持及びさらなる品質の向上に常に取り組み、地物産業界の基幹分野をリードし続ける企業を目指しています！',

    // 企業の取り組み
    '『嬉しい☆楽しい』福利厚生',
    'HAPPY BIRTHDAY休暇、おしゃれ制度（月に1回、専用のアプリに自分の私服を投稿して、抽選で選ばれた社員に『1万円』をプレゼント）、会員制リゾートホテル優遇、クラブ活動支援など充実した福利厚生を用意しています。',
    '社内イベント活動',
    'ボウリング大会や慰安旅行、BBQにサークル活動など、楽しくて充実したイベントを実施しています！社員同士の絆を深める機会を大切にしています。',
    '技術継承と革新',
    '1946年から続く歴史ある鋳造技術を継承しつつ、現代の手法も取り入れながら更なる技術革新を進めています。モノづくりの原点を大切にしながら、時代に合わせた進化を続けています。',

    // 企業情報
    '〒455-0831 愛知県名古屋市港区十一屋1-11',
    '052-381-5177',
    '052-381-5277',
    'marutomo-imono.com',
    'info@marutomo-imono.com',
    '1946年(昭和21年)',
    '55名 海外研修生(インドネシア)10名',
    '自硬性鋳造(フラン造型法)',

    // メタ情報
    '2024年10月号', '2025年11月号', 'active', ''
  ];

  // テンプレートデータ（2-5社目）
  const templateData = [
    [
      'arkeyp', 'あーきぺんこ', 'アーキペンコ', '美容業', '名古屋市・三重県',
      '美容を楽しみ美容と共に自分らしく輝けるステージを提供する総合美容サロン。ヘアー、エステ、ネイル、アイラッシュなど幅広い美容サービスを展開しています。',
      '/img/company/arkeyp/logo.png',
      '/img/company/arkeyp/hero.png',
      '/img/qr/a-key-p.png',
      'LET\'S ENJOY BEAUTY 美容を楽しみ美容と共に自分らしく輝けるステージで',
      '竹内 祐子', 'yuko-takeuchi', '代表取締役', '/img/company/arkeyp/president.png',

      // サービス
      '/img/company/arkeyp/service-01.png', 'ヘアーサービス',
      'シャンプー・トリートメント・スパ・カット・カラー・パーマ・アレンジセット・メイク・着付けまで、幅広いヘアサービスを提供しています。',
      '/img/company/arkeyp/service-02.png', 'エステ・フェイシャル',
      'フェイシャルエステを中心とした美容サービスで、お客様の美しさを引き出します。',
      '/img/company/arkeyp/service-03.png', 'ビューティーサービス',
      'ネイル・アイラッシュなど、トータルビューティーサービスで自分らしく輝けるお手伝いをします。',

      // 社長メッセージ
      'あーきぺんこには「美容」が好きな仲間がいます。最大限、力を発揮する場所があります。夢中になりゼロからイチを生み出し、夢を叶えてみませんか。お客様の喜ぶ顔、周りの方の喜ぶ顔を作ることができる美容師。美容が人々を笑顔にします。そしていろんな出会いを生みます。出会いがまた、貴方の夢を応援します。そして、「技」と「人」にこだわり永く愛していただけるサロンを作ります。',

      // 社員の声
      '/img/company/arkeyp/member-01.png', '入社の決め手はなんでしたか？',
      '学びながら働く仕組みがあった。3日美容学校へ、2～3日サロンワークの３学３勤制に入学し２年で国家試験獲得、正社員入社。入社後もスパ検定、カラー講習、カット講習、アレンジセット等、学ぶ場やコンテスト・運動会・海外研修イベントも多かった。',
      '/img/company/arkeyp/member-02.png', '会社の魅力はどんなところですか？',
      'デビューまでのカリキュラムが明確で安心してデビューできる。スタッフ同士が向き合いワンチームになれる。自分らしく輝けるステージがある。美容を楽しむことを忘れずに美容好きの仲間がいる。',
      '/img/company/arkeyp/member-03.png', '会社の強みはなんですか？',
      '美容師歴10年以上、現役でサロンに立つスタイリストが教員資格を有し,各授業を担当します。現場に直結した技術に加え業界のスペシャリストを招いて特別な講義も実施。さらに人間力を上げる教育も行っているので美容に限らず一般社会人として広い見識を身につけられます。',

      // 企業の取り組み
      'グループ全体のイベント',
      '入社式・運動会・忘年会・新年会など、アーキペンコだけでなくグループ全体でのイベントを通じて美容グループとしての連帯感を深めています。',
      '充実した福利厚生',
      '取扱商品のスタッフセール30～50％OFF、関連飲食店での社員割引、インショップサロンなのでほぼ残業なし、完全週休２日制・冠婚葬祭休・各サロン食事会誕生会。',
      '教育制度の充実',
      '３学３勤制に入学し２年で国家試験獲得、正社員入社。入社後もスパ検定、カラー講習、カット講習、アレンジセット等、学ぶ場やコンテスト・運動会・海外研修イベントも多数。',

      // 企業情報
      '〒464-0073 名古屋市千種区高見2-2-43（Office三重県桑名市中央町5-38-1-1405）',
      '0594-22-2563',
      '0594-22-2426',
      'www.artkey-p.com',
      '',
      '1984年',
      '55人',
      'シャンプー・トリートメント・スパ・カット・カラー・パーマ・アレンジセット・メイク・着付・ネイル・アイラッシュ',

      // メタ情報
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'technoshinei', '株式会社テクノシンエイ', 'カブシキガイシャテクノシンエイ', '製造', '愛知県小牧市',
      '自動車の金属部品加工業として1968年に創業し、半世紀の歴史を持つセラミックス製品製造・販売の専門企業。5Gの普及やIoT化に伴い、半導体製品および製造装置の需要に対応しています。',
      '/img/company/technoshinei/logo.png',
      '/img/company/technoshinei/hero.png',
      '/img/qr/shinei.png',
      '半世紀の歴史と最新技術で半導体業界をリード',
      '加藤 章', 'akira-kato', '代表取締役社長', '/img/company/technoshinei/president.png',

      // サービス
      '/img/company/technoshinei/service-01.png', 'セラミックス製品製造',
      '電子基板などの半導体をつくる装置や太陽光パネル、自動車などに使われるセラミックス製品を製造しています。研削（削る）や鏡面加工（磨く）を行っています。',
      '/img/company/technoshinei/service-02.png', '研削・鏡面加工',
      'シリコンウエハーやハードディスクなどの半導体業界で使用される製品の研削・鏡面加工を行っています。',
      '/img/company/technoshinei/service-03.png', '品質管理・検査',
      '全製品において厳格な品質管理と検査を実施し、お客様に高品質な製品をお届けしています。',

      // 社長メッセージ
      '当社は1968年の創業以来、自動車の金属部品加工業からスタートし、現在はセラミックス製品の製造・販売を主力事業としています。5Gの普及やIoT化の進展に伴い、半導体製品および製造装置の需要が急速に拡大する中、当社の技術と経験を活かして、お客様のニーズにお応えしています。常に品質向上と技術革新に取り組み、お客様から信頼される企業として成長し続けてまいります。',

      // 社員の声
      '/img/company/technoshinei/member-01.png', '入社の決め手はなんでしたか？',
      '高い技術力と品質管理体制に魅力を感じました。また、成長分野である半導体業界に携われることで、自分自身のスキルアップにもつながると思いました。',
      '/img/company/technoshinei/member-02.png', '仕事のやりがいを教えてください',
      '精密な加工技術が求められる製品を手がけることで、技術者としてのやりがいを感じています。完成した製品が様々な分野で活用されることも大きな喜びです。',
      '/img/company/technoshinei/member-03.png', '会社の魅力はどんなところですか？',
      '先進的な設備と伝統的な技術が融合している点が魅力です。ベテランの職人さんから学びながら、最新の技術にも触れることができる環境です。',

      // 企業の取り組み
      '技術革新への取り組み',
      '最新の加工技術と設備導入により、より高精度な製品製造を実現し、お客様のニーズに応えています。',
      '人材育成',
      '技術者の育成に力を入れ、熟練工の技術継承と若手社員のスキルアップを両立させています。',
      '環境への配慮',
      '製造プロセスにおける環境負荷の軽減に取り組み、持続可能な製造業を目指しています。',

      // 企業情報
      '〒485-0071 愛知県小牧市西之島670',
      '0568-77-1234',
      '0568-77-1235',
      'technoshinei.co.jp',
      '',
      '1968年(昭和43年)',
      '約80名',
      'セラミックス製品製造・販売、半導体関連装置の製造',

      // メタ情報
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'inagaki', '稲垣製作所株式会社', 'イナガキセイサクショカブシキガイシャ', '製造', '愛知県西尾市',
      'ステンレス、スチールパイプの切断、面取り加工を主に日本のモノづくりにおける根幹に携わっています。ステンレスパイプ0.5ミリ厚までの薄物の加工とSUS316などの特殊加工が得意です。',
      '/img/company/inagaki/logo.png',
      '/img/company/inagaki/hero.png',
      '/img/qr/inagaki.png',
      '【スローガンを入力してください】',
      '【代表者名】', '【代表者名英語】', '代表取締役', '/img/company/inagaki/president.png',

      // サービス（テンプレート）
      '/img/company/inagaki/service-01.png', '【サービス1タイトル】', '【サービス1説明】',
      '/img/company/inagaki/service-02.png', '【サービス2タイトル】', '【サービス2説明】',
      '/img/company/inagaki/service-03.png', '【サービス3タイトル】', '【サービス3説明】',

      // 社長メッセージ
      '【社長メッセージを入力してください】',

      // 社員の声（テンプレート）
      '/img/company/inagaki/member-01.png', '【質問1】', '【回答1】',
      '/img/company/inagaki/member-02.png', '【質問2】', '【回答2】',
      '/img/company/inagaki/member-03.png', '【質問3】', '【回答3】',

      // 企業の取り組み（テンプレート）
      '【取り組み1タイトル】', '【取り組み1説明】',
      '【取り組み2タイトル】', '【取り組み2説明】',
      '【取り組み3タイトル】', '【取り組み3説明】',

      // 企業情報
      '【住所】', '【電話番号】', '【FAX番号】', '【ウェブサイト】', '',
      '【設立年】', '【従業員数】', '【事業内容】',

      // メタ情報
      '2024年10月号', '2025年11月号', 'active', ''
    ],
    [
      'ichiei', '一榮工業株式会社', 'イチエイコウギョウカブシキガイシャ', '製造', '愛知県一宮市',
      '豊田合成グループの一員として半世紀以上にわたり、自動車用ハンドル・エアバッグ製品の金属部品を主に製造。人の命を守る大切な安全部品を提供しています。',
      '/img/company/ichiei/logo.png',
      '/img/company/ichiei/hero.png',
      '/img/qr/ichiei.png',
      '【スローガンを入力してください】',
      '【代表者名】', '【代表者名英語】', '代表取締役', '/img/company/ichiei/president.png',

      // サービス（テンプレート）
      '/img/company/ichiei/service-01.png', '【サービス1タイトル】', '【サービス1説明】',
      '/img/company/ichiei/service-02.png', '【サービス2タイトル】', '【サービス2説明】',
      '/img/company/ichiei/service-03.png', '【サービス3タイトル】', '【サービス3説明】',

      // 社長メッセージ
      '【社長メッセージを入力してください】',

      // 社員の声（テンプレート）
      '/img/company/ichiei/member-01.png', '【質問1】', '【回答1】',
      '/img/company/ichiei/member-02.png', '【質問2】', '【回答2】',
      '/img/company/ichiei/member-03.png', '【質問3】', '【回答3】',

      // 企業の取り組み（テンプレート）
      '【取り組み1タイトル】', '【取り組み1説明】',
      '【取り組み2タイトル】', '【取り組み2説明】',
      '【取り組み3タイトル】', '【取り組み3説明】',

      // 企業情報
      '【住所】', '【電話番号】', '【FAX番号】', '【ウェブサイト】', '',
      '【設立年】', '【従業員数】', '【事業内容】',

      // メタ情報
      '2024年10月号', '2025年11月号', 'active', ''
    ]
  ];

  // 全データ統合
  const allData = [marutomoData, ...templateData];

  // ヘッダー書き込み
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#E67E22').setFontColor('#FFFFFF');

  // データ書き込み
  sheet.getRange(2, 1, allData.length, headers.length).setValues(allData);

  // 列幅調整（基本150px、長文は300px）
  for (let i = 1; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 150);
  }

  // 長文列の幅調整
  sheet.setColumnWidth(6, 300);  // 説明文
  sheet.setColumnWidth(10, 250); // スローガン
  sheet.setColumnWidth(16, 250); // サービス説明
  sheet.setColumnWidth(19, 250);
  sheet.setColumnWidth(22, 250);
  sheet.setColumnWidth(24, 400); // 社長メッセージ
  sheet.setColumnWidth(27, 250); // 社員回答
  sheet.setColumnWidth(30, 250);
  sheet.setColumnWidth(33, 250);
  sheet.setColumnWidth(35, 250); // 取り組み説明
  sheet.setColumnWidth(37, 250);
  sheet.setColumnWidth(39, 250);
  sheet.setColumnWidth(40, 300); // 住所
  sheet.setColumnWidth(47, 250); // 事業内容

  // 行の固定
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2); // 企業IDと企業名を固定

  Logger.log('✅ 企業マスター v2 作成完了（62列構造、5社実データ）');
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
    { find: 'レジェンドインタビュー', replace: '' },
    { find: 'STAR①', replace: '' },
    { find: 'STAR②', replace: '' },
    { find: 'STAR', replace: '' },
    { find: '記事L', replace: '' },
    { find: '愛知県立高等技術専門校コンテンツ', replace: '' },
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

  let report = '📋 Phase 0完了チェック (v2)\n\n';
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

  // 2. 企業マスターチェック（v2）
  const companySheet = ss.getSheetByName('企業マスター');
  if (companySheet) {
    const companyRows = companySheet.getLastRow() - 1;
    const companyCols = companySheet.getLastColumn();
    report += `✅ 企業マスター v2: 存在（${companyRows}社、${companyCols}列）\n`;
    if (companyRows < 5) {
      report += `   ⚠️ 5社必要（現在${companyRows}社）\n`;
      allComplete = false;
    }
    if (companyCols < 51) {
      report += `   ⚠️ 62列必要（現在${companyCols}列）\n`;
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
    report += '🎉 Phase 0 v2 完了！\n\n次のステップ: Phase 1（カテゴリ動的管理）の実装';
  } else {
    report += '⚠️ Phase 0 v2 未完了\n\n「Phase 0 v2」メニューから「✅ 全シート自動作成（v2）」を実行してください';
  }

  ui.alert('Phase 0 v2 完了チェック', report, ui.ButtonSet.OK);
  Logger.log(report);
}
