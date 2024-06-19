# Base node image:
FROM node:20-alpine AS base
RUN yarn set version berry
RUN yarn config set enableGlobalCache true
RUN yarn config set globalFolder /usr/local/share/.cache/yarn2

# Installing dev dependencies:
FROM base AS install-dev-dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn2,rw yarn
COPY prisma tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npx prisma generate

# Installing prod dependencies:
FROM base AS install-prod-dependencies
ENV NODE_ENV production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,sharing=locked,target=/usr/local/share/.cache/yarn2,rw yarn workspaces focus --all --production
COPY prisma tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npx prisma generate

# Creating a build:
FROM base AS create-build
ENV NODE_ENV production
WORKDIR /app
COPY . .
COPY --from=install-dev-dependencies /app ./
RUN yarn run build
USER node

# Running the application:
FROM base AS run
ENV NODE_ENV production
WORKDIR /app
COPY --from=create-build /app/build ./
COPY --from=install-prod-dependencies /app/node_modules ./node_modules

COPY entrypoint.sh ./
CMD ["/bin/sh", "entrypoint.sh"]

