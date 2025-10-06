/**
 * Analytics API Route
 * Fetches data from Google Analytics, Search Console, and Microsoft Clarity
 */
import { NextResponse } from 'next/server';
import {
  getAnalyticsMetrics,
  getTopPages as getGATopPages,
  getTrafficSources,
} from '@/lib/google-analytics';
import {
  getSearchPerformance,
  getTopQueries,
  getTopSearchPages,
} from '@/lib/search-console';
import { getClarityMetrics } from '@/lib/microsoft-clarity';
import { AnalyticsData } from '@/types/analytics';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const analyticsData: AnalyticsData = {
      googleAnalytics: null,
      searchConsole: null,
      clarity: null,
      lastUpdated: new Date().toISOString(),
    };

    // Fetch Google Analytics data
    try {
      const gaPropertyId = process.env.GA_PROPERTY_ID;

      if (gaPropertyId) {
        const [metrics, topPages, trafficSources] = await Promise.all([
          getAnalyticsMetrics(gaPropertyId, `${days}daysAgo`, 'today'),
          getGATopPages(gaPropertyId, `${days}daysAgo`, 'today', 10),
          getTrafficSources(gaPropertyId, `${days}daysAgo`, 'today', 10),
        ]);

        analyticsData.googleAnalytics = {
          metrics,
          topPages,
          trafficSources,
        };
      }
    } catch (error) {
      console.error('Google Analytics API error:', error);
      // Continue with other APIs even if GA fails
    }

    // Fetch Google Search Console data
    try {
      const siteUrl = process.env.SEARCH_CONSOLE_SITE_URL;

      if (siteUrl) {
        const [metrics, topQueries, topPages] = await Promise.all([
          getSearchPerformance(siteUrl, startDateStr, endDateStr),
          getTopQueries(siteUrl, startDateStr, endDateStr, 10),
          getTopSearchPages(siteUrl, startDateStr, endDateStr, 10),
        ]);

        analyticsData.searchConsole = {
          metrics,
          topQueries,
          topPages,
        };
      }
    } catch (error) {
      console.error('Search Console API error:', error);
      // Continue with other APIs even if Search Console fails
    }

    // Fetch Microsoft Clarity data
    try {
      const clarityToken = process.env.CLARITY_API_TOKEN;

      if (clarityToken) {
        // Clarity API only supports 1-3 days
        const clarityDays = Math.min(days, 3) as 1 | 2 | 3;
        const numOfDays = clarityDays.toString() as '1' | '2' | '3';

        const clarityData = await getClarityMetrics(
          clarityToken,
          numOfDays,
          'Country' // Example dimension
        );

        analyticsData.clarity = clarityData;
      }
    } catch (error) {
      console.error('Microsoft Clarity API error:', error);
      // Continue even if Clarity fails
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
    });
  } catch (error: any) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch analytics data',
      },
      { status: 500 }
    );
  }
}
