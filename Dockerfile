# Use an official Node runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Angular app with production configuration
RUN npm run build -- --configuration=production

# Install a simple HTTP server to serve the static content
RUN npm install -g http-server

# Expose the port the app runs on
EXPOSE 4200

# Start the HTTP server
CMD ["http-server", "dist/smart-healthcare-appointment/browser", "-p", "4200"]