FROM node:20-slim AS base
RUN corepack enable
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

FROM base AS builder

COPY . .
RUN pnpm install

# Generate Prisma client
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