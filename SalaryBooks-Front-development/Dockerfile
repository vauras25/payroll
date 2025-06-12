# Stage 1: Build the Angular app
FROM node:18 as build

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build --prod

# Stage 2: Serve the app using NGINX
FROM nginx:alpine
COPY --from=build /app/dist/your-app-name /usr/share/nginx/html
EXPOSE 80
