# syntax=docker/dockerfile:1
# Derleme bağlamı depo köküdür:  docker build -f web/Dockerfile .

FROM node:24-bookworm-slim AS build
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web ./
RUN npm run build

# Yetkisiz kullanıcıyla çalışan nginx: statik dosyaları sunar ve /api isteklerini API'ye iletir.
FROM nginxinc/nginx-unprivileged:stable-alpine AS final
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /web/dist /usr/share/nginx/html
EXPOSE 8080
