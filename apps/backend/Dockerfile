FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

FROM base AS builder
# Copy the whole repo so pnpm can link the workspace
COPY . .
RUN pnpm install

# 1. Generate the types in the db package
RUN cd packages/db && npx prisma generate

# 2. Build the backend
# Now that paths are fixed, this will find @teamb/db automatically
RUN DATABASE_URL="postgresql://dummy@localhost:5432/db" pnpm --filter backend build

FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages/db ./packages/db

EXPOSE 3000
CMD ["node", "dist/main.js"]