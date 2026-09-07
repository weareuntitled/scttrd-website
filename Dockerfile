FROM node:22-alpine
WORKDIR /app
ARG PAYLOAD_URL=http://localhost:3000
ENV PAYLOAD_URL=$PAYLOAD_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4321"]
