const FIRECRAWL_API = 'https://api.firecrawl.dev/v1/scrape';

export async function scrapeProduct(url: string, apiKey: string): Promise<string> {
  const response = await fetch(FIRECRAWL_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
      waitFor: 5000,
      timeout: 60000,
      actions: [
        { type: 'wait', milliseconds: 3000 },
        { type: 'scrape' },
      ],
    }),
    signal: AbortSignal.timeout(90000),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || '스크래핑에 실패했습니다');
  }

  return data.data.markdown || '';
}
