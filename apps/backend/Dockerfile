FROM node:20-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS builder
COPY . .
# We removed --frozen-lockfile to avoid the mismatch error
RUN pnpm install
RUN pnpm --filter db run generate
RUN pnpm --filter backend build

FROM base AS runner
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./package.json
COPY --from=builder /app/packages/db ./packages/db

EXPOSE 3000
CMD ["node", "dist/main.js"]