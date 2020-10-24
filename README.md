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

## Entities

### Vault

The `Vault` entity is the most relevant one on this subgraph, since it holds most of the data related to the scope of the Vault, like vault balance (how much of the base token the vault has), strategy balance (how much of that base token is invested in the strategy), aggregated data for deposits, withdrawals, earnings, links to other related entities such as the Controller and Strategy, and many more.

```graphql
type Vault @entity {
  id: ID!

  "Amount of underlying token that a full share of <yToken> represents"
  pricePerFullShare: BigDecimal!

  pricePerFullShareRaw: BigInt!

  totalSupply: BigDecimal!

  totalSupplyRaw: BigInt!

  "Balance of the Vault contract of underlying Token + balance of the Strategy contract of underlying Token"
  vaultBalance: BigDecimal!

  "Balance of underlying Token specifically held in the strategy"
  strategyBalance: BigDecimal!

  "How much the vault allows to be borrowed"
  available: BigDecimal!

  "Balance of the Vault contract of underlying Token + balance of the Strategy contract of underlying Token"
  vaultBalanceRaw: BigInt!

  "Balance of underlying Token specifically held in the strategy"
  strategyBalanceRaw: BigInt!

  "How much the vault allows to be borrowed"
  availableRaw: BigInt!

  "Token accepted as deposit on the Vault"
  underlyingToken: Token!

  "yToken minted as shares by the Vault"
  shareToken: Token!

  currentController: Controller!

  currentStrategy: Strategy!

  "Transaction metadata for the last update"
  transaction: Transaction!

  "totalDeposited - totalWithdrawn. Considers all deposits of underlying made by external accounts"
  netDeposits: BigDecimal!

  totalDeposited: BigDecimal!

  totalWithdrawn: BigDecimal!

  "totalSharesMinted - totalSharesBurned"
  totalActiveShares: BigDecimal!

  totalSharesMinted: BigDecimal!

  totalSharesBurned: BigDecimal!

  netDepositsRaw: BigInt!

  totalDepositedRaw: BigInt!

  totalWithdrawnRaw: BigInt!

  totalActiveSharesRaw: BigInt!

  totalSharesMintedRaw: BigInt!

  totalSharesBurnedRaw: BigInt!

  totalEarnings: BigDecimal!

  totalEarningsRaw: BigInt!

  totalHarvestCalls: BigInt!

  transfers: [Transfer!]! @derivedFrom(field: "vault")

  deposits: [Deposit!]! @derivedFrom(field: "vault")

  withdrawals: [Withdrawal!]! @derivedFrom(field: "vault")

  harvests: [Harvest!]! @derivedFrom(field: "vault")

  balances: [AccountVaultBalance!]! @derivedFrom(field: "vault")

  strategies: [Strategy!]! @derivedFrom(field: "vault")

  controllers: [Controller!]! @derivedFrom(field: "vault")
}
```

#### Account

The `Acount` entity represents an ethereum address that interacted with the protocol (at least 1 Vault). This entity is only really there to centralize all the data for a specific user, such as all the user balances (one for each vault, more on that later), all the deposits, withdrawals and transfer that the account is related to.

```graphql
type Account @entity {
  "Ethereum address of the user"
  id: ID!

  vaultBalances: [AccountVaultBalance!]! @derivedFrom(field: "account")

  "Deposits that are related to this account"
  deposits: [Deposit!]! @derivedFrom(field: "account")

  "Withdrawals that are related to this account"
  withdrawals: [Deposit!]! @derivedFrom(field: "account")

  "Transfers that are sent to this account"
  receivedTransfers: [Transfer!]! @derivedFrom(field: "to")

  "Transfers that are sent from this account"
  sentTransfers: [Transfer!]! @derivedFrom(field: "from")
}
```

#### AccountVaultBalance

This entity represent the balance (or position) of an Account within a specific Vault (hence the name). It has a lot of aggregated values that are tracked by following the minting/burning of shares of the yToken, which allow for tracking of the underlying token movement as well as the share token movements (such as deposits, withdrawals and transfers), and aggregation of those values to know the total amount of each of the possible fields. We also provide some variables that depict internal "balances" of those aggregated values, like the `netDeposits` field, which represents the balance of ingess and egress transfers ((deposits + transfersIN) - (withdrawals + transfersOUT)).

This entity does not have a real-time balance of the underlying token (with earnings included) like the `Vault` entity has, given that it's only able to be updated when ERC20 share token Transfer events occur for the specified account, and cannot be updated when earnings are calculated (Harvest), thus making it impossible to have a real-time earnings value pre-calculated. It is possible to calculate it with the values provided when you query this entity, given that it has the linked `Vault` entity which has the real-time `pricePerFullShare` value, and the `AccountVaultBalance` does keep track of the real-time `shareBalance`, and with those values you can calculate the updated underlying token balance for this specific `Account`.

```graphql
type AccountVaultBalance @entity {
  id: ID!

  vault: Vault!

  account: Account!

  "Token used on deposits/withdrawals"
  underlyingToken: Token!

  "Token received as shares"
  shareToken: Token!

  "Net deposits of a given Account within a given Vault. Transfers between accounts are taken into consideration for this metric"
  netDeposits: BigDecimal!

  "Total tokens deposited by this Account in Vault"
  totalDeposited: BigDecimal!

  "Total tokens withdrawn by this Account in Vault"
  totalWithdrawn: BigDecimal!

  "Total tokens sent to another account by this Account in Vault"
  totalSent: BigDecimal!

  "Total tokens received from another account by this Account in Vault"
  totalReceived: BigDecimal!

  "Shares are the token minted by the Vault"
  shareBalance: BigDecimal!

  totalSharesMinted: BigDecimal!

  totalSharesBurned: BigDecimal!

  totalSharesSent: BigDecimal!

  totalSharesReceived: BigDecimal!

  "Net deposits of a given Account within a given Vault. Transfers between accounts are taken into consideration for this metric"
  netDepositsRaw: BigInt!

  "Total tokens deposited by this Account in Vault"
  totalDepositedRaw: BigInt!

  "Total tokens withdrawn by this Account in Vault"
  totalWithdrawnRaw: BigInt!

  "Total tokens sent to another account by this Account in Vault"
  totalSentRaw: BigInt!

  "Total tokens received from another account by this Account in Vault"
  totalReceivedRaw: BigInt!

  "Shares are the token minted by the Vault"
  shareBalanceRaw: BigInt!

  totalSharesMintedRaw: BigInt!

  totalSharesBurnedRaw: BigInt!

  totalSharesSentRaw: BigInt!

  totalSharesReceivedRaw: BigInt!
}
```

#### Token

This entity holds information regarding ERC20 tokens present in the subgraph.

```graphql
type Token @entity {
  id: ID!

  address: Bytes!

  decimals: Int!

  name: String!

  symbol: String!
}
```

#### Transfer, Deposit, Withdraw

These entities hold the specific raw data that was processed to update the other entities to their latest state when an ERC20 Transfer from the yVault triggered (depending on the type of transfer it creates one of the 3 entities). They also track the metadata for the block that triggered it (block number, transaction hash and timestamp) and are linked to the corresponding entities that they modified. (Vault, AccountVaultBalance, etc).

#### Harvest

This entity, much like the `Transfer`, `Deposit` and `Withdraw` entity, tracks data that was used to update the state of other entities as well as metadata for the block that triggered it, whenever a harvest call is made to the strategy of a yVault.

This entity also aggregates some data, and calculate earnings gained for the yVault when it was called, which are then aggregated to the total it holds as well as the strategy total. It also track balance changes before and after the harvest() call, and `pricePerFullShare` changes too.

```graphql
type Harvest @entity {
  id: ID!

  vault: Vault!

  strategy: Strategy!

  caller: Bytes!

  pricePerFullShareBefore: BigDecimal!

  pricePerFullShareAfter: BigDecimal!

  pricePerFullShareBeforeRaw: BigInt!

  pricePerFullShareAfterRaw: BigInt!

  vaultBalanceBefore: BigDecimal!

  vaultBalanceAfter: BigDecimal!

  strategyBalanceBefore: BigDecimal!

  strategyBalanceAfter: BigDecimal!

  vaultBalanceBeforeRaw: BigInt!

  vaultBalanceAfterRaw: BigInt!

  strategyBalanceBeforeRaw: BigInt!

  strategyBalanceAfterRaw: BigInt!

  earnings: BigDecimal!

  earningsRaw: BigInt!

  transaction: Transaction!
}
```

#### Strategy and Controller

These two entities hold barely any information for each of the smart contracts that they represent (Strategy and Controller), but allow us to keep tabs of all the historical controllers and strategies that a yVault might have overtime by deriving a list of all that have a link to the yVault.

The `Strategy` entity also keeps track of all the `Harvest` entities it has created, as well as the earnings made for the Vault when it was active.

```graphql
type Strategy @entity {
  "Ethereum address"
  id: ID!

  vault: Vault!

  totalEarnings: BigDecimal!

  totalEarningsRaw: BigInt!

  harvests: [Harvest!]! @derivedFrom(field: "strategy")

  activeOnVaults: [Vault!] @derivedFrom(field: "currentStrategy")
}

type Controller @entity {
  "Ethereum address"
  id: ID!

  vault: Vault!

  activeOnVaults: [Vault!] @derivedFrom(field: "currentController")
}
```

#### Transaction

This entity tracks metadata for specific transactions, as well as some derived data for all the deposits, withdrawals, transfers, harvests performed on it, as well as tracking a list of all the vaults that were last updated on that transaction.

```graphql
type Transaction @entity {
  "ID = Transaction Hash"
  id: ID!

  timestamp: BigInt!

  blockNumber: BigInt!

  "Duplicated field to allow for byte search with transactionHash_contains"
  transactionHash: Bytes!

  deposits: [Deposit!]! @derivedFrom(field: "transaction")

  withdrawals: [Withdrawal!]! @derivedFrom(field: "transaction")

  transfers: [Transfer!]! @derivedFrom(field: "transaction")

  harvests: [Harvest!]! @derivedFrom(field: "transaction")

  "List of Vaults that last updated on this transaction"
  vaultsUpdated: [Vault!]! @derivedFrom(field: "transaction")
}
```
