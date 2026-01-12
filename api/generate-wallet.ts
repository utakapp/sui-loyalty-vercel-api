import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
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
    // Generate new Ed25519 keypair
    const keypair = new Ed25519Keypair();

    // Get address
    const address = keypair.getPublicKey().toSuiAddress();

    // Export private key in suiprivkey format
    const privateKey = keypair.getSecretKey();
    const privateKeyBase64 = Buffer.from(privateKey).toString('base64');

    console.log('Generated new wallet:', address);

    return res.status(200).json({
      success: true,
      data: {
        address,
        privateKey: `suiprivkey1${privateKeyBase64}`,
        network: process.env.SUI_NETWORK || 'testnet',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error generating wallet:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
