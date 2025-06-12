# ---------- STEP 1: Build Angular App ----------
FROM node:14.20.0 AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copy project files and build
COPY . .
RUN npm run build --prod
RUN npm install --legacy-peer-deps


# ---------- STEP 2: Serve using Nginx ----------
FROM nginx:alpine

# Copy Angular dist files from builder
COPY --from=builder /app/dist/SalaryBooks-Front-development /usr/share/nginx/html

# Copy custom nginx config to support Angular routes
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
