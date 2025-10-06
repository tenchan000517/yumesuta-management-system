/**
 * Analytics data types for HP・LLMO分析管理
 */

// Google Analytics metrics
export interface GoogleAnalyticsMetrics {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
  averageSessionDuration: number;
  bounceRate: number;
}

export interface TopPage {
  pagePath: string;
  pageTitle: string;
  views: number;
  users: number;
}

export interface TrafficSource {
  source: string;
  medium: string;
  sessions: number;
  users: number;
}

export interface LLMTrafficData {
  totalSessions: number;
  totalUsers: number;
  breakdown: Array<{
    source: string;
    sessions: number;
    users: number;
  }>;
}

export interface SearchEngineTraffic {
  total: number;
  breakdown: Array<{
    source: string;
    sessions: number;
  }>;
}

export interface KeywordRanking {
  keyword: string;
  position: number;
  previousPosition?: number;
  change?: number;
  trend?: 'up' | 'down' | 'same' | 'new';
  clicks: number;
  impressions: number;
  ctr: number;
  priority: 'high' | 'medium' | 'low';
  targetPosition: number;
}

// Google Search Console metrics
export interface SearchConsoleMetrics {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface TopSearchPage {
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

// Microsoft Clarity metrics
export interface ClarityMetrics {
  sessions: number;
  avgScrollDepth: number;
  avgTimeOnPage: number;
  rageclicks: number;
  deadclicks: number;
  quickbacks: number;
}

export interface ClarityDimension {
  dimension: string;
  sessions: number;
  avgScrollDepth: number;
  rageclicks: number;
  deadclicks: number;
  quickbacks: number;
}

// KPI Tracking for SEO/LLMO improvement
export interface SEOKPIMetrics {
  // 一般ワード vs ブランドワード分析
  brandKeywordRatio: {
    brandClicks: number;
    nonBrandClicks: number;
    totalClicks: number;
    brandPercentage: number; // ブランドワードの割合
    nonBrandPercentage: number; // 一般ワードの割合
  };

  // 重要キーワード順位追跡
  targetKeywords: Array<{
    keyword: string;
    position: number;
    clicks: number;
    impressions: number;
    ctr: number;
  }>;

  // KGI指標
  kgi: {
    sessions: number;
    targetSessions: number; // 目標セッション数
    sessionAchievementRate: number; // 達成率

    // お問い合わせ数（手動入力想定、将来的にGA4イベントから取得）
    inquiries: number;
    targetInquiries: number;
    inquiryAchievementRate: number;

    // コンバージョン率
    conversionRate: number;
    targetConversionRate: number;
  };

  // LLM流入状況
  llmStatus: {
    totalSessions: number;
    perplexitySessions: number;
    chatGPTSessions: number;
    geminiSessions: number;
    claudeSessions: number;
    otherSessions: number;
  };
}

// Combined analytics data
export interface AnalyticsData {
  googleAnalytics: {
    metrics: GoogleAnalyticsMetrics;
    topPages: TopPage[];
    trafficSources: TrafficSource[];
    llmTraffic?: LLMTrafficData;
    searchEngineTraffic?: SearchEngineTraffic;
  } | null;
  searchConsole: {
    metrics: SearchConsoleMetrics;
    topQueries: TopQuery[];
    topPages: TopSearchPage[];
    keywordRankings?: KeywordRanking[];
  } | null;
  clarity: {
    metrics: ClarityMetrics;
    breakdown?: ClarityDimension[];
  } | null;
  lastUpdated: string;
  // KPI計算結果を追加
  kpiMetrics?: SEOKPIMetrics;
}
