import redis from "../config/redis";

const CACHE_TTL = 3600; // 1 hour in seconds

// Type the API responses
interface ConvertResponse {
  result?: number;
  success?: boolean;
}

interface FallbackResponse {
  result?: string;
  rates?: Record<string, number>;
}

/**
 * Fetch exchange rate with Redis caching.
 * Uses exchangerate.host free API (no key needed).
 * Falls back to 1.0 if same currency or on error.
 */
export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from.toUpperCase() === to.toUpperCase()) return 1;

  const cacheKey = `rate:${from.toUpperCase()}:${to.toUpperCase()}`;

  try {
    // Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return parseFloat(cached);
    }
  } catch (err) {
    console.error("Redis read error for exchange rate:", err);
  }

  try {
    const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=1`;
    const response = await fetch(url);
    const data = (await response.json()) as ConvertResponse;

    if (data && data.result) {
      const rate = data.result;

      // Cache in Redis
      try {
        await redis.set(cacheKey, rate.toString(), "EX", CACHE_TTL);
      } catch (err) {
        console.error("Redis write error for exchange rate:", err);
      }

      return rate;
    }

    // Fallback: try alternative free API
    const fallbackUrl = `https://open.er-api.com/v6/latest/${from}`;
    const fallbackRes = await fetch(fallbackUrl);
    const fallbackData = (await fallbackRes.json()) as FallbackResponse;

    if (fallbackData && fallbackData.rates && fallbackData.rates[to.toUpperCase()]) {
      const rate = fallbackData.rates[to.toUpperCase()];
      try {
        await redis.set(cacheKey, rate.toString(), "EX", CACHE_TTL);
      } catch (err) {
        console.error("Redis write error:", err);
      }
      return rate;
    }

    console.warn(`Could not fetch rate ${from}->${to}, defaulting to 1`);
    return 1;
  } catch (err) {
    console.error("Exchange rate API error:", err);
    return 1;
  }
}

/**
 * Convert amount from one currency to another.
 */
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  const rate = await getExchangeRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}