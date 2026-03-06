# ============================================
# Revenue Frontend - Production Dockerfile
# ============================================
# Uses pre-built dist folder (build locally or in CI with pnpm build)
# This pattern avoids requiring GitHub token at image build time
#
# To build from pre-built dist (current default):
#   pnpm build  # local or CI
#   podman build -t hnc-ms-revenue-fe .
# ============================================

FROM docker.io/library/nginx:alpine AS runner

# Build metadata (PLAN-057: version visibility)
ARG BUILD_COMMIT=dev
ENV BUILD_COMMIT=$BUILD_COMMIT

# Copy pre-built dist (built locally or in CI)
COPY dist /usr/share/nginx/html

# Copy nginx config template (uses envsubst for PORT)
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:${PORT:-80}/ || exit 1

EXPOSE ${PORT:-80}

# nginx:alpine uses docker-entrypoint which auto-runs envsubst on templates
CMD ["nginx", "-g", "daemon off;"]
