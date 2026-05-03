FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

# 1. Install OpenSSL - REQUIRED for Prisma to work on Linux
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
COPY . .

# 2. Install dependencies
RUN pnpm install

# 3. Explicitly generate Prisma from the package folder
# This bypasses pnpm filtering logic and calls the binary directly
RUN cd packages/db && npx prisma generate

# 4. Build the backend
RUN pnpm --filter backend build

FROM base AS runner
# Copying the generated client and built files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages/db ./packages/db

EXPOSE 3000
CMD ["node", "dist/main.js"]