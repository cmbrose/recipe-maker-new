/**
 * MCP OAuth Provider
 * Implements OAuth 2.0 with PKCE for MCP clients
 * Integrates with existing Google OAuth for user authentication
 */

import { randomBytes, createHash } from 'crypto';
import {
  FileBasedClientsStore,
  FileBasedCodesStore,
  FileBasedTokensStore,
  type ClientMetadata,
  type AuthorizationCode,
  type AccessToken,
} from './storage';

// Token expiration times
const AUTH_CODE_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const ACCESS_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface AuthorizationRequest {
  clientId: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256' | 'plain';
  resource?: string;
  redirectUri: string;
  state?: string;
}

export interface AuthorizedUser {
  userId: string;
  userEmail: string;
}

export interface TokenInfo {
  clientId: string;
  userId: string;
  userEmail: string;
  resource?: string;
  scopes: string[];
}

export class MCPOAuthProvider {
  private clientsStore: FileBasedClientsStore;
  private codesStore: FileBasedCodesStore;
  private tokensStore: FileBasedTokensStore;

  // In-memory session store for pending authorizations
  // Maps session ID -> authorization request
  private pendingAuths = new Map<string, AuthorizationRequest>();

  constructor() {
    this.clientsStore = new FileBasedClientsStore();
    this.codesStore = new FileBasedCodesStore();
    this.tokensStore = new FileBasedTokensStore();
  }

  /**
   * Get OAuth client by ID
   */
  async getClient(clientId: string): Promise<ClientMetadata | undefined> {
    return this.clientsStore.getClient(clientId);
  }

  /**
   * Register a new OAuth client
   */
  async registerClient(
    name: string,
    redirectUris: string[]
  ): Promise<ClientMetadata> {
    return this.clientsStore.registerClient({ name, redirectUris });
  }

  /**
   * List all registered clients
   */
  async listClients(): Promise<ClientMetadata[]> {
    return this.clientsStore.listClients();
  }

  /**
   * Initiate authorization flow
   * Returns a session ID that should be stored in a cookie
   */
  async initiateAuthorization(
    request: AuthorizationRequest
  ): Promise<{ sessionId: string; authUrl: string }> {
    // Validate client
    const client = await this.clientsStore.getClient(request.clientId);
    if (!client) {
      throw new Error('Invalid client_id');
    }

    // Validate redirect URI
    if (!client.redirectUris.includes(request.redirectUri)) {
      throw new Error('Invalid redirect_uri');
    }

    // Validate code challenge method
    if (request.codeChallengeMethod !== 'S256' && request.codeChallengeMethod !== 'plain') {
      throw new Error('Invalid code_challenge_method');
    }

    // Generate session ID
    const sessionId = randomBytes(32).toString('hex');

    // Store pending authorization
    this.pendingAuths.set(sessionId, request);

    // Clean up old sessions (older than 1 hour)
    this.cleanupOldSessions();

    // Return auth URL that redirects to our Google OAuth flow
    // The caller will redirect the user to this URL
    const authUrl = `/api/mcp/oauth/login?session=${sessionId}`;

    return { sessionId, authUrl };
  }

  /**
   * Complete authorization after user authentication
   * Called after successful Google OAuth login
   */
  async completeAuthorization(
    sessionId: string,
    user: AuthorizedUser
  ): Promise<{ code: string; redirectUri: string; state?: string }> {
    // Get pending authorization request
    const request = this.pendingAuths.get(sessionId);
    if (!request) {
      throw new Error('Invalid or expired session');
    }

    // Remove from pending
    this.pendingAuths.delete(sessionId);

    // Generate authorization code
    const code = randomBytes(32).toString('hex');

    // Store authorization code
    const authCode: AuthorizationCode = {
      code,
      clientId: request.clientId,
      userId: user.userId,
      userEmail: user.userEmail,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod,
      resource: request.resource,
      redirectUri: request.redirectUri,
      expiresAt: new Date(Date.now() + AUTH_CODE_EXPIRY_MS),
      used: false,
    };

    await this.codesStore.saveCode(authCode);

    return {
      code,
      redirectUri: request.redirectUri,
      state: request.state,
    };
  }

  /**
   * Get pending authorization request by session ID
   */
  getPendingAuthorization(sessionId: string): AuthorizationRequest | undefined {
    return this.pendingAuths.get(sessionId);
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeAuthorizationCode(
    code: string,
    clientId: string,
    codeVerifier: string,
    redirectUri: string
  ): Promise<{ accessToken: string; tokenType: string; expiresIn: number }> {
    // Get authorization code
    const authCode = await this.codesStore.getCode(code);
    if (!authCode) {
      throw new Error('Invalid or expired authorization code');
    }

    // Validate code hasn't been used
    if (authCode.used) {
      throw new Error('Authorization code already used');
    }

    // Validate client ID
    if (authCode.clientId !== clientId) {
      throw new Error('Client ID mismatch');
    }

    // Validate redirect URI
    if (authCode.redirectUri !== redirectUri) {
      throw new Error('Redirect URI mismatch');
    }

    // Validate code verifier (PKCE)
    const isValid = this.verifyCodeChallenge(
      codeVerifier,
      authCode.codeChallenge,
      authCode.codeChallengeMethod
    );
    if (!isValid) {
      throw new Error('Invalid code verifier');
    }

    // Mark code as used
    await this.codesStore.markCodeAsUsed(code);

    // Generate access token
    const accessToken = randomBytes(32).toString('hex');

    // Store access token
    const token: AccessToken = {
      token: accessToken,
      clientId: authCode.clientId,
      userId: authCode.userId,
      userEmail: authCode.userEmail,
      resource: authCode.resource,
      scopes: [], // Could be extended to support scopes
      expiresAt: new Date(Date.now() + ACCESS_TOKEN_EXPIRY_MS),
      revoked: false,
    };

    await this.tokensStore.saveToken(token);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
    };
  }

  /**
   * Verify access token and return token info
   */
  async verifyAccessToken(token: string): Promise<TokenInfo | undefined> {
    const accessToken = await this.tokensStore.getToken(token);
    if (!accessToken) {
      return undefined;
    }

    return {
      clientId: accessToken.clientId,
      userId: accessToken.userId,
      userEmail: accessToken.userEmail,
      resource: accessToken.resource,
      scopes: accessToken.scopes,
    };
  }

  /**
   * Revoke access token
   */
  async revokeToken(token: string): Promise<void> {
    await this.tokensStore.revokeToken(token);
  }

  /**
   * Get all active tokens for a user
   */
  async getUserTokens(userId: string): Promise<AccessToken[]> {
    return this.tokensStore.getTokensByUser(userId);
  }

  /**
   * Verify code challenge (PKCE)
   */
  private verifyCodeChallenge(
    verifier: string,
    challenge: string,
    method: string
  ): boolean {
    if (method === 'S256') {
      const hash = createHash('sha256').update(verifier).digest('base64url');
      return hash === challenge;
    } else if (method === 'plain') {
      return verifier === challenge;
    }
    return false;
  }

  /**
   * Clean up old pending authorization sessions
   */
  private cleanupOldSessions(): void {
    // For simplicity, just clear all if we have too many
    // In production, you'd want to track timestamps
    if (this.pendingAuths.size > 1000) {
      this.pendingAuths.clear();
    }
  }
}

// Singleton instance
let oauthProvider: MCPOAuthProvider | null = null;

export function getOAuthProvider(): MCPOAuthProvider {
  if (!oauthProvider) {
    oauthProvider = new MCPOAuthProvider();
  }
  return oauthProvider;
}
