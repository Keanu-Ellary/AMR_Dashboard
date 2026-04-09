FROM node:20-alpine

# Install OpenSSL for Prisma client
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the application (adjust if you are not using a build step)
RUN npm run build

# Expose port (adjust if your app uses a different port)
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
