FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
COPY . .
RUN pnpm install

# 1. Generate the DB client first
RUN cd packages/db && npx prisma generate

# 2. Build the backend
# We add a dummy DATABASE_URL here because sometimes the build script
# (like NestJS or certain TS configs) checks for it.
RUN DATABASE_URL="postgresql://dummy@localhost:5432/db" pnpm --filter backend build

FROM base AS runner
# We need to copy the generated prisma client from the db package folder too
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages/db ./packages/db

EXPOSE 3000
CMD ["node", "dist/main.js"]