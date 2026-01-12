import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createSuiClientFromEnv } from '../lib/sui-client';
import { verifyAuth, getCorsHeaders } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', '*').end();
  }

  // Set CORS headers
  const corsHeaders = getCorsHeaders(req.headers.origin as string);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use GET.'
    });
  }

  // Verify authentication
  if (!verifyAuth(req)) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized. Invalid or missing API key.'
    });
  }

  try {
    // Create Sui client
    const suiClient = createSuiClientFromEnv();

    // Get address and balance
    const address = suiClient.getAddress();
    const balance = await suiClient.getBalance();

    // Return connection info
    return res.status(200).json({
      success: true,
      data: {
        network: process.env.SUI_NETWORK || 'testnet',
        address,
        balance: `${parseInt(balance) / 1_000_000_000} SUI`,
        packageId: process.env.PACKAGE_ID,
        adminCapId: process.env.ADMIN_CAP_ID,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error in test handler:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
