# Stage 1: Build stage
FROM oven/bun:alpine AS build

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to WORKDIR
COPY package*.json ./

# Copy the rest of the project files to WORKDIR
COPY . .

# Add libvips
RUN apk add --no-cache vips-dev

# Bundle the project using bun
RUN bun install --production

# Command to run when the container starts
CMD ["bun", "start"]
