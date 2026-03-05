# Client Dockerfile - build with Vite and serve static files with nginx
FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
ARG VITE_SOCKET_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
RUN npm run build

FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
