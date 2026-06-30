FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate
# python3/make/g++ are required to build bcrypt's native binding on alpine (musl),
# which has no prebuilt binary and falls back to compiling from source.
RUN apk add --no-cache python3 make g++

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm prisma:generate
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main"]
