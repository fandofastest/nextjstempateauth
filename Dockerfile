# Multi-stage Dockerfile for Next.js 15 app
# Base image with Debian for native deps like sharp
FROM node:20-bullseye AS deps
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --no-audit --no-fund

# Build stage
FROM node:20-bullseye AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB=$NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
RUN npm run build

# Runtime image
FROM node:20-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB=$NEXT_PUBLIC_UPLOAD_MAX_SIZE_MB

# Copy only what is needed to run
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY package.json ./

# Ensure uploads dir exists at runtime (bind mount will overwrite if provided)
RUN mkdir -p /app/uploads

EXPOSE 3000

CMD ["npm", "run", "start"]
