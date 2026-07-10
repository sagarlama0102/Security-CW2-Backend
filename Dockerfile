# ===== BUILD STAGE =====
FROM node:20-alpine AS builder

WORKDIR /app

# copy package files first (better layer caching)
COPY package*.json ./

# install all dependencies including dev
RUN npm ci

# copy source code
COPY . .

# compile TypeScript to JavaScript
RUN npm run build

# ===== PRODUCTION STAGE =====
FROM node:20-alpine AS production

WORKDIR /app

# create non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# copy package files
COPY package*.json ./

# install only production dependencies
RUN npm ci --omit=dev

# copy compiled code from builder stage
COPY --from=builder /app/dist ./dist

# copy uploads folder
COPY --from=builder /app/uploads ./uploads

# create logs directory and set ownership
RUN mkdir -p logs && chown -R nodejs:nodejs /app

# switch to non-root user
USER nodejs

# expose the app port
EXPOSE 4000

# start the app
CMD ["node", "dist/index.js"]