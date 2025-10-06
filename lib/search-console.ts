/**
 * Google Search Console API Client
 */
import { google } from 'googleapis';
import { searchconsole_v1 } from 'googleapis';

// Initialize the Search Console API client
let searchConsoleClient: searchconsole_v1.Searchconsole | null = null;

function getSearchConsoleClient() {
  if (!searchConsoleClient) {
    // Use service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: credentials.client_email,
        private_key: credentials.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    searchConsoleClient = google.searchconsole({
      version: 'v1',
      auth,
    });
  }

  return searchConsoleClient;
}

export interface SearchPerformance {
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

/**
 * Get overall search performance metrics
 */
export async function getSearchPerformance(
  siteUrl: string,
  startDate: string,
  endDate: string
): Promise<SearchPerformance> {
  const client = getSearchConsoleClient();

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
    },
  });

  const row = response.data.rows?.[0];

  return {
    clicks: row?.clicks || 0,
    impressions: row?.impressions || 0,
    ctr: row?.ctr || 0,
    position: row?.position || 0,
  };
}

/**
 * Get top search queries
 */
export async function getTopQueries(
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopQuery[]> {
  const client = getSearchConsoleClient();

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: limit,
    },
  });

  return (response.data.rows || []).map(row => ({
    query: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * Get top pages by search performance
 */
export async function getTopSearchPages(
  siteUrl: string,
  startDate: string,
  endDate: string,
  limit: number = 10
): Promise<TopSearchPage[]> {
  const client = getSearchConsoleClient();

  const response = await client.searchanalytics.query({
    siteUrl,
    requestBody: {
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: limit,
    },
  });

  return (response.data.rows || []).map(row => ({
    page: row.keys?.[0] || '',
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

/**
 * 重要キーワードの定義
 */
export const IMPORTANT_KEYWORDS = [
  { keyword: 'ゆめスタ', priority: 'high', targetPosition: 1 },
  { keyword: 'ゆめマガ', priority: 'high', targetPosition: 5 },
  { keyword: '高校生 就職 愛知', priority: 'high', targetPosition: 10 },
  { keyword: '就活情報誌', priority: 'medium', targetPosition: 15 }, // 実際の検索クエリに合わせて変更
  { keyword: '高卒採用 三重', priority: 'medium', targetPosition: 20 },
  { keyword: '高校生 就職情報誌', priority: 'medium', targetPosition: 15 },
  { keyword: '愛知 高校生 求人', priority: 'medium', targetPosition: 20 },
  { keyword: '東海 高校生 就職', priority: 'low', targetPosition: 30 },
] as const;

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

/**
 * Get rankings for important keywords
 *
 * @param siteUrl - Search Console property URL
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @param previousStartDate - Previous period start date for comparison (optional)
 * @param previousEndDate - Previous period end date for comparison (optional)
 * @returns Array of keyword rankings with trend data
 */
export async function getImportantKeywordRankings(
  siteUrl: string,
  startDate: string,
  endDate: string,
  previousStartDate?: string,
  previousEndDate?: string
): Promise<KeywordRanking[]> {
  const client = getSearchConsoleClient();
  const results: KeywordRanking[] = [];

  // Get current period data
  for (const { keyword, priority, targetPosition } of IMPORTANT_KEYWORDS) {
    try {
      const response = await client.searchanalytics.query({
        siteUrl,
        requestBody: {
          startDate,
          endDate,
          dimensions: ['query'],
          dimensionFilterGroups: [
            {
              filters: [
                {
                  dimension: 'query',
                  operator: 'equals',
                  expression: keyword,
                },
              ],
            },
          ],
          rowLimit: 1,
        },
      });

      const data = response.data.rows?.[0];
      const currentPosition = data?.position || 999; // 999 if not ranked
      const clicks = data?.clicks || 0;
      const impressions = data?.impressions || 0;
      const ctr = data?.ctr || 0;

      // Get previous period data if provided
      let previousPosition: number | undefined;
      if (previousStartDate && previousEndDate) {
        try {
          const prevResponse = await client.searchanalytics.query({
            siteUrl,
            requestBody: {
              startDate: previousStartDate,
              endDate: previousEndDate,
              dimensions: ['query'],
              dimensionFilterGroups: [
                {
                  filters: [
                    {
                      dimension: 'query',
                      operator: 'equals',
                      expression: keyword,
                    },
                  ],
                },
              ],
              rowLimit: 1,
            },
          });

          previousPosition = prevResponse.data.rows?.[0]?.position || 999;
        } catch (error) {
          console.error(`Failed to fetch previous data for keyword: ${keyword}`, error);
        }
      }

      // Calculate trend
      let change: number | undefined;
      let trend: 'up' | 'down' | 'same' | 'new' | undefined;

      if (previousPosition !== undefined) {
        if (currentPosition === 999 && previousPosition === 999) {
          trend = 'same'; // Not ranked in both periods
          change = 0;
        } else if (previousPosition === 999) {
          trend = 'new'; // Newly ranked
          change = 0;
        } else if (currentPosition === 999) {
          trend = 'down'; // Dropped out
          change = previousPosition - currentPosition; // Negative large number
        } else {
          change = previousPosition - currentPosition; // Positive = improved
          trend = change > 0 ? 'up' : change < 0 ? 'down' : 'same';
        }
      }

      results.push({
        keyword,
        position: currentPosition,
        previousPosition,
        change,
        trend,
        clicks,
        impressions,
        ctr,
        priority,
        targetPosition,
      });
    } catch (error) {
      console.error(`Failed to fetch ranking for keyword: ${keyword}`, error);
      // Add placeholder data
      results.push({
        keyword,
        position: 999,
        clicks: 0,
        impressions: 0,
        ctr: 0,
        priority,
        targetPosition,
      });
    }
  }

  return results;
}
