# Use official Node.js Alpine image
FROM node:24-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=node:node package.json package-lock.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy only required application files
COPY --chown=node:node app.js server.js ./

COPY --chown=node:node config/ ./config/
COPY --chown=node:node middleware/ ./middleware/
COPY --chown=node:node models/ ./models/
COPY --chown=node:node routes/ ./routes/
COPY --chown=node:node database/ ./database/

# Run application as non-root user
USER node

# Expose backend port
EXPOSE 5000

# Start backend
CMD ["node", "server.js"]