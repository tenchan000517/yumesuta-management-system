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
  dimension3?: string,
  retries = 3,
  delayMs = 1000
): Promise<{
  summary: ClarityMetrics;
  breakdown?: ClarityDimension[];
} | null> {
  const params = new URLSearchParams({
    numOfDays,
  });

  if (dimension1) params.append('dimension1', dimension1);
  if (dimension2) params.append('dimension2', dimension2);
  if (dimension3) params.append('dimension3', dimension3);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(
        `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params}`,
        {
          headers: {
            Authorization: `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        if (attempt < retries) {
          const waitTime = delayMs * Math.pow(2, attempt);
          console.warn(`Clarity API rate limit hit. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          console.error('Clarity API rate limit exceeded after all retries. Returning null.');
          return null;
        }
      }

      if (!response.ok) {
        throw new Error(`Clarity API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return parseData(data);
    } catch (error) {
      if (attempt === retries) {
        console.error('Clarity API request failed after all retries:', error);
        return null;
      }
      const waitTime = delayMs * Math.pow(2, attempt);
      console.warn(`Clarity API error. Retrying in ${waitTime}ms... (attempt ${attempt + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  return null;
}

function parseData(data: any): {
  summary: ClarityMetrics;
  breakdown?: ClarityDimension[];
} {

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
