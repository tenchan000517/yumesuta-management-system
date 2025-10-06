/**
 * Google Analytics Data API Client
 */
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Initialize the Analytics Data API client
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient() {
  if (!analyticsDataClient) {
    // Use service account credentials from environment variable
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
      throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
    }

    const credentials = JSON.parse(serviceAccountKey);

    if (!credentials.client_email || !credentials.private_key) {
      throw new Error('Invalid service account credentials: missing client_email or private_key');
    }

    analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
    });
  }

  return analyticsDataClient;
}

export interface AnalyticsMetrics {
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

/**
 * Get overall analytics metrics for a date range
 */
export async function getAnalyticsMetrics(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<AnalyticsMetrics> {
  const client = getAnalyticsClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
    ],
  });

  const row = response.rows?.[0];

  return {
    activeUsers: parseInt(row?.metricValues?.[0]?.value || '0'),
    sessions: parseInt(row?.metricValues?.[1]?.value || '0'),
    screenPageViews: parseInt(row?.metricValues?.[2]?.value || '0'),
    averageSessionDuration: parseFloat(row?.metricValues?.[3]?.value || '0'),
    bounceRate: parseFloat(row?.metricValues?.[4]?.value || '0'),
  };
}

/**
 * Get top pages by views
 */
export async function getTopPages(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today',
  limit: number = 10
): Promise<TopPage[]> {
  const client = getAnalyticsClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'pagePath' },
      { name: 'pageTitle' },
    ],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'activeUsers' },
    ],
    limit,
    orderBys: [
      {
        metric: {
          metricName: 'screenPageViews',
        },
        desc: true,
      },
    ],
  });

  return (response.rows || []).map(row => ({
    pagePath: row.dimensionValues?.[0]?.value || '',
    pageTitle: row.dimensionValues?.[1]?.value || '',
    views: parseInt(row.metricValues?.[0]?.value || '0'),
    users: parseInt(row.metricValues?.[1]?.value || '0'),
  }));
}

/**
 * Get traffic sources
 */
export async function getTrafficSources(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today',
  limit: number = 50
): Promise<TrafficSource[]> {
  const client = getAnalyticsClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
    ],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
    ],
    limit,
    orderBys: [
      {
        metric: {
          metricName: 'sessions',
        },
        desc: true,
      },
    ],
  });

  return (response.rows || []).map(row => ({
    source: row.dimensionValues?.[0]?.value || '',
    medium: row.dimensionValues?.[1]?.value || '',
    sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    users: parseInt(row.metricValues?.[1]?.value || '0'),
  }));
}

/**
 * LLM Traffic Data
 */
export interface LLMTrafficData {
  totalSessions: number;
  totalUsers: number;
  breakdown: Array<{
    source: string;
    sessions: number;
    users: number;
  }>;
}

/**
 * Get LLM traffic (ChatGPT, Perplexity, Gemini, etc.)
 */
export async function getLLMTraffic(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<LLMTrafficData> {
  const client = getAnalyticsClient();

  // List of known LLM referrers (2024年版・確定済み)
  const llmSources = [
    // OpenAI ChatGPT
    'chatgpt.com',        // 現在のメインドメイン (2024年5月～)
    'chat.openai.com',    // 旧ドメイン (リダイレクト)
    'chat.com',           // 新ショートカットドメイン (2024年11月～)

    // Perplexity AI
    'perplexity.ai',      // ✅ 既に流入あり (2セッション確認済み)

    // Google Gemini
    'gemini.google.com',  // メインドメイン
    'ai.com',             // ショートカットドメイン
    'bard.google.com',    // 旧名称 (Bardからの移行)

    // Anthropic Claude
    'claude.ai',          // メインドメイン

    // その他のAI検索
    'you.com',            // You.com AI検索
    'phind.com',          // 開発者向けAI検索
  ];

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'sessionSource' }],
    metrics: [
      { name: 'sessions' },
      { name: 'activeUsers' },
    ],
    dimensionFilter: {
      filter: {
        fieldName: 'sessionSource',
        inListFilter: {
          values: llmSources,
        },
      },
    },
  });

  let totalSessions = 0;
  let totalUsers = 0;
  const breakdown: Array<{ source: string; sessions: number; users: number }> = [];

  (response.rows || []).forEach(row => {
    const source = row.dimensionValues?.[0]?.value || '';
    const sessions = parseInt(row.metricValues?.[0]?.value || '0');
    const users = parseInt(row.metricValues?.[1]?.value || '0');

    totalSessions += sessions;
    totalUsers += users;
    breakdown.push({ source, sessions, users });
  });

  return {
    totalSessions,
    totalUsers,
    breakdown,
  };
}

/**
 * Get search engine traffic breakdown (Google, Yahoo, Bing)
 */
export async function getSearchEngineTraffic(
  propertyId: string,
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<{ total: number; breakdown: Array<{ source: string; sessions: number }> }> {
  const client = getAnalyticsClient();

  const searchEngines = ['google', 'yahoo', 'bing'];

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: 'sessionSource' },
      { name: 'sessionMedium' },
    ],
    metrics: [{ name: 'sessions' }],
    dimensionFilter: {
      andGroup: {
        expressions: [
          {
            filter: {
              fieldName: 'sessionSource',
              inListFilter: {
                values: searchEngines,
              },
            },
          },
          {
            filter: {
              fieldName: 'sessionMedium',
              stringFilter: {
                matchType: 'EXACT',
                value: 'organic',
              },
            },
          },
        ],
      },
    },
  });

  let total = 0;
  const breakdown: Array<{ source: string; sessions: number }> = [];

  (response.rows || []).forEach(row => {
    const source = row.dimensionValues?.[0]?.value || '';
    const sessions = parseInt(row.metricValues?.[0]?.value || '0');

    total += sessions;
    breakdown.push({ source, sessions });
  });

  return { total, breakdown };
}

/**
 * Get conversion events (contact form submissions, inquiries, etc.)
 *
 * @param propertyId - GA4 Property ID
 * @param eventName - Event name (e.g., 'contact_form_submit', 'generate_lead')
 * @param startDate - Start date (format: YYYY-MM-DD or '30daysAgo')
 * @param endDate - End date (format: YYYY-MM-DD or 'today')
 * @returns Number of conversion events
 *
 * @example
 * // お問い合わせフォーム送信数を取得
 * const inquiries = await getConversionEvents(propertyId, 'contact_form_submit', '7daysAgo', 'today');
 */
export async function getConversionEvents(
  propertyId: string,
  eventName: string = 'contact_form_submit',
  startDate: string = '30daysAgo',
  endDate: string = 'today'
): Promise<number> {
  const client = getAnalyticsClient();

  const [response] = await client.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: {
          matchType: 'EXACT',
          value: eventName,
        },
      },
    },
  });

  // イベントが1件も発生していない場合は0を返す
  if (!response.rows || response.rows.length === 0) {
    return 0;
  }

  const eventCount = parseInt(response.rows[0].metricValues?.[0]?.value || '0');
  return eventCount;
}
