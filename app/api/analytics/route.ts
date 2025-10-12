/**
 * Analytics API Route
 * Fetches data from Google Analytics, Search Console, and Microsoft Clarity
 */
import { NextResponse } from 'next/server';
import {
  getAnalyticsMetrics,
  getTopPages as getGATopPages,
  getTrafficSources,
  getLLMTraffic,
  getSearchEngineTraffic,
  getConversionEvents,
} from '@/lib/google-analytics';
import {
  getSearchPerformance,
  getTopQueries,
  getTopSearchPages,
} from '@/lib/search-console';
// import { getClarityMetrics } from '@/lib/microsoft-clarity'; // DISABLED: Rate limiting issues
import { AnalyticsData, SEOKPIMetrics } from '@/types/analytics';

/**
 * KPI計算ロジック: ブランドワード vs 一般ワード比率
 */
function calculateBrandKeywordRatio(topQueries: any[]): SEOKPIMetrics['brandKeywordRatio'] {
  const brandKeywords = [
    'ゆめスタ', 'ゆめすた', 'ユメスタ', '夢スタ', 'yumesuta',
    'ゆめマガ', 'ゆめまが', 'ユメマガ', '夢マガ', 'yumemaga'
  ];

  let brandClicks = 0;
  let nonBrandClicks = 0;

  topQueries.forEach(query => {
    const isBrand = brandKeywords.some(brand =>
      query.query.toLowerCase().includes(brand.toLowerCase())
    );

    if (isBrand) {
      brandClicks += query.clicks;
    } else {
      nonBrandClicks += query.clicks;
    }
  });

  const totalClicks = brandClicks + nonBrandClicks;
  const brandPercentage = totalClicks > 0 ? (brandClicks / totalClicks) * 100 : 0;
  const nonBrandPercentage = totalClicks > 0 ? (nonBrandClicks / totalClicks) * 100 : 0;

  return {
    brandClicks,
    nonBrandClicks,
    totalClicks,
    brandPercentage,
    nonBrandPercentage,
  };
}

/**
 * KPI計算ロジック: 重要キーワード抽出
 */
function extractTargetKeywords(topQueries: any[]): SEOKPIMetrics['targetKeywords'] {
  const targetKeywordPatterns = [
    '高卒採用',
    '就活情報誌',
    '高校生 就活',
    '高校生 就職',
    '愛知 高校生',
    '三重 高校生',
  ];

  return topQueries
    .filter(query =>
      targetKeywordPatterns.some(pattern =>
        query.query.toLowerCase().includes(pattern.toLowerCase())
      )
    )
    .map(query => ({
      keyword: query.query,
      position: query.position,
      clicks: query.clicks,
      impressions: query.impressions,
      ctr: query.ctr,
    }))
    .slice(0, 5); // 最大5件
}

/**
 * KPI計算ロジック: LLM流入状況
 */
function calculateLLMStatus(llmTraffic: any): SEOKPIMetrics['llmStatus'] {
  const breakdown = llmTraffic?.breakdown || [];

  const perplexity = breakdown.find((s: any) => s.source.includes('perplexity'));
  const chatgpt = breakdown.find((s: any) =>
    s.source.includes('chatgpt') || s.source.includes('chat.openai') || s.source.includes('chat.com')
  );
  const gemini = breakdown.find((s: any) =>
    s.source.includes('gemini') || s.source.includes('ai.com') || s.source.includes('bard')
  );
  const claude = breakdown.find((s: any) => s.source.includes('claude'));

  const knownSessions =
    (perplexity?.sessions || 0) +
    (chatgpt?.sessions || 0) +
    (gemini?.sessions || 0) +
    (claude?.sessions || 0);

  const otherSessions = (llmTraffic?.totalSessions || 0) - knownSessions;

  return {
    totalSessions: llmTraffic?.totalSessions || 0,
    perplexitySessions: perplexity?.sessions || 0,
    chatGPTSessions: chatgpt?.sessions || 0,
    geminiSessions: gemini?.sessions || 0,
    claudeSessions: claude?.sessions || 0,
    otherSessions: otherSessions > 0 ? otherSessions : 0,
  };
}

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
        const [metrics, topPages, trafficSources, llmTraffic, searchEngineTraffic] = await Promise.all([
          getAnalyticsMetrics(gaPropertyId, `${days}daysAgo`, 'today'),
          getGATopPages(gaPropertyId, `${days}daysAgo`, 'today', 10),
          getTrafficSources(gaPropertyId, `${days}daysAgo`, 'today', 10),
          getLLMTraffic(gaPropertyId, startDateStr, endDateStr),
          getSearchEngineTraffic(gaPropertyId, startDateStr, endDateStr),
        ]);

        analyticsData.googleAnalytics = {
          metrics,
          topPages,
          trafficSources,
          llmTraffic,
          searchEngineTraffic,
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
    // ⚠️ DISABLED: Clarity API has rate limiting issues
    // try {
    //   const clarityToken = process.env.CLARITY_API_TOKEN;

    //   if (clarityToken) {
    //     // Clarity API only supports 1-3 days
    //     const clarityDays = Math.min(days, 3) as 1 | 2 | 3;
    //     const numOfDays = clarityDays.toString() as '1' | '2' | '3';

    //     const clarityData = await getClarityMetrics(
    //       clarityToken,
    //       numOfDays,
    //       'Country' // Example dimension
    //     );

    //     // Clarity might return null if rate limited
    //     if (clarityData) {
    //       analyticsData.clarity = clarityData;
    //     } else {
    //       console.warn('Clarity API unavailable (rate limited or error). Skipping Clarity metrics.');
    //     }
    //   }
    // } catch (error) {
    //   console.error('Microsoft Clarity API error:', error);
    //   // Continue even if Clarity fails
    // }
    console.log('Clarity API is disabled due to rate limiting issues.');

    // Calculate KPI metrics
    if (analyticsData.searchConsole && analyticsData.googleAnalytics) {
      const brandKeywordRatio = calculateBrandKeywordRatio(
        analyticsData.searchConsole.topQueries
      );

      const targetKeywords = extractTargetKeywords(
        analyticsData.searchConsole.topQueries
      );

      const llmStatus = calculateLLMStatus(analyticsData.googleAnalytics.llmTraffic);

      // KGI targets (基準: 月間30日)
      const baseTargetSessions = 500; // 月間目標セッション数
      const baseTargetInquiries = 10; // 月間目標お問い合わせ数
      const targetConversionRate = 2.0; // 目標CV率 (%)

      // 期間に応じて目標値を按分 (days変数を使用)
      const targetSessions = Math.round((baseTargetSessions / 30) * days);
      const targetInquiries = Math.round((baseTargetInquiries / 30) * days);

      // 現在の実績
      const currentSessions = analyticsData.googleAnalytics.metrics.sessions;

      // お問い合わせ数をGA4イベントから取得
      // イベント名は環境変数で設定可能（デフォルト: generate_lead）
      const gaPropertyId = process.env.GA_PROPERTY_ID;
      const conversionEventName = process.env.GA4_CONVERSION_EVENT_NAME || 'generate_lead';
      let currentInquiries = 0;
      if (gaPropertyId) {
        try {
          currentInquiries = await getConversionEvents(
            gaPropertyId,
            conversionEventName,
            startDateStr,
            endDateStr
          );
        } catch (error) {
          console.error('Failed to fetch conversion events:', error);
          // エラーの場合は0件として扱う
          currentInquiries = 0;
        }
      }

      const currentConversionRate = currentSessions > 0
        ? (currentInquiries / currentSessions) * 100
        : 0;

      analyticsData.kpiMetrics = {
        brandKeywordRatio,
        targetKeywords,
        llmStatus,
        kgi: {
          sessions: currentSessions,
          targetSessions,
          sessionAchievementRate: (currentSessions / targetSessions) * 100,
          inquiries: currentInquiries,
          targetInquiries,
          inquiryAchievementRate: (currentInquiries / targetInquiries) * 100,
          conversionRate: currentConversionRate,
          targetConversionRate,
        },
      };
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
