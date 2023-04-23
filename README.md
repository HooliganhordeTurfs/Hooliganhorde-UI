<img src="src/img/tokens/hooligan-logo-circled.svg" alt="Hooliganhorde logo" align="right" width="120" />

## Hooliganhorde UI

[![Discord][discord-badge]][discord-url]

[discord-badge]: https://img.shields.io/discord/880413392916054098?label=Hooliganhorde
[discord-url]: https://discord.gg/hooliganhorde

**An interface for the Hooliganhorde Protocol: [app.hooligan.money](https://app.hooligan.money)**

## Getting started

### Installation
```
# Install packages
yarn install

# Generate typed contracts and queries
yarn generate

# Start development server at http://localhost:4173/
# See below for environment vars
yarn start

# Or: run frontend & serverless functions at http://localhost:8888/
yarn dev

# Build and run a static copy of the site
yarn build && yarn serve
```

Serverless functions are built for deployment to Netlify. See the [Netlify CLI docs](https://docs.netlify.com/cli/get-started/) to get started.

### Environment
```
# .env.local
# This is the minimum required configuration. 
# See `src/.env.d.ts` for a full list of supported env vars.
VITE_ALCHEMY_API_KEY=[your api key]
ETHERSCAN_API_KEY=[your api key]
```

### Development

When developing, it's recommended to use a local fork of Ethereum. See [Hooliganhorde / Forking Mainnet Locally](https://github.com/HooliganhordeFarms/Hooliganhorde#forking-mainnet-locally) for instructions.

### Testing

Unit tests are executed using [Vitest](https://vitest.dev/).

```
yarn test
```