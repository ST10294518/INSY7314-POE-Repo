# Documentation references added during final review (9 November 2026).
# DOCKER: https://docs.docker.com/compose/
# See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
FROM node:24-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:stable-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 8443
