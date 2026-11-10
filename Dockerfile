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

# VITE_API_URL is for the Vite dev server. The production bundle calls same-origin
# /api (apiBaseUrl), so a value baked here does not change where the browser sends requests.
ARG VITE_API_URL=
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve static files with nginx, and proxy /api and /messaging/ws to the NEOS API.
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files
COPY --from=builder /app/dist/public /usr/share/nginx/html

# Railway provides PORT env var dynamically
EXPOSE 3000

# Upstream defaults. Override both at runtime to point the proxy elsewhere; neither is required.
# BACKEND_URL must not end with a slash. envsubst lists only these names so nginx's $variables survive.
ENV BACKEND_URL=https://neos-operating-system-production.up.railway.app
ENV BACKEND_HOST=neos-operating-system-production.up.railway.app
CMD envsubst '\$PORT \$BACKEND_URL \$BACKEND_HOST' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf && mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'
