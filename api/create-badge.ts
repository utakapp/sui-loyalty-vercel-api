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
    // Parse request body
    const { studentName, courseId, studentAddress } = req.body;

    // Validate inputs
    if (!studentName || !courseId || !studentAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: studentName, courseId, studentAddress'
      });
    }

    // Create Sui client
    const suiClient = createSuiClientFromEnv();

    // Create badge on blockchain
    console.log(`Creating badge for ${studentName} (${courseId}) -> ${studentAddress}`);
    const result = await suiClient.createBadge(studentName, courseId, studentAddress);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to create badge'
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      data: {
        badgeId: result.badgeId,
        digest: result.digest,
        studentName,
        courseId,
        studentAddress
      }
    });
  } catch (error: any) {
    console.error('Error in create-badge handler:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
