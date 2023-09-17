# A Discord Bot

This is a template!

## Features

- TypeScript
- Minimal configuration setup
- Slash command and event handlers
- Dockerfile for deployment

## Build & Run

### Development

Just run `yarn dev`. No build is required, as the bot will run in `ts-node`. You can use `yarn dev-pretty` to run with prettified logs.

### Production/Hosting

#### Option 1 - Docker

1. Copy `config.example.json5` to `config.json5` and fill in the fields
2. Build a docker image: `docker build -t bot .`
3. Start a container from that image: `docker run bot`

Done!

#### Option 2 - Yarn

1. Copy `config.example.json5` to `config.json5` and fill in the fields
2. `yarn build` to transpile TypeScript to JavaScript
3. `yarn host` to start the bot

> Building and hosting are separated because changes to `config.json5` do not require a complete re-build of the bot.
