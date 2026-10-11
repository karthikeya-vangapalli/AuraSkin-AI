# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Update nginx conf to handle React router
RUN echo 'server { \
    listen 3000; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/v1/auth/ { \
        proxy_pass http://user-service:8001; \
    } \
    location /api/v1/users/ { \
        proxy_pass http://user-service:8001; \
    } \
    location /api/v1/clinical/ { \
        proxy_pass http://user-service:8001; \
    } \
    location /api/v1/profile/ { \
        proxy_pass http://profile-service:8002; \
    } \
    location /api/v1/lifestyle/ { \
        proxy_pass http://profile-service:8002; \
    } \
    location /api/v1/progress/ { \
        proxy_pass http://profile-service:8002; \
    } \
    location /api/v1/skin/ { \
        proxy_pass http://ai-skin-service:8003; \
    } \
    location /api/v1/ingredients/ { \
        proxy_pass http://ai-skin-service:8003; \
    } \
    location /api/v1/products/ { \
        proxy_pass http://ai-skin-service:8003; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
