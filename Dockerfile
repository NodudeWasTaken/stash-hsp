# Stage 1: Build stage
FROM oven/bun:alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to WORKDIR
COPY package*.json ./

# Copy the rest of the project files to WORKDIR
COPY . .

# Bundle the project using bun
RUN bun install && bun bundle

# Stage 2: Production stage
FROM oven/bun:alpine AS production

# Set working directory inside the container
WORKDIR /app

# Copy only necessary files from the build stage
COPY --from=build /app/out ./out
COPY --from=build /app/package*.json ./

# Install production dependencies
RUN bun install --only=production

# Add libvips
RUN apk add --no-cache vips-dev

# Command to run when the container starts
CMD ["bun", "run", "out/index.js"]
