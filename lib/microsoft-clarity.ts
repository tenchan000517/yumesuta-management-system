/**
 * Microsoft Clarity Data Export API Client
 */

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

/**
 * Get Clarity project live insights
 * Note: Limited to 10 requests per project per day
 */
export async function getClarityMetrics(
  apiToken: string,
  numOfDays: '1' | '2' | '3' = '1',
  dimension1?: string,
  dimension2?: string,
  dimension3?: string
): Promise<{
  summary: ClarityMetrics;
  breakdown?: ClarityDimension[];
}> {
  const params = new URLSearchParams({
    numOfDays,
  });

  if (dimension1) params.append('dimension1', dimension1);
  if (dimension2) params.append('dimension2', dimension2);
  if (dimension3) params.append('dimension3', dimension3);

  const response = await fetch(
    `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Clarity API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Parse the summary metrics
  const summary: ClarityMetrics = {
    sessions: data.sessions || 0,
    avgScrollDepth: data.avgScrollDepth || 0,
    avgTimeOnPage: data.avgTimeOnPage || 0,
    rageclicks: data.rageclicks || 0,
    deadclicks: data.deadclicks || 0,
    quickbacks: data.quickbacks || 0,
  };

  // Parse dimension breakdown if dimensions were requested
  let breakdown: ClarityDimension[] | undefined;
  if (data.breakdown && Array.isArray(data.breakdown)) {
    breakdown = data.breakdown.map((item: any) => ({
      dimension: item.dimension || '',
      sessions: item.sessions || 0,
      avgScrollDepth: item.avgScrollDepth || 0,
      rageclicks: item.rageclicks || 0,
      deadclicks: item.deadclicks || 0,
      quickbacks: item.quickbacks || 0,
    }));
  }

  return {
    summary,
    breakdown,
  };
}
