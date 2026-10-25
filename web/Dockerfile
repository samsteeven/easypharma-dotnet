# Multi-stage Dockerfile for Angular Frontend
# Stage 1: Build
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve
FROM nginx:alpine

# Copy static files to nginx
COPY --from=build /app/dist/medi-find/browser /usr/share/nginx/html

# Copie de la config Nginx perso
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
