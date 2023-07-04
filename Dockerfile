# Multi-stage
# 1) Node image for building frontend assets
# 2) Nginx stage to serve frontend assets

# Name the node stage "builder"
FROM node:18 AS builder
# Setting this manually for the moment but find a way to make this automated.
# JAVASCRIPT HEAP OUT OF MEMORY IN DOCKER IMAGE RUN-DOCKER
# https://www.appsloveworld.com/docker/100/12/javascript-heap-out-of-memory-in-docker-image-run
ENV NODE_OPTIONS=--max_old_space_size=2048
# Install pnpm
RUN npm install --global pnpm
# Set working directory
WORKDIR /app
COPY pnpm-lock.yaml ./
# Copy all files from current directory to working dir in image
ADD . ./
RUN pnpm install
# Build assets
RUN pnpm run build

# nginx state for serving content
FROM nginx:alpine
# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html
# Remove default nginx static assets
RUN rm -rf ./*
# Copy static assets from builder stage
COPY --from=builder /app/dist .
# Containers run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]