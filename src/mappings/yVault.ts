import { Transfer } from "../../generated/yUSDVault/V1Contract";
import { Vault } from "../../generated/schema";
import { BigInt } from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateVaultTransfer,
  getOrCreateVaultDepositEvent,
  getOrCreateVaultWithdrawEvent,
  getOrCreateAccountVaultBalance,
  getOrCreateAccount
} from "../utils/helpers";
import { ZERO_ADDRESS } from "../utils/constants";

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

function handleTransferEvent(
  event: Transfer,
  amount: BigInt,
  fromId: String,
  toId: String,
  vault: Vault,
  transactionId: String
): void {
  let transfer = getOrCreateVaultTransfer(transactionId);

  transfer.vault = vault.id;
  transfer.from = fromId;
  transfer.to = toId;
  transfer.value = event.params.value;
  transfer.amount = amount;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.getPricePerFullShare = vault.getPricePerFullShare;
  transfer.balance = vault.balance;
  transfer.totalSupply = vault.totalSupply;
  transfer.available = vault.available;
  transfer.transactionHash = event.transaction.hash;

  transfer.save();
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

  let amount = (vault.balance * event.params.value) / vault.totalSupply;
  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat("-").concat(vault.id)
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat("-").concat(vault.id)
  );

  // Vault transfer between valid accounts
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleTransferEvent(
      event,
      amount,
      fromAccount.id,
      toAccount.id,
      vault,
      transactionId
    );

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.vault = vault.id;
    toAccountBalance.token = vault.token;
    toAccountBalance.balance = toAccountBalance.balance + amount;
    toAccountBalance.shareBalance =
      toAccountBalance.shareBalance + event.params.value;
    toAccountBalance.totalReceived = toAccountBalance.totalReceived + amount;
    toAccountBalance.totalSharesReceived =
      toAccountBalance.totalSharesReceived + event.params.value;

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.vault = vault.id;
    fromAccountBalance.token = vault.token;
    fromAccountBalance.balance = fromAccountBalance.balance - amount;
    fromAccountBalance.shareBalance =
      fromAccountBalance.shareBalance - event.params.value;
    fromAccountBalance.totalSent = fromAccountBalance.totalSent + amount;
    fromAccountBalance.totalSharesSent =
      fromAccountBalance.totalSharesSent + event.params.value;

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  // Vault deposit
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleDepositEvent(event, amount, toAccount.id, vault, transactionId);
    // We should fact check that the amount deposited is exactly the same as calculated
    // If it's not, we should use a callHandler for deposit(_amount)

    toAccountBalance.account = toAccount.id;
    toAccountBalance.vault = vault.id;
    toAccountBalance.token = vault.token;
    toAccountBalance.totalDeposited = toAccountBalance.totalDeposited + amount;
    toAccountBalance.totalSharesMinted =
      toAccountBalance.totalSharesMinted + event.params.value;
    toAccountBalance.balance = toAccountBalance.balance + amount;
    toAccountBalance.shareBalance =
      toAccountBalance.shareBalance + event.params.value;

    toAccountBalance.save();
  }

  // Vault withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleWithdrawEvent(event, amount, fromAccount.id, vault, transactionId);
    // We should fact check that the amount withdrawn is exactly the same as calculated
    // If it's not, we should use a callHandler for withdraw(_amount)

    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.vault = vault.id;
    fromAccountBalance.token = vault.token;
    fromAccountBalance.totalWithdrawn =
      fromAccountBalance.totalWithdrawn + amount;
    fromAccountBalance.totalSharesBurned =
      fromAccountBalance.totalSharesBurned + event.params.value;
    fromAccountBalance.balance = fromAccountBalance.balance - amount;
    fromAccountBalance.shareBalance =
      fromAccountBalance.shareBalance - event.params.value;

    fromAccountBalance.save();
  }
}
