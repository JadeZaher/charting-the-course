# Build context: charting-the-course/
# Multi-stage: build with Node, serve with a lightweight static server.

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for layer caching
COPY package.json package-lock.json* ./

RUN npm ci --prefer-offline

# Copy all source files
# vite.config.ts sets root=client/, envDir=project root, outDir=dist/public
COPY . .

# VITE_* env vars are baked at build time.
# Pass them via --build-arg or docker-compose build args.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve
FROM node:20-alpine

WORKDIR /app

# Copy only the built static files
COPY --from=builder /app/dist/public ./dist/public

# Use 'serve' to host the SPA; -s enables single-page-app fallback routing
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "dist/public", "-l", "3000"]
