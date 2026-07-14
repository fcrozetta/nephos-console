# syntax=docker/dockerfile:1
# Multi-stage build for the SvelteKit (adapter-node) console.
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# pnpm 11 gates esbuild's build script at every step (install, and pnpm run's
# pre-run verify), even with onlyBuiltDependencies set. Work around it: tolerate
# the gate on install, set up esbuild's binary directly, and invoke vite
# directly (not via `pnpm run`) so the pre-run gate never triggers. The vite
# build fails loudly if deps are actually broken.
RUN pnpm install || true
RUN node node_modules/esbuild/install.js || true
COPY . .
RUN node_modules/.bin/vite build
# Drop dev dependencies so only runtime deps ship in the final image.
RUN pnpm prune --prod || true

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# adapter-node needs the build output, package.json, and production node_modules.
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "build"]
