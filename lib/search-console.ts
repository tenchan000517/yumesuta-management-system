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
