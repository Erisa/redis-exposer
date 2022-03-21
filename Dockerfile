FROM node:16-alpine

RUN apk add --no-cache git

WORKDIR /app
COPY . /app/

RUN yarn install --prod --frozen-lockfile
ENTRYPOINT ["node", "/app/index.js"]
