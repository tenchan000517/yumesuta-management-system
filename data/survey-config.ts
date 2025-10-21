/**
 * アンケートフォーム設定ファイル
 *
 * 毎月この設定を更新することで、新しい月号のアンケートフォームを生成できます。
 *
 * 更新手順:
 * 1. 新しい月号のキーを追加（例: "2025年12月号"）
 * 2. formId: Google FormsのフォームID
 * 3. companies: 掲載企業リスト（選択肢として表示）
 * 4. pages: ページ構成リスト（選択肢として表示）
 * 5. entryIds: Google FormsのEntry IDマッピング（フォームごとに固定）
 */

export interface SurveyConfig {
  formId: string;
  companies: string[];
  pages: string[];
  entryIds: {
    grade: string;
    department: string;
    career: string;
    impressivePage: string;
    readability: string;
    layout: string;
    goodPoints: string;
    priorKnowledge: string;
    interestedCompanies: string;
    wantToKnow: string;
    improvements: string;
  };
}

export const surveyConfig: Record<string, SurveyConfig> = {
  "2025年11月号": {
    // Google FormsのフォームID
    formId: "1FAIpQLSelBRWebphO8n9HvtlnxRX1wAUZrz-FoixOno1475Brp7tajw",

    // 掲載企業（Q9で使用）
    companies: [
      "一榮工業株式会社",
      "株式会社マルトモ",
      "稲垣製作所株式会社",
      "株式会社テクノシンエイ",
      "あーきぺんこ",
      "(有)林工業所",
      "特になし"
    ],

    // ページ構成（Q4で使用）
    pages: [
      "P4: 表紙のインタビュー（桑名北高校 村上 萌さん）",
      "P6: レジェンドインタビュー（トニー中田さん）",
      "P10: パートナー企業紹介",
      "P22: 名古屋技術高等専門校「ゆめのカタチが見える教室」",
      "P24 STAR（先輩インタビュー）",
      "P30: 愛知県警察「闇バイトは犯罪」",
      "P32: ゆめスタ認証パートナー",
      "特になし"
    ],

    // Google Forms Entry IDマッピング
    entryIds: {
      grade: "entry.762273264",           // Q1: 学年
      department: "entry.1744920093",     // Q2: 学科
      career: "entry.1180439209",         // Q3: 進路
      impressivePage: "entry.1969847884", // Q4: 印象ページ
      readability: "entry.775604085",     // Q5: 読みやすさ
      layout: "entry.614638240",          // Q6: レイアウト
      goodPoints: "entry.397659507",      // Q7: 良かったポイント
      priorKnowledge: "entry.677878870",  // Q8: 読前認知度
      interestedCompanies: "entry.2097864546", // Q9: 興味企業（複数選択）
      wantToKnow: "entry.451268394",      // Q10: 知りたい情報（複数選択）
      improvements: "entry.69182948"      // Q11: 改善点（任意）
    }
  }
};

/**
 * 月号のリストを取得
 */
export function getAvailableIssues(): string[] {
  return Object.keys(surveyConfig);
}

/**
 * 指定された月号の設定を取得
 */
export function getSurveyConfig(issue: string): SurveyConfig | null {
  return surveyConfig[issue] || null;
}
