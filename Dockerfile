# Base node image:
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
RUN apt-get update && apt-get install -y openssl

# Installing dev dependencies:
FROM base AS install-dev-dependencies
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma tsconfig.json tsconfig.build.json nest-cli.json ./
RUN --mount=type=cache,sharing=locked,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Installing prod dependencies:
FROM base AS install-prod-dependencies
ENV NODE_ENV production
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
COPY prisma tsconfig.json tsconfig.build.json nest-cli.json ./
RUN --mount=type=cache,sharing=locked,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# Creating a build:
FROM base AS create-build
ENV NODE_ENV production
WORKDIR /app
COPY . .
COPY --from=install-dev-dependencies /app ./
RUN pnpm run build
USER node

# Running the application:
FROM base AS run
ENV NODE_ENV production
WORKDIR /app
COPY --from=create-build /app/dist ./
COPY --from=install-prod-dependencies /app/node_modules ./node_modules

COPY entrypoint.sh ./
CMD ["/bin/sh", "entrypoint.sh"]

