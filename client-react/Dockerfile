FROM node:18-alpine AS build
WORKDIR /app

# Copy package manifests (supports optional package-lock.json)
COPY client-react/package*.json ./
# Use npm install to work whether or not a lockfile exists
RUN npm install --no-audit --no-fund

# Copy the rest of the client source and build
COPY client-react/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html

# Copy custom Nginx config to handle SPA routing
COPY client-react/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
