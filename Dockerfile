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
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve static files with nginx
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Railway provides PORT env var dynamically
EXPOSE 3000

# Only PORT needs substitution now (no more backend proxy vars)
CMD envsubst '\$PORT' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
