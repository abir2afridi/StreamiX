interface ValidationResult {
  valid: boolean;
  status: number;
  contentType: string;
  latencyMs: number;
  healthScore: number;
  qualityScore: number;
}

export async function validateStreamUrl(url: string, timeoutMs = 3000): Promise<ValidationResult> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: controller.signal,
    });
    
    clearTimeout(id);
    
    const latency = Date.now() - start;
    const contentType = response.headers.get('content-type') || 'unknown';
    const status = response.status;
    const valid = response.ok;

    // Calculate score based on response and latency
    let healthScore = 0;
    if (valid) {
      if (latency < 500) {
        healthScore = 95;
      } else if (latency < 1200) {
        healthScore = 85;
      } else {
        healthScore = 70;
      }
    } else {
      if (status === 403 || status === 401) {
        // Token required/expired
        healthScore = 30;
      } else {
        healthScore = 10;
      }
    }

    // Determine quality rating (simple auto-derivation)
    let qualityScore = 70;
    if (url.toLowerCase().includes('hd') || url.includes('1080') || url.includes('/tracks-v1') || url.includes('master.m3u8')) {
      qualityScore = 90;
    } else if (url.toLowerCase().includes('4k')) {
      qualityScore = 98;
    }

    return {
      valid,
      status,
      contentType,
      latencyMs: latency,
      healthScore,
      qualityScore,
    };
  } catch (error: any) {
    const latency = Date.now() - start;
    return {
      valid: false,
      status: error.name === 'AbortError' ? 408 : 500,
      contentType: 'none',
      latencyMs: latency,
      healthScore: 0,
      qualityScore: 0,
    };
  }
}
