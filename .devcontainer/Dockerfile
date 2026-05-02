FROM node:20-bullseye-slim

# Install basic dev tools
RUN apt-get update && apt-get install -y \
  git \
  curl \
  wget \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Upgrade npm to latest major and install Angular CLI globally
RUN npm install -g npm@11 --quiet && \
    npm install -g @angular/cli@17 --quiet

# Set working directory
WORKDIR /workspace

# Use non-root user provided by node image
USER node
