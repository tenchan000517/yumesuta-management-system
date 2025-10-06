/**
 * パートナー画像リネーム・配置スクリプト
 *
 * 機能:
 * 1. Google Sheetsからパートナーデータ取得
 * 2. raw/フォルダから画像読み込み
 * 3. 命名規則に従ってリネーム
 * 4. processed/フォルダに配置
 * 5. 画像URLをGoogle Sheetsに保存
 *
 * 使用方法:
 * node scripts/process-partner-images.js
 */

const fs = require('fs');
const path = require('path');
const { getSheetData, updateSheetData } = require('../lib/google-sheets');

// 設定
const SPREADSHEET_ID = process.env.PARTNERS_SPREADSHEET_ID;
const RANGE = 'パートナーDB!A2:Z100';
const BASE_URL = 'https://yumesuta.com/partner-images';

const RAW_DIR = path.join(__dirname, '../public/partner-images/raw');
const PROCESSED_DIR = path.join(__dirname, '../public/partner-images/processed');

// ディレクトリ作成
const ensureDirectories = () => {
  const dirs = [
    path.join(PROCESSED_DIR, 'pertnerlogo'),
    path.join(PROCESSED_DIR, 'yumestapertner'),
    path.join(PROCESSED_DIR, 'qr')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// 日本語名から英語IDを生成（簡易版）
const nameToId = (name) => {
  // 実際には適切なローマ字変換が必要
  // ここでは仮実装
  const romanMap = {
    '錦見': 'nishimi',
    '裕介': 'yusuke',
    '若山': 'wakayama',
    '和彦': 'kazuhiko',
    // ... 他のマッピングを追加
  };

  return name.split(/\s+/).map(part => romanMap[part] || part.toLowerCase()).join('-');
};

// ファイル名生成
const generateFileName = (partnerId, type, personName, originalExt) => {
  switch(type) {
    case 'logo':
      return `${partnerId}-logo${originalExt}`;
    case 'person':
      const personId = nameToId(personName);
      return `${partnerId}-${personId}.avif`;
    case 'qr':
      return `${partnerId}-qr.png`;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
};

// 画像リネーム・移動
const processImage = (rawFileName, type, partnerId, personName = '') => {
  if (!rawFileName) return null;

  const rawPath = path.join(RAW_DIR, rawFileName);

  if (!fs.existsSync(rawPath)) {
    console.warn(`⚠️  画像が見つかりません: ${rawFileName}`);
    return null;
  }

  const ext = path.extname(rawFileName);
  const newFileName = generateFileName(partnerId, type, personName, ext);

  let destDir;
  let urlPath;

  switch(type) {
    case 'logo':
      destDir = path.join(PROCESSED_DIR, 'pertnerlogo');
      urlPath = 'pertnerlogo';
      break;
    case 'person':
      destDir = path.join(PROCESSED_DIR, 'yumestapertner');
      urlPath = 'yumestapertner';
      break;
    case 'qr':
      destDir = path.join(PROCESSED_DIR, 'qr');
      urlPath = 'qr';
      break;
  }

  const destPath = path.join(destDir, newFileName);

  // ファイルコピー
  fs.copyFileSync(rawPath, destPath);

  const url = `${BASE_URL}/${urlPath}/${newFileName}`;

  console.log(`✅ ${rawFileName} → ${newFileName}`);

  return url;
};

// メイン処理
async function main() {
  console.log('🚀 パートナー画像処理を開始します...\n');

  try {
    // ディレクトリ確認
    ensureDirectories();

    // Google Sheetsからデータ取得
    console.log('📊 Google Sheetsからデータ取得中...');
    const data = await getSheetData(SPREADSHEET_ID, RANGE);

    if (!data || data.length === 0) {
      console.log('❌ データが見つかりませんでした');
      return;
    }

    // ヘッダー行から列インデックス取得（仮定）
    // 実際のシート構造に合わせて調整が必要
    const headers = [
      '企業ID', '企業名', '代表者名', '役職', 'パートナータイプ',
      '元画像_ロゴ', '元画像_代表者', '元画像_QR',
      'ロゴURL', '代表者写真URL', 'QR_URL'
    ];

    const updates = [];

    // 各行を処理
    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      const partnerId = row[0]; // 企業ID
      const companyName = row[1]; // 企業名
      const personName = row[2]; // 代表者名
      const rawLogoFile = row[5]; // 元画像_ロゴ
      const rawPersonFile = row[6]; // 元画像_代表者
      const rawQRFile = row[7]; // 元画像_QR

      if (!partnerId) continue;

      console.log(`\n📦 処理中: ${companyName} (${partnerId})`);

      // 画像処理
      const logoUrl = processImage(rawLogoFile, 'logo', partnerId);
      const personUrl = processImage(rawPersonFile, 'person', partnerId, personName);
      const qrUrl = processImage(rawQRFile, 'qr', partnerId);

      // 更新データ準備
      if (logoUrl || personUrl || qrUrl) {
        updates.push({
          row: i + 2, // ヘッダー行を考慮（A2から開始）
          logoUrl: logoUrl || row[8] || '',
          personUrl: personUrl || row[9] || '',
          qrUrl: qrUrl || row[10] || ''
        });
      }
    }

    // Google Sheetsに画像URL保存
    if (updates.length > 0) {
      console.log('\n📝 Google Sheetsに画像URLを保存中...');

      for (const update of updates) {
        const range = `パートナーDB!I${update.row}:K${update.row}`;
        const values = [[update.logoUrl, update.personUrl, update.qrUrl]];

        await updateSheetData(SPREADSHEET_ID, range, values);
      }

      console.log(`✅ ${updates.length}件のURLを保存しました`);
    }

    console.log('\n🎉 画像処理が完了しました！');
    console.log('\n📤 次のステップ:');
    console.log('1. public/partner-images/processed/ フォルダを確認');
    console.log('2. Xserverの /partner-images/ にアップロード');
    console.log('3. スタートプロンプトを実行してyumesutaHPを更新');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (require.main === module) {
  main();
}

module.exports = { processImage, generateFileName };
