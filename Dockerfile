# 🏗️ Build stage
FROM node:18 AS build

WORKDIR /app

# Copy root-level config and dependencies
COPY package*.json ./
COPY .npmrc* ./

# Install frontend dev dependencies
RUN npm ci --legacy-peer-deps || true

# Copy the full project (including backend_sqlite)
COPY . .

# Build frontend if a build script exists
RUN if grep -q "\"build\"" package.json ; then npm run build || true ; fi

# Install backend dependencies with dev omitted
RUN cd backend_sqlite && npm install --omit=dev --legacy-peer-deps

# 🧼 Final production image
FROM node:18-slim

WORKDIR /app
ENV NODE_ENV=production

# Copy built frontend and backend into final image
COPY --from=build /app/dist ./dist
COPY --from=build /app/backend_sqlite ./backend_sqlite
COPY --from=build /app/package.json ./package.json

# Set working directory to backend and expose port
WORKDIR /app/backend_sqlite
EXPOSE 3000

# Start backend server
CMD ["node", "server.js"]