FROM node:24-alpine AS development-dependencies-env
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

FROM node:24-alpine AS production-dependencies-env
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM node:24-alpine AS build-env
WORKDIR /app
RUN corepack enable
COPY --from=development-dependencies-env /app /app
RUN pnpm run build

FROM node:24-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
COPY --from=production-dependencies-env /app/node_modules ./node_modules
COPY --from=build-env /app/build ./build
ENV PORT=3003
EXPOSE 3003
CMD ["pnpm", "run", "start"]
