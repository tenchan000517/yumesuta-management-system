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

// Combined analytics data
export interface AnalyticsData {
  googleAnalytics: {
    metrics: GoogleAnalyticsMetrics;
    topPages: TopPage[];
    trafficSources: TrafficSource[];
  } | null;
  searchConsole: {
    metrics: SearchConsoleMetrics;
    topQueries: TopQuery[];
    topPages: TopSearchPage[];
  } | null;
  clarity: {
    metrics: ClarityMetrics;
    breakdown?: ClarityDimension[];
  } | null;
  lastUpdated: string;
}
