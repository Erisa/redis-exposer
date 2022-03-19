FROM node:16-alpine

WORKDIR /app
ADD . /app

RUN apk add --no-cache git
RUN yarn install --prod --frozen-lockfile
ENTRYPOINT ["node", "/app/index.js"]
