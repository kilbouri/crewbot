FROM node:16

WORKDIR /app

# Dependency layer
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install

# Build layer
COPY ./src src
COPY ./tsconfig.json tsconfig.json
RUN yarn build

# Execution layer
CMD yarn host
