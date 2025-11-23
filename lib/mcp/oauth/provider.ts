import { createHash, randomUUID } from 'node:crypto';
import { OAuthRegisteredClientsStore } from '@modelcontextprotocol/sdk/dist/esm/server/auth/clients';
import { AuthorizationCodeRecord, PersistentOAuthStore, StoredClient, TokenRecord, oauthStore } from './store';

const AUTH_CODE_EXPIRY_MS = 10 * 60 * 1000;
const ACCESS_TOKEN_EXPIRY_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthenticatedUser = {
  email: string;
  name?: string | null;
};

export type AuthorizationRequest = {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scopes: string[];
  resource?: string;
  state?: string | null;
  user: AuthenticatedUser;
};

export type TokenResponse = {
  access_token: string;
  token_type: 'bearer';
  expires_in: number;
  scope?: string;
  refresh_token?: string;
};

export class McpOAuthProvider {
  constructor(private readonly store: PersistentOAuthStore = oauthStore) {}

  get clientsStore(): OAuthRegisteredClientsStore {
    return {
      registerClient: (metadata) =>
        this.store.registerClient({
          client_id: metadata.client_id,
          client_name: metadata.client_name,
          redirect_uris: metadata.redirect_uris,
          client_secret: metadata.client_secret,
        }),
      getClient: (clientId) => this.store.getClient(clientId),
    } satisfies OAuthRegisteredClientsStore;
  }

  async registerClient(metadata: { client_name?: string; redirect_uris: string[]; client_id?: string; client_secret?: string }) {
    if (!metadata.redirect_uris?.length) {
      throw new Error('redirect_uris are required');
    }

    return this.store.registerClient({
      client_id: metadata.client_id,
      client_name: metadata.client_name,
      client_secret: metadata.client_secret,
      redirect_uris: metadata.redirect_uris,
    });
  }

  async getClient(clientId: string): Promise<StoredClient | undefined> {
    return this.store.getClient(clientId);
  }

  async issueAuthorizationCode(request: AuthorizationRequest): Promise<AuthorizationCodeRecord> {
    const client = await this.store.getClient(request.clientId);
    if (!client) {
      throw new Error('Unknown client');
    }

    if (!client.redirect_uris.includes(request.redirectUri)) {
      throw new Error('Unregistered redirect_uri');
    }

    const code: AuthorizationCodeRecord = {
      code: randomUUID(),
      clientId: request.clientId,
      redirectUri: request.redirectUri,
      codeChallenge: request.codeChallenge,
      codeChallengeMethod: request.codeChallengeMethod,
      scopes: request.scopes,
      resource: request.resource,
      createdAt: Date.now(),
      user: request.user,
    };

    await this.store.saveAuthorizationCode(code);
    return code;
  }

  async exchangeAuthorizationCode(params: {
    code: string;
    clientId: string;
    redirectUri: string;
    codeVerifier: string;
  }): Promise<TokenResponse> {
    const codeRecord = await this.store.useAuthorizationCode(params.code);
    if (!codeRecord) {
      throw new Error('Invalid authorization code');
    }

    if (Date.now() - codeRecord.createdAt > AUTH_CODE_EXPIRY_MS) {
      throw new Error('Authorization code expired');
    }

    if (codeRecord.clientId !== params.clientId) {
      throw new Error('Authorization code was not issued to this client');
    }

    if (codeRecord.redirectUri !== params.redirectUri) {
      throw new Error('redirect_uri mismatch');
    }

    const verifierHash = this.base64Url(createHash('sha256').update(params.codeVerifier).digest());
    if (verifierHash !== codeRecord.codeChallenge) {
      throw new Error('Invalid code_verifier');
    }

    const tokenRecord: TokenRecord = {
      token: randomUUID(),
      refreshToken: randomUUID(),
      clientId: codeRecord.clientId,
      scopes: codeRecord.scopes,
      resource: codeRecord.resource,
      expiresAt: Date.now() + ACCESS_TOKEN_EXPIRY_MS,
      refreshExpiresAt: Date.now() + REFRESH_TOKEN_EXPIRY_MS,
      user: codeRecord.user,
    };

    await this.store.saveToken(tokenRecord);

    return {
      access_token: tokenRecord.token,
      token_type: 'bearer',
      expires_in: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
      refresh_token: tokenRecord.refreshToken,
      scope: tokenRecord.scopes.join(' '),
    };
  }

  async exchangeRefreshToken(params: { refreshToken: string; clientId: string; scopes?: string[]; resource?: string }): Promise<TokenResponse> {
    const refreshedToken = await this.store.getTokenByRefreshToken(params.refreshToken);
    if (!refreshedToken) {
      throw new Error('Invalid refresh token');
    }

    if (refreshedToken.refreshToken !== params.refreshToken) {
      throw new Error('Refresh token does not match');
    }

    if (refreshedToken.clientId !== params.clientId) {
      throw new Error('Refresh token not issued to this client');
    }

    if (refreshedToken.refreshExpiresAt && refreshedToken.refreshExpiresAt < Date.now()) {
      throw new Error('Refresh token expired');
    }

    const scopes = params.scopes?.length ? params.scopes : refreshedToken.scopes;
    const resource = params.resource ?? refreshedToken.resource;
    const tokenRecord: TokenRecord = {
      token: randomUUID(),
      refreshToken: params.refreshToken,
      clientId: refreshedToken.clientId,
      scopes,
      resource,
      expiresAt: Date.now() + ACCESS_TOKEN_EXPIRY_MS,
      refreshExpiresAt: refreshedToken.refreshExpiresAt,
      user: refreshedToken.user,
    };

    await this.store.saveToken(tokenRecord);

    return {
      access_token: tokenRecord.token,
      token_type: 'bearer',
      expires_in: Math.floor(ACCESS_TOKEN_EXPIRY_MS / 1000),
      scope: tokenRecord.scopes.join(' '),
      refresh_token: tokenRecord.refreshToken,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenRecord> {
    const tokenRecord = await this.store.getToken(token);
    if (!tokenRecord) {
      throw new Error('Invalid or expired token');
    }
    return tokenRecord;
  }

  private base64Url(buffer: Buffer) {
    return buffer
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}

export const mcpOAuthProvider = new McpOAuthProvider();
