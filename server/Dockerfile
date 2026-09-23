FROM oven/bun:1.2 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1.2 AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY src ./src
COPY seed.ts ./seed.ts
COPY package.json bun.lock ./
EXPOSE 5000
USER bun
CMD ["bun", "src/server.ts"]