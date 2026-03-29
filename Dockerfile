# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_BACKEND_PROTOCOL
ARG VITE_BACKEND_HOST
ARG VITE_BACKEND_PORT
ARG VITE_BACKEND_BASE_PATH



RUN VITE_BACKEND_PROTOCOL=$VITE_BACKEND_PROTOCOL \
    VITE_BACKEND_HOST=$VITE_BACKEND_HOST \
    VITE_BACKEND_PORT=$VITE_BACKEND_PORT \
    VITE_BACKEND_BASE_PATH=$VITE_BACKEND_BASE_PATH \
    npm run build

FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 3011

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3011/health >/dev/null || exit 1
