// data/information-form-template.ts
// 情報収集フォーマットのテンプレート

export const informationFormTemplate = `
【◎基本情報】(※すべて必須入力)

企業名・団体名:
代表者役職:
代表者名:
住所:〒
電話番号:
メールアドレス:

送信先担当者名:
送信先メールアドレス:

契約締結日: 令和　年　月　日

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎掲載プラン】

契約料金（税別）:             円/年
自動更新後の月額料金（税別）:             円/月

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎掲載期間】

掲載開始: 令和　年　月号
掲載終了: 令和　年　月号（12ヶ月間）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎広告仕様】

掲載サイズ:
掲載位置:
デザイン形式:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎送付設定】

基本契約書の送付: □ 有  □ 無
申込書の送付:     □ 有  □ 無

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【◎請求書情報】(※後で請求書作成時に使用)

支払期限: 令和　年　月　日
`.trim();

export interface InformationFormData {
  // 基本情報
  companyName: string;
  representativeTitle: string;
  representativeName: string;
  address: string;
  phone: string;
  email: string;
  contactPerson: string;
  contactEmail: string;
  contractDate: string;

  // 掲載プラン
  annualFee: string;
  monthlyFee: string;

  // 掲載期間
  publicationStart: string;
  publicationEnd: string;

  // 広告仕様
  adSize: string;
  adPosition: string;
  designFormat: string;

  // 送付設定
  sendBasicContract: 'yes' | 'no';
  sendApplicationForm: 'yes' | 'no';

  // 請求書情報
  paymentDeadline: string;
}
