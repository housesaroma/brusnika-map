# 1) BUILD STAGE
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_YANDEX_MAPS_API_KEY
ENV VITE_YANDEX_MAPS_API_KEY=$VITE_YANDEX_MAPS_API_KEY


COPY package*.json ./
RUN npm ci --no-audit --progress=false

COPY . .
RUN npm run build

# 2) RUNTIME
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist  /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]