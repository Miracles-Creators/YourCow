FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY packages/backend/package.json packages/backend/
COPY packages/nextjs/package.json packages/nextjs/
COPY packages/snfoundry/package.json packages/snfoundry/
RUN yarn install --immutable --mode=skip-build

FROM base AS builder
COPY --from=deps /app /app
COPY packages/backend packages/backend
RUN cd packages/backend && DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate
RUN cd packages/backend && yarn build

FROM base AS runner
WORKDIR /app
COPY --from=builder /app/node_modules node_modules
COPY --from=builder /app/packages/backend/dist packages/backend/dist
COPY --from=builder /app/packages/backend/node_modules packages/backend/node_modules
COPY --from=builder /app/packages/backend/prisma packages/backend/prisma
COPY --from=builder /app/packages/backend/package.json packages/backend/package.json
EXPOSE 3001
CMD ["node", "packages/backend/dist/main.js"]
