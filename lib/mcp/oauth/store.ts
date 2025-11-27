import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export type StoredClient = {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  client_secret: string;
  createdAt: number;
};

export type AuthorizationCodeRecord = {
  code: string;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  codeChallengeMethod: 'S256';
  scopes: string[];
  resource?: string;
  createdAt: number;
  user: {
    email: string;
    name?: string | null;
  };
};

export type TokenRecord = {
  token: string;
  refreshToken?: string;
  clientId: string;
  scopes: string[];
  resource?: string;
  expiresAt: number;
  refreshExpiresAt?: number;
  user: {
    email: string;
    name?: string | null;
  };
};

type StoreShape = {
  clients: Record<string, StoredClient>;
  codes: Record<string, AuthorizationCodeRecord>;
  tokens: Record<string, TokenRecord>;
};

const DEFAULT_PATH = process.env.MCP_OAUTH_STORE_PATH || path.join(process.cwd(), 'data', 'mcp-oauth-store.json');

async function ensureStoreDirectory(filePath: string) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

async function loadStore(storePath: string): Promise<StoreShape> {
  try {
    const raw = await fs.readFile(storePath, 'utf8');
    return JSON.parse(raw) as StoreShape;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return { clients: {}, codes: {}, tokens: {} };
    }
    throw error;
  }
}

async function persist(storePath: string, data: StoreShape) {
  await ensureStoreDirectory(storePath);
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), 'utf8');
}

export class PersistentOAuthStore {
  constructor(private readonly storePath: string = DEFAULT_PATH) {}

  async getClient(clientId: string): Promise<StoredClient | undefined> {
    const store = await loadStore(this.storePath);
    return store.clients[clientId];
  }

  async registerClient(metadata: Omit<StoredClient, 'createdAt' | 'client_id' | 'client_secret'> & { client_secret?: string }): Promise<StoredClient> {
    const store = await loadStore(this.storePath);
    let client_id = randomUUID();
    while (store.clients[client_id]) {
      client_id = randomUUID();
    }

    const client: StoredClient = {
      client_id,
      client_name: metadata.client_name,
      redirect_uris: metadata.redirect_uris,
      client_secret: metadata.client_secret || randomUUID(),
      createdAt: Date.now(),
    };

    store.clients[client_id] = client;
    await persist(this.storePath, store);
    return client;
  }

  async saveAuthorizationCode(record: AuthorizationCodeRecord) {
    const store = await loadStore(this.storePath);
    store.codes[record.code] = record;
    await persist(this.storePath, store);
  }

  async useAuthorizationCode(code: string): Promise<AuthorizationCodeRecord | undefined> {
    const store = await loadStore(this.storePath);
    const record = store.codes[code];
    // NOTE: File-based persistence cannot guarantee atomic read-delete operations. Concurrent requests could race to reuse a
    // code before deletion. Consider a transactional store for production deployments.
    if (!record) return undefined;
    delete store.codes[code];
    await persist(this.storePath, store);
    return record;
  }

  async saveToken(record: TokenRecord) {
    const store = await loadStore(this.storePath);

    if (record.refreshToken) {
      for (const [token, entry] of Object.entries(store.tokens)) {
        if (entry.refreshToken === record.refreshToken) {
          delete store.tokens[token];
        }
      }
    }

    store.tokens[record.token] = record;
    await persist(this.storePath, store);
  }

  async getToken(token: string): Promise<TokenRecord | undefined> {
    const store = await loadStore(this.storePath);
    const record = store.tokens[token];
    // NOTE: Expiration checks and deletions are not atomic in this file-backed store; concurrent requests could briefly reuse an
    // expired token. Prefer a transactional backend for stronger guarantees.
    if (!record) return undefined;
    if (record.expiresAt < Date.now()) {
      delete store.tokens[token];
      await persist(this.storePath, store);
      return undefined;
    }
    return record;
  }

  async getTokenByRefreshToken(refreshToken: string): Promise<TokenRecord | undefined> {
    const store = await loadStore(this.storePath);
    const record = Object.values(store.tokens).find((entry) => entry.refreshToken === refreshToken);
    // NOTE: Expiration checks and deletions are not atomic in this file-backed store; concurrent requests could briefly reuse an
    // expired refresh token. Prefer a transactional backend for stronger guarantees.
    if (!record) return undefined;
    if (record.refreshExpiresAt && record.refreshExpiresAt < Date.now()) {
      delete store.tokens[record.token];
      await persist(this.storePath, store);
      return undefined;
    }
    return record;
  }
}

export const oauthStore = new PersistentOAuthStore();
