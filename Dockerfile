FROM node:22-alpine
WORKDIR /app
ARG PAYLOAD_URL=http://localhost:3000
ENV PAYLOAD_URL=$PAYLOAD_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4321
ENV HOST=0.0.0.0
ENV PORT=4321
CMD ["node", "./dist/server/entry.mjs"]
