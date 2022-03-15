FROM node:16-alpine

WORKDIR /app
ADD . /app

RUN apk add --no-cache git
RUN yarn install
ENTRYPOINT yarn start
