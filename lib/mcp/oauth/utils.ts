import { NextRequest } from 'next/server';
import { auth } from '@/auth';
import { AuthenticatedUser } from './provider';

export const DEFAULT_SCOPES = ['mcp:tools'];

export function getOAuthBaseUrl(request: NextRequest | string) {
  const url = new URL(typeof request === 'string' ? request : request.url);
  return `${url.protocol}//${url.host}`;
}

export async function resolveMcpUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (session?.user?.email) {
    return {
      email: session.user.email,
      name: session.user.name,
    };
  }

  const fallbackEmail = process.env.MCP_OAUTH_TEST_USER_EMAIL;
  if (fallbackEmail) {
    return {
      email: fallbackEmail,
      name: 'Local MCP Tester',
    };
  }

  return null;
}

export function parseScopes(scopeParam?: string | null) {
  if (!scopeParam) return [] as string[];
  return scopeParam
    .split(' ')
    .map((scope) => scope.trim())
    .filter(Boolean);
}

export function isValidUrl(value: string): boolean {
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}
