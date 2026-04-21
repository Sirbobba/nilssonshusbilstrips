# Base image med Node.js
FROM node:22-bookworm-slim AS base

# Installera systemberoenden för C++ build, python, och bildbearbetning (för Sharp med HEIC stöd)
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    libvips-dev \
    libheif-dev \
    && rm -rf /var/lib/apt/lists/*

# Installera dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Använder sharp's förbyggda Linux-binär (fungerar perfekt på Cloud Run)
# HEIC-stöd läggs till senare när bilduppladdningen byggs
RUN npm ci

# Bygg applikationen
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_-variabler måste vara tillgängliga vid BYGGTID
# (de bränns in i JavaScript-paketet av Next.js)
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_THUNDERFOREST_API_KEY

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_THUNDERFOREST_API_KEY=$NEXT_PUBLIC_THUNDERFOREST_API_KEY

RUN npm run build

# Produktionsmiljö
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Tillåt public tillgång via standardport i Cloud Run
EXPOSE 8080
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
