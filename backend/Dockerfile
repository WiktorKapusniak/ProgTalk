# Stage 1: Build frontend
FROM node:22 AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend with built frontend
FROM node:18
WORKDIR /app

# Copy backend files
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy built frontend from stage 1
COPY --from=frontend-build /frontend/dist ./public

EXPOSE 5000

CMD ["npm", "run", "dev"]
