# Stage 1: Build the static files
FROM node:20-slim AS builder
# Enable pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Copy the entire monorepo root to access workspace config
COPY . .

# Install dependencies (using the root lockfile)
RUN pnpm install

# Build only the frontend app
RUN pnpm --filter frontend build

# Stage 2: Serve with Nginx
FROM nginx:stable-alpine AS runner

# Copy the build output from the builder stage to Nginx's html folder
# NOTE: If your Vite config uses a folder other than 'dist', change this path.
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Expose port 80 for web traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]