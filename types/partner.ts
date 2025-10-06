/**
 * パートナー・スターデータ管理 - 型定義
 */

// スター紹介データ（インタビュー回答）
export interface StarInterview {
  timestamp: string; // タイムスタンプ
  name: string; // お名前（漢字）
  nameKana: string; // おなまえ（ふりがな）
  organization: string; // 所属（企業や団体、コミュニティなど）
  position?: string; // 役職
  selfIntroduction: string; // 自己紹介
  motto: string; // 大切にしている言葉
  mainPhotoUrl: string; // メイン写真URL
  q1Dream: string; // Q.1 将来の夢や目標
  q2Focus: string; // Q.2 一番力を入れていること
  q3Motivation: string; // Q.3 やる気を維持する為にしていること
  q4Growth: string; // Q.4 「成長した」と感じた経験
  q5StudentLife: string; // Q.学生時代
  q6Challenge: string; // Q.今までに大きな壁
  q7NextChallenge: string; // Q.これから挑戦したいこと
  q8Future: string; // Q.今後の展望
  q9Message: string; // Q.若者へ伝えたい事
  questionPhotosUrl?: string; // 各質問の画像URL
  photoPreferences?: string; // 画像配置の希望
  email: string; // メールアドレス
}

// 検索・フィルタリング用パラメータ
export interface PartnerSearchParams {
  query?: string; // 検索キーワード（名前・所属で検索）
  organization?: string; // 所属フィルター
}

// API レスポンス型
export interface PartnerDataResponse {
  success: boolean;
  data?: {
    stars: StarInterview[];
    organizations: string[]; // 所属一覧（フィルター用）
    updatedAt: string;
  };
  error?: string;
}
