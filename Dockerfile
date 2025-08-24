# syntax=docker/dockerfile:1

############################
# Base
############################
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
# Next.js na Alpine potrzebuje tego pakietu
RUN apk add --no-cache libc6-compat

############################
# Dependencies (pnpm)
############################
FROM base AS deps
# Użyj pnpm z Corepack (polecane)
RUN corepack enable
COPY package.json pnpm-lock.yaml* ./
# cache na store pnpm = szybsze buildy
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

############################
# Build
############################
FROM base AS builder
RUN corepack enable
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Jeśli używasz zmiennych env do builda, podaj je tutaj przez --build-arg/ARG lub docker build --build-arg
RUN pnpm build

############################
# Runtime (standalone)
############################
FROM base AS runner
# Nieobowiązkowe: bezpieczny użytkownik
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
USER nextjs

ENV PORT=3000
EXPOSE 3000

# Kopiujemy wynik 'standalone' + statyczne assets + public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Serwer Nexta w trybie standalone wystawia plik server.js
CMD ["node", "server.js"]
