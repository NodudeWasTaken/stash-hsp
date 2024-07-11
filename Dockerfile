# Stage 1: Build stage
FROM oven/bun:alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to WORKDIR
COPY package*.json ./

# Copy the rest of the project files to WORKDIR
COPY . .

# Bundle the project using bun
RUN bun install --production && bun bundle

# Stage 2: Production stage
FROM oven/bun:alpine AS production

# Set working directory inside the container
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/build ./build
COPY --from=build /app/package*.json ./

# Add libvips
RUN apk add --no-cache vips-dev

# Install production dependencies
RUN bun install --production

# Command to run when the container starts
CMD ["bun", "run", "build/index.js"]
