# Step 1: Use a Node.js image as the base image
FROM node:16 AS build

# Step 2: Set the working directory
WORKDIR /app

# Step 3: Copy the package.json and package-lock.json (or yarn.lock) to install dependencies
COPY package*.json ./

# Step 4: Install the app dependencies
RUN npm install

# Step 5: Copy the rest of the app's source code
COPY . .

# Step 6: Build the React app for production
RUN npm run build

# Step 7: Install a static file server (serve) to serve the built app
RUN npm install -g serve

# Step 8: Expose port 8080 for Cloud Run
EXPOSE 8080

# Step 9: Start the server and serve the production build on port 8080
CMD ["serve", "-s", "build", "-l", "8080"]
