import { Transfer } from "../../generated/yUSDVault/V1Contract";
import { Vault } from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateVaultTransfer,
  getOrCreateVaultDepositEvent,
  getOrCreateVaultWithdrawEvent,
  getOrCreateVaultMintEvent,
  getOrCreateVaultBurnEvent,
  getOrCreateAccount
} from "../utils/helpers";
import { ZERO_ADDRESS } from "../utils/constants";

function handleMintEvent(
  event: Transfer,
  amount: BigInt,
  accountId: String,
  vault: Vault,
  transactionId: String
): void {
  let burn = getOrCreateVaultBurnEvent(transactionId);

  burn.vault = vault.id;
  burn.account = accountId;
  burn.amount = amount;
  burn.shares = event.params.value;
  burn.timestamp = event.block.timestamp;
  burn.blockNumber = event.block.number;
  burn.transactionHash = event.transaction.hash;
  burn.getPricePerFullShare = vault.getPricePerFullShare;

  burn.save();
}

function handleBurnEvent(
  event: Transfer,
  amount: BigInt,
  accountId: String,
  vault: Vault,
  transactionId: String
): void {
  let mint = getOrCreateVaultMintEvent(transactionId);

  mint.vault = vault.id;
  mint.account = accountId;
  mint.amount = amount;
  mint.shares = event.params.value;
  mint.timestamp = event.block.timestamp;
  mint.blockNumber = event.block.number;
  mint.transactionHash = event.transaction.hash;
  mint.getPricePerFullShare = vault.getPricePerFullShare;

  mint.save();
}

function handleDepositEvent(
  event: Transfer,
  amount: BigInt,
  accountId: String,
  vault: Vault,
  transactionId: String
): void {
  let deposit = getOrCreateVaultDepositEvent(transactionId);

  deposit.vault = vault.id;
  deposit.account = accountId;
  deposit.amount = amount;
  deposit.shares = event.params.value;
  deposit.timestamp = event.block.timestamp;
  deposit.blockNumber = event.block.number;
  deposit.transactionHash = event.transaction.hash;
  deposit.getPricePerFullShare = vault.getPricePerFullShare;

  deposit.save();
}

function handleWithdrawEvent(
  event: Transfer,
  amount: BigInt,
  accountId: String,
  vault: Vault,
  transactionId: String
): void {
  let withdraw = getOrCreateVaultWithdrawEvent(transactionId);

  withdraw.vault = vault.id;
  withdraw.account = accountId;
  withdraw.amount = amount;
  withdraw.shares = event.params.value;
  withdraw.timestamp = event.block.timestamp;
  withdraw.blockNumber = event.block.number;
  withdraw.transactionHash = event.transaction.hash;
  withdraw.getPricePerFullShare = vault.getPricePerFullShare;

  withdraw.save();
}

export function handleTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.logIndex.toString());

  let vault = getOrCreateVault(event.address);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());

  vault.timestamp = event.block.timestamp;
  vault.blockNumber = event.block.number;

  vault.save();
  fromAccount.save();
  toAccount.save();

  let transfer = getOrCreateVaultTransfer(transactionId);

  transfer.vault = vault.id;
  transfer.from = fromAccount.id;
  transfer.to = toAccount.id;
  transfer.value = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.getPricePerFullShare = vault.getPricePerFullShare;
  transfer.balance = vault.balance;
  transfer.totalSupply = vault.totalSupply;
  transfer.available = vault.available;
  transfer.transactionHash = event.transaction.hash;

  transfer.save();

  let amount = (vault.balance * event.params.value) / vault.totalSupply;

  // Vault mint
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleMintEvent(event, amount, toAccount.id, vault, transactionId);
  }

  // Vault burn
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleBurnEvent(event, amount, fromAccount.id, vault, transactionId);
  }

  // Vault Deposit
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() == event.address.toHexString()
  ) {
    handleDepositEvent(event, amount, fromAccount.id, vault, transactionId);
  }

  // Vault Withdraw
  if (
    event.params.to.toHexString() != ZERO_ADDRESS &&
    event.params.from.toHexString() == event.address.toHexString()
  ) {
    handleWithdrawEvent(event, amount, toAccount.id, vault, transactionId);
  }
}
