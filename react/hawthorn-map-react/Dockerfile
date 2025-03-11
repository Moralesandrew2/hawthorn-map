# Step 1: Use a Node.js image as the base image
FROM node:16 AS build

# Step 2: Install gettext (which provides envsubst)
RUN apt-get update && apt-get install -y gettext

# Step 3: Set the working directory
WORKDIR /app

# Step 4: Copy the package.json and package-lock.json (or yarn.lock) to install dependencies
COPY package*.json ./  

# Step 5: Install the app dependencies
RUN npm install

# Step 6: Copy the rest of the app's source code
COPY . .

# Step 7: Build the React app for production
RUN npm run build

# Step 8: Install a static file server (serve) to serve the built app
RUN npm install -g serve

# Step 9: Expose port 8080 for Cloud Run
EXPOSE 8080

# Step 10: Add the API key as an ARG and use it during build time
ARG REACT_APP_GOOGLE_MAPS_API_KEY
RUN echo "REACT_APP_GOOGLE_MAPS_API_KEY=${REACT_APP_GOOGLE_MAPS_API_KEY}" > .env && \
    envsubst < .env > .env.production

# Step 11: Start the server and serve the production build on port 8080
CMD ["serve", "-s", "build", "-l", "8080"]
