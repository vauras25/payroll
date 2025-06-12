# Step 1: Build Angular app
FROM node:18 AS builder

WORKDIR /app

# Install dependencies with compatibility mode
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy full source code and build
COPY . .
RUN npm run build --prod

# Step 2: Serve app using nginx
FROM nginx:alpine

# Replace with your actual Angular output folder name inside /dist/
COPY --from=builder /app/dist/SalaryBooks-Front-development /usr/share/nginx/html

# Copy default nginx config (optional but recommended for Angular routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
