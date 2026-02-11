# frontend-build
FROM node:22 AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run dir-out

# backend-build
FROM node:18
WORKDIR /app

COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Copy built frontend files from frontend-build stage
COPY --from=frontend-build /backend/public ./public

EXPOSE 5000

CMD ["npm", "run", "dev"]
