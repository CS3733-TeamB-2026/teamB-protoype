FROM node:20-slim AS base
RUN corepack enable
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder

# Copy workspace config first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/backend/package.json ./apps/backend/package.json
COPY packages/db/package.json ./packages/db/package.json
COPY apps/frontend/package.json ./apps/frontend/package.json

RUN pnpm install --frozen-lockfile

# Copy all source (Prisma schema lives in packages/db)
COPY . .

# Generate Prisma client (writes into node_modules/.prisma and packages/db/node_modules)
RUN cd packages/db && npx prisma generate

# Build backend
RUN DATABASE_URL="postgresql://dummy@localhost:5432/db" pnpm --filter backend build

FROM base AS runner

# Copy compiled output
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json

# Copy root node_modules (shared deps)
COPY --from=builder /app/node_modules ./node_modules

# Copy the db package with its generated Prisma client
COPY --from=builder /app/packages/db ./packages/db

# Copy the generated .prisma client (Prisma engine binaries live here)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 3000
CMD ["node", "dist/main.js"]