import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';

export interface SuiConfig {
  network: 'mainnet' | 'testnet' | 'devnet';
  privateKey: string;
  packageId: string;
  adminCapId: string;
  rpcUrl?: string;
}

export class SuiLoyaltyClient {
  private client: SuiClient;
  private keypair: Ed25519Keypair;
  private packageId: string;
  private adminCapId: string;

  constructor(config: SuiConfig) {
    // Initialize Sui Client
    const rpcUrl = config.rpcUrl || getFullnodeUrl(config.network);
    this.client = new SuiClient({ url: rpcUrl });

    // Initialize Keypair from private key
    // Support both formats: suiprivkey and base64
    if (config.privateKey.startsWith('suiprivkey')) {
      // Parse suiprivkey format
      this.keypair = Ed25519Keypair.deriveKeypair(config.privateKey);
    } else {
      // Legacy base64 format
      const privateKeyBytes = fromB64(config.privateKey);
      this.keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
    }

    this.packageId = config.packageId;
    this.adminCapId = config.adminCapId;
  }

  /**
   * Get the active address
   */
  getAddress(): string {
    return this.keypair.getPublicKey().toSuiAddress();
  }

  /**
   * Create a new badge on the blockchain
   */
  async createBadge(
    studentName: string,
    courseId: string,
    studentAddress: string
  ): Promise<{ success: boolean; badgeId?: string; digest?: string; error?: string }> {
    try {
      // Validate address
      if (!this.isValidSuiAddress(studentAddress)) {
        return {
          success: false,
          error: `Invalid Sui address: ${studentAddress}`
        };
      }

      // Create transaction block
      const txb = new TransactionBlock();

      // Call create_badge function
      txb.moveCall({
        target: `${this.packageId}::online_course_loyalty::create_badge`,
        arguments: [
          txb.pure.string(studentName),
          txb.pure.string(courseId),
          txb.pure.address(studentAddress)
        ]
      });

      // Execute transaction
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: txb,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      // Extract badge object ID
      const badgeId = this.extractBadgeId(result);

      if (!badgeId) {
        return {
          success: false,
          error: 'Could not extract badge ID from transaction result'
        };
      }

      return {
        success: true,
        badgeId,
        digest: result.digest
      };
    } catch (error: any) {
      console.error('Error creating badge:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Update progress for a badge
   */
  async updateProgress(
    badgeId: string,
    newProgress: number
  ): Promise<{ success: boolean; digest?: string; error?: string }> {
    try {
      // Validate inputs
      if (!this.isValidSuiAddress(badgeId)) {
        return {
          success: false,
          error: `Invalid badge ID: ${badgeId}`
        };
      }

      if (newProgress < 0 || newProgress > 100) {
        return {
          success: false,
          error: 'Progress must be between 0 and 100'
        };
      }

      // Create transaction block
      const txb = new TransactionBlock();

      // Call update_progress function
      txb.moveCall({
        target: `${this.packageId}::online_course_loyalty::update_progress`,
        arguments: [
          txb.object(this.adminCapId),
          txb.object(badgeId),
          txb.pure.u8(newProgress)
        ]
      });

      // Execute transaction
      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: txb,
        options: {
          showEffects: true
        }
      });

      return {
        success: true,
        digest: result.digest
      };
    } catch (error: any) {
      console.error('Error updating progress:', error);
      return {
        success: false,
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Get badge details from blockchain
   */
  async getBadge(badgeId: string): Promise<any> {
    try {
      const object = await this.client.getObject({
        id: badgeId,
        options: {
          showContent: true,
          showOwner: true
        }
      });

      return object;
    } catch (error: any) {
      console.error('Error getting badge:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<string> {
    const address = this.getAddress();
    const balance = await this.client.getBalance({
      owner: address
    });
    return balance.totalBalance;
  }

  /**
   * Extract badge ID from transaction result
   */
  private extractBadgeId(result: any): string | null {
    if (!result.objectChanges) {
      return null;
    }

    // Find created Badge object
    for (const change of result.objectChanges) {
      if (
        change.type === 'created' &&
        change.objectType &&
        change.objectType.includes('::online_course_loyalty::Badge')
      ) {
        return change.objectId;
      }
    }

    return null;
  }

  /**
   * Validate Sui address format
   */
  private isValidSuiAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(address);
  }
}

/**
 * Factory function to create SuiLoyaltyClient from environment variables
 */
export function createSuiClientFromEnv(): SuiLoyaltyClient {
  const config: SuiConfig = {
    network: (process.env.SUI_NETWORK || 'testnet') as any,
    privateKey: process.env.SUI_PRIVATE_KEY!,
    packageId: process.env.PACKAGE_ID!,
    adminCapId: process.env.ADMIN_CAP_ID!,
    rpcUrl: process.env.SUI_RPC_URL
  };

  // Validate required env vars
  if (!config.privateKey) {
    throw new Error('SUI_PRIVATE_KEY is required');
  }
  if (!config.packageId) {
    throw new Error('PACKAGE_ID is required');
  }
  if (!config.adminCapId) {
    throw new Error('ADMIN_CAP_ID is required');
  }

  return new SuiLoyaltyClient(config);
}
