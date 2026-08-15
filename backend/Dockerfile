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
# node:22-alpine ships an unprivileged `node` user (uid 1000); a container that starts as root
# has no way to drop privileges later, so own everything up front and switch before CMD runs.
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/prisma ./prisma
USER node
EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/src/main"]
