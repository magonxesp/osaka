FROM node:24.19.0 AS builder

WORKDIR /build

COPY package.json package.json
COPY package-lock.json package-lock.json

RUN npm install

COPY . .

RUN npm run build

FROM node:24.19.0

WORKDIR /app

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update \
    && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /build/node_modules node_modules
COPY --from=builder --chown=node:node /build/package.json package.json
COPY --from=builder --chown=node:node /build/package-lock.json package-lock.json
COPY --from=builder --chown=node:node /build/dist dist

USER node

ENTRYPOINT ["node", "/app/dist/index.js"]
