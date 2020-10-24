# Yearn Vaults Subgraph

![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://github.com/iearn-finance/yearn-subgraph/workflows/Build/badge.svg)
![Lint](https://github.com/iearn-finance/yearn-subgraph/workflows/Lint/badge.svg)

Subgraph to track yearn vaults metrics on Mainnet.

## Setup

- Copy `.envrc.example` to `.envrc`.
- Set `ACCESS_TOKEN` to your The Graph [access token](https://thegraph.com/docs/deploy-a-subgraph#store-the-access-token).
- Set `GRAPH_PATH` to `<github-username>/<subgraph-name>`.
- Export `.envrc` variables.

## Running

- `yarn` – install dependencies
- `yarn codegen` – generate code
- `yarn create` – allocate subgraph name in Graph Node
- `yarn deploy` - deploy supgraph to Graph Node
- `yarn publish-graph` – run all steps in one command

See `package.json` for local deployment.

## Tracking

Total revenue per vault:

```graphql
{
  vaultUpdates(orderBy: timestamp, orderDirection: desc, first: 1) {
    timestamp
    blockNumber
    earnings
  }
}
```

Total performance fee per vault (see [note](https://docs.yearn.finance/faq#can-you-explain-the-5-fee-on-additional-yield)):

```graphql
{
  vaultUpdates(orderBy: timestamp, orderDirection: desc, first: 1) {
    timestamp
    blockNumber
    performanceFees
  }
}
```

Total withdrawal fee per vault:

```graphql
{
  vaultUpdates(orderBy: timestamp, orderDirection: desc, first: 1) {
    timestamp
    blockNumber
    withdrawalFees
  }
}
```

Total withdrawal volume per vault:

```graphql
{
  vaultUpdates(orderBy: timestamp, orderDirection: desc, first: 1) {
    timestamp
    blockNumber
    withdrawals
  }
}
```
