# Crewbot

A Discord bot to enhance Among Us games in voice channels.

## Build & Run

### Development

Just run `yarn dev`. No build is required, as the bot will run in `ts-node`. You can use `yarn dev-pretty` to run with prettified logs.

### Production/Hosting

#### Option 1 - Docker

1. Copy `/data/config.example.json5` to `/data/config.json5` and fill in the fields
2. Run `docker compose up -d` (`-d` automatically detaches you from the container)

Done!

#### Option 2 - Yarn

1. Copy `/data/config.example.json5` to `/data/config.json5` and fill in the fields
2. `yarn build` to transpile TypeScript to JavaScript
3. `yarn host` to start the bot
