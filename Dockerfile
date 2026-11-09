# Documentation references added during final review (9 November 2026).
# DOCKER: https://docs.docker.com/compose/
# See docs/PROJECT-ATTRIBUTIONS.md for scope and provenance distinctions.
FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src

USER node
EXPOSE 5443

CMD ["node", "src/server.js"]
