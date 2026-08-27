
# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy dependency manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/trpc/package.json packages/trpc/package.json

RUN pnpm install --frozen-lockfile

COPY . .

# Build-time variable for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

#test
RUN echo "=== [1] DOCKER ARG CHECK ===" && echo "VITE_API_URL: '$VITE_API_URL'"

# Build web and its dependencies
RUN pnpm turbo build --filter=@slotly/web...

# Stage 2: static server
FROM nginx:alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# Проверка: проверяем наличие нового или отсутствие старого URL в папке apps/web/dist/
RUN echo "=== URLS FOUND IN DIST ===" && \
    grep -oE "https?://[a-zA-Z0-9.-]+" -r apps/web/dist/ | sort -u