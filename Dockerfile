FROM node:20-alpine as build
WORKDIR /opt/app
ADD package*.json ./
RUN npm ci
ADD . .
RUN npm run generate:common
RUN npm run generate:movies
RUN npm run build

FROM node:20-alpine
WORKDIR /opt/app
ADD package*.json ./
RUN apk add --no-cache curl
RUN npm ci --omit=dev
COPY --from=build ./opt/app/prisma ./prisma
COPY --from=build ./opt/app/assets ./assets
COPY --from=build ./opt/app/dist ./dist
ENV NODE_ENV production
CMD ["npm", "run", "start:production"]
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s CMD curl -f http://localhost:3000/healthz || exit 1
