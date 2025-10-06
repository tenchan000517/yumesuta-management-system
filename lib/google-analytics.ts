/**
 * Google Analytics Data API Client
 */
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Initialize the Analytics Data API client
let analyticsDataClient: BetaAnalyticsDataClient | null = null;

function getAnalyticsClient() {
  if (!analyticsDataClient) {
    // Use service account credentials from environment variable
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

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
  limit: number = 10
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
