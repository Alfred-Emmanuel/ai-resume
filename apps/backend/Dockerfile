FROM node:20-bookworm AS base

ENV PNPM_HOME=/usr/local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.6.0 --activate

WORKDIR /app

# --- deps: install all workspace deps using pnpm ---
FROM base AS deps

# Copy only manifests to leverage Docker layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY turbo.json ./
COPY packages/types/package.json packages/types/package.json
COPY packages/utils/package.json packages/utils/package.json
COPY apps/backend/package.json apps/backend/package.json

# Install dependencies for the whole monorepo (no scripts)
RUN pnpm fetch --prefer-offline && pnpm install

# --- build: compile workspaces and backend ---
FROM deps AS build
COPY . .

# Build only required workspaces: types (for d.ts) and backend
RUN pnpm install --no-frozen-lockfile \
 && pnpm --filter @ai-resume/types build \
 && pnpm --filter @ai-resume/backend build

# --- prune: create production-only node_modules for backend ---
FROM deps AS prune
COPY . .
RUN pnpm --filter @ai-resume/backend deploy --prod /app/out

# --- runtime image ---
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy pruned node_modules and built app
COPY --from=prune /app/out/node_modules ./node_modules
COPY --from=build /app/apps/backend/dist ./dist
COPY apps/backend/package.json ./package.json

# Ensure a non-root user (optional, comment if issues)
# RUN useradd -m appuser && chown -R appuser:appuser /app
# USER appuser

EXPOSE 4000

CMD ["node", "dist/index.js"]
