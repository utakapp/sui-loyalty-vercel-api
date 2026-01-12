import type { VercelRequest, VercelResponse } from '@vercel/node';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
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

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
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
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: address'
      });
    }

    // Validate Sui address format
    if (!isValidSuiAddress(address)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Sui address format'
      });
    }

    // Initialize Sui Client
    const network = (process.env.SUI_NETWORK || 'testnet') as 'mainnet' | 'testnet' | 'devnet';
    const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl(network);
    const client = new SuiClient({ url: rpcUrl });

    // Get balance
    const balanceResult = await client.getBalance({
      owner: address
    });

    // Convert from MIST to SUI (1 SUI = 1,000,000,000 MIST)
    const balanceInSui = parseInt(balanceResult.totalBalance) / 1_000_000_000;

    console.log('Balance check for', address, ':', balanceInSui, 'SUI');

    return res.status(200).json({
      success: true,
      data: {
        address,
        balance: balanceInSui.toString(),
        balanceRaw: balanceResult.totalBalance,
        coinType: balanceResult.coinType,
        network,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error getting balance:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}

/**
 * Validate Sui address format
 */
function isValidSuiAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(address);
}
