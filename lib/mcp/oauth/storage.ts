/**
 * File-based persistent storage for MCP OAuth data
 * Supports both local development and production (via volume mount)
 */

import fs from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

// Storage directory - can be overridden via environment variable
const STORAGE_DIR = process.env.OAUTH_STORAGE_DIR || path.join(process.cwd(), 'data', 'oauth');

// Storage file paths
const CLIENTS_FILE = path.join(STORAGE_DIR, 'clients.json');
const CODES_FILE = path.join(STORAGE_DIR, 'codes.json');
const TOKENS_FILE = path.join(STORAGE_DIR, 'tokens.json');

export interface ClientMetadata {
  id: string;
  name: string;
  redirectUris: string[];
  ownerId: string; // The user who registered/owns this client
  createdAt: Date;
}

export interface AuthorizationCode {
  code: string;
  clientId: string;
  userId: string;
  userEmail: string;
  codeChallenge: string;
  codeChallengeMethod: string;
  resource?: string;
  redirectUri: string;
  expiresAt: Date;
  used: boolean;
}

export interface AccessToken {
  token: string;
  clientId: string;
  userId: string;
  userEmail: string;
  resource?: string;
  scopes: string[];
  expiresAt: Date;
  revoked: boolean;
}

/**
 * Initialize storage directory and files
 */
async function initStorage() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });

    // Initialize empty files if they don't exist
    for (const file of [CLIENTS_FILE, CODES_FILE, TOKENS_FILE]) {
      try {
        await fs.access(file);
      } catch {
        await fs.writeFile(file, JSON.stringify({}), 'utf-8');
      }
    }
  } catch (error) {
    console.error('Failed to initialize OAuth storage:', error);
    throw error;
  }
}

/**
 * Read JSON file with error handling
 */
async function readJsonFile<T>(filePath: string): Promise<Record<string, T>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    // File doesn't exist is fine - treat as empty
    if (error && error.code === 'ENOENT') {
      return {};
    }
    // Other errors (permissions, corruption, etc.) should be logged and re-thrown
    console.error(`Failed to read ${filePath}:`, error);
    throw error;
  }
}

/**
 * Write JSON file with atomic operation
 */
async function writeJsonFile<T>(filePath: string, data: Record<string, T>): Promise<void> {
  const tempFile = `${filePath}.tmp`;
  try {
    await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf-8');
    await fs.rename(tempFile, filePath);
  } catch (error) {
    console.error(`Failed to write ${filePath}:`, error);
    // Clean up temp file if it exists
    try {
      await fs.unlink(tempFile);
    } catch {}
    throw error;
  }
}

/**
 * OAuth Clients Store
 */
export class FileBasedClientsStore {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await initStorage();
      this.initialized = true;
    }
  }

  async getClient(clientId: string): Promise<ClientMetadata | undefined> {
    await this.ensureInitialized();
    const clients = await readJsonFile<ClientMetadata>(CLIENTS_FILE);
    const client = clients[clientId];
    if (client) {
      // Parse date strings back to Date objects
      client.createdAt = new Date(client.createdAt);
    }
    return client;
  }

  async registerClient(metadata: Omit<ClientMetadata, 'id' | 'createdAt'>): Promise<ClientMetadata> {
    await this.ensureInitialized();
    const clients = await readJsonFile<ClientMetadata>(CLIENTS_FILE);

    const clientId = randomBytes(16).toString('hex');
    const client: ClientMetadata = {
      id: clientId,
      ...metadata,
      createdAt: new Date(),
    };

    clients[clientId] = client;
    await writeJsonFile(CLIENTS_FILE, clients);

    return client;
  }

  async listClients(): Promise<ClientMetadata[]> {
    await this.ensureInitialized();
    const clients = await readJsonFile<ClientMetadata>(CLIENTS_FILE);
    return Object.values(clients).map(client => ({
      ...client,
      createdAt: new Date(client.createdAt),
    }));
  }
}

/**
 * Authorization Codes Store
 */
export class FileBasedCodesStore {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await initStorage();
      this.initialized = true;
    }
  }

  async saveCode(code: AuthorizationCode): Promise<void> {
    await this.ensureInitialized();
    const codes = await readJsonFile<AuthorizationCode>(CODES_FILE);
    codes[code.code] = code;
    await writeJsonFile(CODES_FILE, codes);

    // Clean up expired codes asynchronously
    this.cleanupExpiredCodes().catch(console.error);
  }

  async getCode(code: string): Promise<AuthorizationCode | undefined> {
    await this.ensureInitialized();
    const codes = await readJsonFile<AuthorizationCode>(CODES_FILE);
    const authCode = codes[code];
    if (authCode) {
      // Parse date strings back to Date objects
      authCode.expiresAt = new Date(authCode.expiresAt);

      // Check if expired
      if (authCode.expiresAt < new Date()) {
        return undefined;
      }
    }
    return authCode;
  }

  async markCodeAsUsed(code: string): Promise<void> {
    await this.ensureInitialized();
    const codes = await readJsonFile<AuthorizationCode>(CODES_FILE);
    if (codes[code]) {
      codes[code].used = true;
      await writeJsonFile(CODES_FILE, codes);
    }
  }

  /**
   * Atomically consume an authorization code (check and mark as used)
   * Returns the code if valid and not yet used, undefined otherwise
   * This minimizes (but doesn't eliminate) the TOCTOU race condition
   */
  async consumeCode(code: string): Promise<AuthorizationCode | undefined> {
    await this.ensureInitialized();
    const codes = await readJsonFile<AuthorizationCode>(CODES_FILE);
    const authCode = codes[code];

    if (!authCode) {
      return undefined;
    }

    // Parse date strings back to Date objects
    authCode.expiresAt = new Date(authCode.expiresAt);

    // Check if expired or already used
    if (authCode.expiresAt < new Date() || authCode.used) {
      return undefined;
    }

    // Mark as used and save immediately
    codes[code].used = true;
    await writeJsonFile(CODES_FILE, codes);

    return authCode;
  }

  private async cleanupExpiredCodes(): Promise<void> {
    const codes = await readJsonFile<AuthorizationCode>(CODES_FILE);
    const now = new Date();
    let changed = false;

    for (const [key, code] of Object.entries(codes)) {
      if (new Date(code.expiresAt) < now) {
        delete codes[key];
        changed = true;
      }
    }

    if (changed) {
      await writeJsonFile(CODES_FILE, codes);
    }
  }
}

/**
 * Access Tokens Store
 */
export class FileBasedTokensStore {
  private initialized = false;

  private async ensureInitialized() {
    if (!this.initialized) {
      await initStorage();
      this.initialized = true;
    }
  }

  async saveToken(token: AccessToken): Promise<void> {
    await this.ensureInitialized();
    const tokens = await readJsonFile<AccessToken>(TOKENS_FILE);
    tokens[token.token] = token;
    await writeJsonFile(TOKENS_FILE, tokens);

    // Clean up expired tokens asynchronously
    this.cleanupExpiredTokens().catch(console.error);
  }

  async getToken(token: string): Promise<AccessToken | undefined> {
    await this.ensureInitialized();
    const tokens = await readJsonFile<AccessToken>(TOKENS_FILE);
    const accessToken = tokens[token];
    if (accessToken) {
      // Parse date strings back to Date objects
      accessToken.expiresAt = new Date(accessToken.expiresAt);

      // Check if expired or revoked
      if (accessToken.expiresAt < new Date() || accessToken.revoked) {
        return undefined;
      }
    }
    return accessToken;
  }

  async revokeToken(token: string): Promise<void> {
    await this.ensureInitialized();
    const tokens = await readJsonFile<AccessToken>(TOKENS_FILE);
    if (tokens[token]) {
      tokens[token].revoked = true;
      await writeJsonFile(TOKENS_FILE, tokens);
    }
  }

  async getTokensByUser(userId: string): Promise<AccessToken[]> {
    await this.ensureInitialized();
    const tokens = await readJsonFile<AccessToken>(TOKENS_FILE);
    const now = new Date();

    return Object.values(tokens)
      .filter(t => t.userId === userId && !t.revoked && new Date(t.expiresAt) > now)
      .map(token => ({
        ...token,
        expiresAt: new Date(token.expiresAt),
      }));
  }

  private async cleanupExpiredTokens(): Promise<void> {
    const tokens = await readJsonFile<AccessToken>(TOKENS_FILE);
    const now = new Date();
    let changed = false;

    for (const [key, token] of Object.entries(tokens)) {
      // Remove tokens that have been expired for more than 7 days
      const expiredDays = (now.getTime() - new Date(token.expiresAt).getTime()) / (1000 * 60 * 60 * 24);
      if (expiredDays > 7) {
        delete tokens[key];
        changed = true;
      }
    }

    if (changed) {
      await writeJsonFile(TOKENS_FILE, tokens);
    }
  }
}
