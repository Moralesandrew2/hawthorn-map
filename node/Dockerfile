# Use Node.js base image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy all files to container
COPY . .

# Expose port 8080 (Cloud Run's default port)
EXPOSE 8080

# Start the server (replace with your server entry file)
CMD ["node", "server.js"]
