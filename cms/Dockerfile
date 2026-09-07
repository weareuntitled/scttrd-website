# SCTTRD CMS (Payload 3) — Production build
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
ENV NODE_ENV=production
RUN npm run generate:types || true
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=base /app/.next ./.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./package.json
COPY --from=base /app/.npmrc ./
COPY --from=base /app/src ./src
COPY --from=base /app/tsconfig.json ./tsconfig.json
COPY --from=base /app/next.config.ts ./next.config.ts
COPY --from=base /app/next-env.d.ts ./next-env.d.ts
EXPOSE 3000
CMD ["npm", "run", "start"]