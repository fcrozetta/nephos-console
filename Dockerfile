# syntax=docker/dockerfile:1
# Multi-stage build for the SvelteKit (adapter-node) console.
FROM node:22-alpine AS build
WORKDIR /app
RUN npm install -g pnpm@11
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build
# Drop dev dependencies so only runtime deps ship in the final image.
RUN pnpm prune --prod

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
