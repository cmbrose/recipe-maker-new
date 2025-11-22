# Dockerfile for Next.js + MCP Auth Proxy + Nginx
FROM node:20-slim AS base
WORKDIR /app

# Build arg for connection string (needed during build for page data collection)
ARG COSMOS_DB_CONNECTION_STRING
ENV COSMOS_DB_CONNECTION_STRING=$COSMOS_DB_CONNECTION_STRING

# Install dependencies
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build Next.js app
RUN pnpm build

# Production image with nginx and mcp-auth-proxy
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Install nginx, wget, curl, and other runtime dependencies
RUN apt-get update && \
    apt-get install -y nginx wget curl ca-certificates && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Download mcp-auth-proxy binary
RUN wget -q https://github.com/sigbit/mcp-auth-proxy/releases/latest/download/mcp-auth-proxy-linux-amd64 -O /usr/local/bin/mcp-auth-proxy && \
    chmod +x /usr/local/bin/mcp-auth-proxy

# Copy built app and dependencies
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/public ./public
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/instrumentation.ts ./instrumentation.ts
COPY --from=base /app/next.config.ts ./next.config.ts

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy startup scripts
COPY scripts/start-mcp-proxy.sh /usr/local/bin/start-mcp-proxy.sh
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/start-mcp-proxy.sh /usr/local/bin/docker-entrypoint.sh

# Create log and temp directories and set permissions
RUN mkdir -p /var/log/nginx /var/lib/nginx /tmp/client_temp /tmp/proxy_temp /tmp/fastcgi_temp /tmp/uwsgi_temp /tmp/scgi_temp && \
    chown -R node:node /app

# Expose port 80 (nginx)
EXPOSE 80

# Health check via nginx
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:80/health || exit 1

# Start all services via entrypoint script (runs as root to allow nginx on port 80)
CMD ["/usr/local/bin/docker-entrypoint.sh"]
