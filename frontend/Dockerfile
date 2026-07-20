# =========================================================
# Stage 1: Install Dependencies
# =========================================================
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# =========================================================
# Stage 2: Build Application Bundle
# =========================================================
FROM node:20-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Set default production endpoint at build time for bundle hydration
ENV NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
RUN npm run build

# =========================================================
# Stage 3: Production Runner
# =========================================================
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create a non-root system user
RUN groupadd -g 10001 nodejs && \
    useradd -u 10001 -g nodejs -d /app -s /sbin/nologin nextjs

# Copy runtime assets and optimized bundles
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000

# Next.js production start command
CMD ["npm", "run", "start"]
