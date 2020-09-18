import { Transfer, V1Contract } from "../../generated/yUSDVault/V1Contract";
import { Vault } from "../../generated/schema";
import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateVaultTransfer,
  getOrCreateVaultDepositEvent,
  getOrCreateVaultWithdrawEvent,
  getOrCreateAccountVaultBalance,
  getOrCreateAccount,
  getOrCreateToken,
  getOrCreateController,
  getOrCreateStrategy
} from "../utils/helpers";
import { ZERO_ADDRESS } from "../utils/constants";
import { toDecimal } from "../utils/decimals";

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
  deposit.pricePerFullShare = vault.pricePerFullShare;

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
  withdraw.pricePerFullShare = vault.pricePerFullShare;

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
  transfer.pricePerFullShare = vault.pricePerFullShare;
  transfer.vaultBalance = vault.vaultBalanceRaw;
  transfer.totalSupply = vault.totalSupplyRaw;
  transfer.available = vault.availableRaw;
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
  let vaultContract = V1Contract.bind(event.address);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let underlyingToken = getOrCreateToken(
    Address.fromString(vault.underlyingToken)
  );
  let shareToken = getOrCreateToken(Address.fromString(vault.shareToken));

  vault.timestamp = event.block.timestamp;
  vault.blockNumber = event.block.number;

  let amount = (vault.vaultBalanceRaw * event.params.value) / vault.totalSupplyRaw;
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
    toAccountBalance.shareToken = vault.id;
    toAccountBalance.underlyingToken = vault.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw + amount;
    toAccountBalance.shareBalanceRaw =
      toAccountBalance.shareBalanceRaw + event.params.value;
    toAccountBalance.totalReceivedRaw =
      toAccountBalance.totalReceivedRaw + amount;
    toAccountBalance.totalSharesReceivedRaw =
      toAccountBalance.totalSharesReceivedRaw + event.params.value;

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.vault = vault.id;
    fromAccountBalance.shareToken = vault.id;
    fromAccountBalance.underlyingToken = vault.underlyingToken;
    fromAccountBalance.netDepositsRaw =
      fromAccountBalance.netDepositsRaw - amount;
    fromAccountBalance.shareBalanceRaw =
      fromAccountBalance.shareBalanceRaw - event.params.value;
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw + amount;
    fromAccountBalance.totalSharesSentRaw =
      fromAccountBalance.totalSharesSentRaw + event.params.value;

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals
    );

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
    toAccountBalance.shareToken = vault.id;
    toAccountBalance.underlyingToken = vault.underlyingToken;
    toAccountBalance.totalDepositedRaw =
      toAccountBalance.totalDepositedRaw + amount;
    toAccountBalance.totalSharesMintedRaw =
      toAccountBalance.totalSharesMintedRaw + event.params.value;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw + amount;
    toAccountBalance.shareBalanceRaw =
      toAccountBalance.shareBalanceRaw + event.params.value;

    toAccountBalance.totalDeposited = toDecimal(
      toAccountBalance.totalDepositedRaw,
      underlyingToken.decimals
    );
    toAccountBalance.totalSharesMinted = toDecimal(
      toAccountBalance.totalSharesMintedRaw,
      shareToken.decimals
    );
    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    vault.totalDepositedRaw = vault.totalDepositedRaw + amount;
    vault.totalSharesMintedRaw =
      vault.totalSharesMintedRaw + event.params.value;

    vault.totalDeposited = toDecimal(
      vault.totalDepositedRaw,
      underlyingToken.decimals
    );
    vault.totalSharesMinted = toDecimal(
      vault.totalSharesMintedRaw,
      shareToken.decimals
    );

    toAccountBalance.save();
  }

  // Vault withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleWithdrawEvent(event, amount, fromAccount.id, vault, transactionId);
    // We should fact check that the amount withdrawn is exactly the same as calculated
    // If it's not, we should use a callHandler for withdraw(_amount)

    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.vault = vault.id;
    fromAccountBalance.shareToken = vault.id;
    fromAccountBalance.underlyingToken = vault.underlyingToken;
    fromAccountBalance.totalWithdrawnRaw =
      fromAccountBalance.totalWithdrawnRaw + amount;
    fromAccountBalance.totalSharesBurnedRaw =
      fromAccountBalance.totalSharesBurnedRaw + event.params.value;
    fromAccountBalance.netDepositsRaw =
      fromAccountBalance.netDepositsRaw - amount;
    fromAccountBalance.shareBalanceRaw =
      fromAccountBalance.shareBalanceRaw - event.params.value;

    fromAccountBalance.totalWithdrawn = toDecimal(
      fromAccountBalance.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.totalSharesBurned = toDecimal(
      fromAccountBalance.totalSharesBurnedRaw,
      shareToken.decimals
    );
    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals
    );

    vault.totalWithdrawnRaw = vault.totalWithdrawnRaw + amount;
    vault.totalSharesBurnedRaw =
      vault.totalSharesBurnedRaw + event.params.value;

    vault.totalWithdrawn = toDecimal(
      vault.totalWithdrawnRaw,
      underlyingToken.decimals
    );
    vault.totalSharesBurned = toDecimal(
      vault.totalSharesBurnedRaw,
      shareToken.decimals
    );

    fromAccountBalance.save();
  }

  vault.netDepositsRaw = vault.totalDepositedRaw - vault.totalWithdrawnRaw;
  vault.totalActiveSharesRaw =
    vault.totalSharesMintedRaw - vault.totalSharesBurnedRaw;

  vault.netDeposits = toDecimal(vault.netDepositsRaw, underlyingToken.decimals);
  vault.totalActiveShares = toDecimal(
    vault.totalActiveSharesRaw,
    shareToken.decimals
  );

  vault.save();
  fromAccount.save();
  toAccount.save();
}
