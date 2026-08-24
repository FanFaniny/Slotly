# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy dependency manifests first (better cache)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/trpc/package.json packages/trpc/package.json

# Install all dependencies (including dev)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build API and its workspace dependencies
RUN pnpm turbo build --filter=@slotly/api...

# Stage 2: runtime
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Ensure pnpm available for migrations
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy built project + node_modules
COPY --from=build /app .

# Remove dev dependencies to slim the image
RUN pnpm install --prod --frozen-lockfile

EXPOSE 3001

# Run migrations, then start API
CMD ["sh", "-c", "pnpm db:migrate && node apps/api/dist/server.js"]
