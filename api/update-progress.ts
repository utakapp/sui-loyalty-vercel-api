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
    const { badgeId, progress } = req.body;

    // Validate inputs
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: badgeId'
      });
    }

    if (progress === undefined || progress === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: progress'
      });
    }

    const progressNum = parseInt(progress);
    if (isNaN(progressNum) || progressNum < 0 || progressNum > 100) {
      return res.status(400).json({
        success: false,
        error: 'Progress must be a number between 0 and 100'
      });
    }

    // Create Sui client
    const suiClient = createSuiClientFromEnv();

    // Update progress on blockchain
    console.log(`Updating progress for badge ${badgeId} to ${progressNum}%`);
    const result = await suiClient.updateProgress(badgeId, progressNum);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to update progress'
      });
    }

    // Return success
    return res.status(200).json({
      success: true,
      data: {
        badgeId,
        progress: progressNum,
        digest: result.digest
      }
    });
  } catch (error: any) {
    console.error('Error in update-progress handler:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
}
