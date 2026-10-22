FROM node:26-alpine

RUN apk add --no-cache git

WORKDIR /app
COPY . /app/

RUN npm ci
ENTRYPOINT ["node", "/app/index.js"]
