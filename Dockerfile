# shopify-inventory-mcp — Streamable HTTP MCP for Railway (or any container host)
FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

# Railway sets PORT; default for local docker runs
ENV PORT=3000
ENV HOST=0.0.0.0
EXPOSE 3000

USER node
CMD ["node", "dist/http-server.js"]
