import { createOAuthMetadata, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/dist/esm/server/auth/router';
import { DEFAULT_SCOPES, getOAuthBaseUrl } from './utils';
import { mcpOAuthProvider } from './provider';

export function buildAuthorizationServerMetadata(requestUrl: string) {
  const issuerUrl = new URL(getOAuthBaseUrl(requestUrl));

  const metadata = createOAuthMetadata({
    provider: mcpOAuthProvider,
    issuerUrl,
    baseUrl: issuerUrl,
    scopesSupported: DEFAULT_SCOPES,
  });

  return {
    ...metadata,
  };
}

export function buildProtectedResourceMetadata(requestUrl: string) {
  const request = new URL(requestUrl);
  const oauthServerUrl = new URL(getOAuthBaseUrl(requestUrl));
  const resource = new URL('/api/mcp', request.origin);

  return {
    resource: resource.href,
    authorization_servers: [oauthServerUrl.href],
    scopes_supported: DEFAULT_SCOPES,
    metadata_url: getOAuthProtectedResourceMetadataUrl(resource),
  };
}
