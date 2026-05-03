FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

# 1. Install OpenSSL (Required for Prisma engines to run on Linux)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
# 2. Copy the entire monorepo context
# This is necessary so pnpm can see the workspace and all packages
COPY . .

# 3. Install ALL dependencies first
# (pnpm is smart and will only install what's needed for the workspace)
RUN pnpm install

# 4. Generate the Prisma Client
# We use --filter db to target your database package specifically
RUN pnpm --filter db run generate

# 5. Build the backend
RUN pnpm --filter backend build

FROM base AS runner
# 6. Copy only the production essentials to keep the image small
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages/db ./packages/db

EXPOSE 3000
CMD ["node", "dist/main.js"]