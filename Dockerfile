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

COPY --from=builder /build/node_modules node_modules
COPY --from=builder /build/package.json package.json
COPY --from=builder /build/package-lock.json package-lock.json
COPY --from=builder /build/dist dist

RUN chown -R node:node /app

USER node

ENTRYPOINT ["node", "/app/dist/index.js"]
