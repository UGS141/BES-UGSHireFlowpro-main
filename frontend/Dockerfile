# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json yarn.lock* package-lock.json* ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .

# Set build-time env variables
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

# Production stage
FROM nginx:stable-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
