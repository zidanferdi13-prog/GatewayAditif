# =============================================================================
# AMA Timbangan Aditif — Multi-stage Dockerfile
#
# Stage 1  (frontend-builder) : Build the React/Vite frontend
# Stage 2  (app)              : Production Node.js image
#   - Installs backend deps (incl. native serialport bindings)
#   - Copies built frontend into /app/public  (served by Express)
#   - Runs as non-root user
# =============================================================================

# ── Stage 1: Build React frontend ────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Install deps first (layer caching — only re-runs when package.json changes)
COPY frontend-react/package.json frontend-react/package-lock.json ./
RUN npm ci --prefer-offline

# Copy source and build
COPY frontend-react/ .
RUN npm run build


# ── Stage 2: Production image ─────────────────────────────────────────────────
# Use Debian slim instead of Alpine so that serialport's native bindings
# compile and link against glibc / libudev without workarounds.
FROM node:20-bookworm-slim AS app

# Build tools needed by serialport (@serialport/bindings-cpp) + libudev runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
        python3 \
        make \
        g++ \
        libudev-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Backend dependencies ──────────────────────────────────────────────────────
# Root-level package.json IS the backend package (see repo structure).
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Backend source ────────────────────────────────────────────────────────────
COPY backend/ ./backend/

# ── Frontend (built in Stage 1) ───────────────────────────────────────────────
# Express will serve these as static files (FRONTEND_DIR=/app/public).
COPY --from=frontend-builder /build/dist ./public/

# ── Logs directory (mounted as a volume in docker-compose) ───────────────────
RUN mkdir -p logs

# ── Non-root user ─────────────────────────────────────────────────────────────
RUN groupadd -r appgroup && useradd -r -g appgroup appuser \
    && chown -R appuser:appgroup /app
USER appuser

# ── Runtime configuration ─────────────────────────────────────────────────────
EXPOSE 3000
ENV NODE_ENV=production \
    FRONTEND_DIR=/app/public

# Graceful shutdown is handled via SIGINT in server.js
STOPSIGNAL SIGINT

CMD ["node", "backend/server.js"]
