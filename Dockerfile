# ============================================
# Stage 1: Builder
# ============================================
FROM docker.io/library/node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files and npmrc (if exists - for private packages)
COPY package.json pnpm-lock.yaml* .npmrc* ./

# Install dependencies
RUN pnpm install

# Remove npmrc after install (don't leak token to final image)
RUN rm -f .npmrc

# Copy source files
COPY . .

# Build the application
# Set NODE_OPTIONS to handle potential memory/file limits in container builds
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN pnpm build

# ============================================
# Stage 2: Runner (nginx)
# ============================================
FROM docker.io/library/nginx:alpine AS runner

# Default port (override with -e PORT=4000)
ENV PORT=80

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config template (uses envsubst for PORT)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Health check (uses PORT env var)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT}/ || exit 1

EXPOSE ${PORT}

# nginx:alpine uses docker-entrypoint which auto-runs envsubst on templates
CMD ["nginx", "-g", "daemon off;"]
