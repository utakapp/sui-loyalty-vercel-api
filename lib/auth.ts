import type { VercelRequest } from '@vercel/node';

/**
 * Verify API request authentication
 */
export function verifyAuth(req: VercelRequest): boolean {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  const expectedKey = process.env.API_SECRET_KEY;

  if (!expectedKey) {
    console.error('API_SECRET_KEY not configured');
    return false;
  }

  if (!apiKey) {
    console.error('No API key provided in request');
    return false;
  }

  return apiKey === expectedKey;
}

/**
 * CORS headers for responses
 */
export function getCorsHeaders(origin?: string) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-API-Key, Authorization',
    'Access-Control-Max-Age': '86400'
  };
}
