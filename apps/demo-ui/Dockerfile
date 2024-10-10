FROM node:20-alpine AS base

FROM base AS builder
RUN apk update
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

RUN yarn global add turbo@^2
COPY . .

# Generate a partial monorepo with a pruned lockfile for a target workspace.
# Assuming "web" is the name entered in the project's package.json: { name: "web" }
RUN turbo prune @showtime-ai/demo-ui --docker

# Add lockfile and package.json's of isolated subworkspace
FROM base AS installer
RUN apk update
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install the dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/yarn.lock ./yarn.lock
RUN yarn install

# Build the project
ARG API_URL
ENV REACT_APP_API_URL ${API_URL}
COPY --from=builder /app/out/full/ .
RUN yarn turbo run build --filter=@showtime-ai/demo-ui

# Bundle static assets with nginx
FROM nginx:1.27.0-alpine as production
ENV NODE_ENV production
# Copy built assets from builder
COPY --from=installer /app/apps/demo-ui/build /usr/share/nginx/html
# Add your nginx.conf
COPY apps/demo-ui/nginx.conf /etc/nginx/conf.d/default.conf
# Expose port
EXPOSE 80
# Start nginx
CMD ["nginx", "-g", "daemon off;"]