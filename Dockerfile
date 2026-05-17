# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage - serve with nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files
COPY --from=build /app/dist /usr/share/nginx/html

# Railway uses PORT env var
CMD sed -i "s/listen 80/listen ${PORT:-80}/" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'

EXPOSE ${PORT:-80}
