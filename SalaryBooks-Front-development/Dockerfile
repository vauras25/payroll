# Step 1: Build Angular app
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build --prod

# Step 2: Serve app using nginx
FROM nginx:alpine
COPY --from=builder /app/dist/YOUR_PROJECT_NAME /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
