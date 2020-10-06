import { Address, BigInt } from '@graphprotocol/graph-ts';

import { Vault } from '../../generated/schema';
import { Transfer } from '../../generated/yUSDVault/V1Contract';
import { BIGINT_ZERO, ZERO_ADDRESS } from '../utils/constants';
import { toDecimal } from '../utils/decimals';
import {
  getOrCreateAccount,
  getOrCreateAccountVaultBalance,
  getOrCreateToken,
  getOrCreateTransaction,
  getOrCreateVault,
  getOrCreateVaultDeposit,
  getOrCreateVaultTransfer,
  getOrCreateVaultWithdrawal,
} from '../utils/helpers';

function handleDeposit(
  event: Transfer,
  amount: BigInt,
  accountId: String,
  vault: Vault,
  transactionId: String,
): void {
  let deposit = getOrCreateVaultDeposit(transactionId);

  deposit.vault = vault.id;
  // @ts-ignore: assign wrapper object to primitive
  deposit.account = accountId;
  deposit.amount = amount;
  deposit.shares = event.params.value;
  deposit.pricePerFullShare = vault.pricePerFullShareRaw;
  deposit.vaultBalance = vault.vaultBalanceRaw;
  deposit.totalSupply = vault.totalSupplyRaw;
  deposit.available = vault.availableRaw;
  deposit.transaction = event.transaction.hash.toHexString();

  deposit.save();
}

function handleWithdrawal(
  event: Transfer,
  amount: BigInt,
  accountId: String,
  vault: Vault,
  transactionId: String,
): void {
  let withdraw = getOrCreateVaultWithdrawal(transactionId);

  withdraw.vault = vault.id;
  // @ts-ignore: assign wrapper object to primitive
  withdraw.account = accountId;
  withdraw.amount = amount;
  withdraw.shares = event.params.value;
  withdraw.pricePerFullShare = vault.pricePerFullShareRaw;
  withdraw.vaultBalance = vault.vaultBalanceRaw;
  withdraw.totalSupply = vault.totalSupplyRaw;
  withdraw.available = vault.availableRaw;
  withdraw.transaction = event.transaction.hash.toHexString();

  withdraw.save();
}

function handleTransfer(
  event: Transfer,
  amount: BigInt,
  fromId: String,
  toId: String,
  vault: Vault,
  transactionId: String,
): void {
  let transfer = getOrCreateVaultTransfer(transactionId);

  transfer.vault = vault.id;
  // @ts-ignore: assign wrapper object to primitive
  transfer.from = fromId;
  // @ts-ignore: assign wrapper object to primitive
  transfer.to = toId;
  transfer.value = event.params.value;
  transfer.amount = amount;
  transfer.pricePerFullShare = vault.pricePerFullShareRaw;
  transfer.vaultBalance = vault.vaultBalanceRaw;
  transfer.totalSupply = vault.totalSupplyRaw;
  transfer.available = vault.availableRaw;
  transfer.transaction = event.transaction.hash.toHexString();

  transfer.save();
}

export function handleShareTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat('-')
    .concat(event.transaction.hash.toHexString())
    .concat('-')
    .concat(event.logIndex.toString());

  let vault = getOrCreateVault(event.address);
  // let vaultContract = V1Contract.bind(event.address);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());
  let underlyingToken = getOrCreateToken(Address.fromString(vault.underlyingToken));
  let shareToken = getOrCreateToken(Address.fromString(vault.shareToken));

  let amount: BigInt;

  if (vault.totalSupplyRaw != BIGINT_ZERO) {
    amount = vault.vaultBalanceRaw.times(event.params.value).div(vault.totalSupplyRaw);
  } else {
    amount = event.params.value
      .times(vault.pricePerFullShareRaw)
      .div(BigInt.fromI32(10).pow(18));
  }
  let toAccountBalance = getOrCreateAccountVaultBalance(
    toAccount.id.concat('-').concat(vault.id),
  );
  let fromAccountBalance = getOrCreateAccountVaultBalance(
    fromAccount.id.concat('-').concat(vault.id),
  );

  let transaction = getOrCreateTransaction(event.transaction.hash.toHexString());
  transaction.blockNumber = event.block.number;
  transaction.timestamp = event.block.timestamp;
  transaction.transactionHash = event.transaction.hash;
  transaction.save();

  vault.transaction = transaction.id;

  // Vault transfer between valid accounts
  if (
    event.params.from.toHexString() != ZERO_ADDRESS &&
    event.params.to.toHexString() != ZERO_ADDRESS
  ) {
    handleTransfer(event, amount, fromAccount.id, toAccount.id, vault, transactionId);

    // Update toAccount totals and balances
    toAccountBalance.account = toAccount.id;
    toAccountBalance.vault = vault.id;
    toAccountBalance.shareToken = vault.id;
    toAccountBalance.underlyingToken = vault.underlyingToken;
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(amount);
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value,
    );
    toAccountBalance.totalReceivedRaw = toAccountBalance.totalReceivedRaw.plus(amount);
    toAccountBalance.totalSharesReceivedRaw = toAccountBalance.totalSharesReceivedRaw.plus(
      event.params.value,
    );

    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals,
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals,
    );
    toAccountBalance.totalReceived = toDecimal(
      toAccountBalance.totalReceivedRaw,
      underlyingToken.decimals,
    );
    toAccountBalance.totalSharesReceived = toDecimal(
      toAccountBalance.totalSharesReceivedRaw,
      shareToken.decimals,
    );

    // Update fromAccount totals and balances
    fromAccountBalance.account = toAccount.id;
    fromAccountBalance.vault = vault.id;
    fromAccountBalance.shareToken = vault.id;
    fromAccountBalance.underlyingToken = vault.underlyingToken;
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(amount);
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value,
    );
    fromAccountBalance.totalSentRaw = fromAccountBalance.totalSentRaw.plus(amount);
    fromAccountBalance.totalSharesSentRaw = fromAccountBalance.totalSharesSentRaw.plus(
      event.params.value,
    );

    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals,
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals,
    );
    fromAccountBalance.totalSent = toDecimal(
      fromAccountBalance.totalSentRaw,
      underlyingToken.decimals,
    );
    fromAccountBalance.totalSharesSent = toDecimal(
      fromAccountBalance.totalSharesSentRaw,
      shareToken.decimals,
    );

    toAccountBalance.save();
    fromAccountBalance.save();
  }

  // Vault deposit
  if (event.params.from.toHexString() == ZERO_ADDRESS) {
    handleDeposit(event, amount, toAccount.id, vault, transactionId);
    // We should fact check that the amount deposited is exactly the same as calculated
    // If it's not, we should use a callHandler for deposit(_amount)

    toAccountBalance.account = toAccount.id;
    toAccountBalance.vault = vault.id;
    toAccountBalance.shareToken = vault.id;
    toAccountBalance.underlyingToken = vault.underlyingToken;
    toAccountBalance.totalDepositedRaw = toAccountBalance.totalDepositedRaw.plus(amount);
    toAccountBalance.totalSharesMintedRaw = toAccountBalance.totalSharesMintedRaw.plus(
      event.params.value,
    );
    toAccountBalance.netDepositsRaw = toAccountBalance.netDepositsRaw.plus(amount);
    toAccountBalance.shareBalanceRaw = toAccountBalance.shareBalanceRaw.plus(
      event.params.value,
    );

    toAccountBalance.totalDeposited = toDecimal(
      toAccountBalance.totalDepositedRaw,
      underlyingToken.decimals,
    );
    toAccountBalance.totalSharesMinted = toDecimal(
      toAccountBalance.totalSharesMintedRaw,
      shareToken.decimals,
    );
    toAccountBalance.netDeposits = toDecimal(
      toAccountBalance.netDepositsRaw,
      underlyingToken.decimals,
    );
    toAccountBalance.shareBalance = toDecimal(
      toAccountBalance.shareBalanceRaw,
      shareToken.decimals,
    );

    vault.totalDepositedRaw = vault.totalDepositedRaw.plus(amount);
    vault.totalSharesMintedRaw = vault.totalSharesMintedRaw.plus(event.params.value);

    vault.totalDeposited = toDecimal(vault.totalDepositedRaw, underlyingToken.decimals);
    vault.totalSharesMinted = toDecimal(vault.totalSharesMintedRaw, shareToken.decimals);

    toAccountBalance.save();
  }

  // Vault withdraw
  if (event.params.to.toHexString() == ZERO_ADDRESS) {
    handleWithdrawal(event, amount, fromAccount.id, vault, transactionId);
    // We should fact check that the amount withdrawn is exactly the same as calculated
    // If it's not, we should use a callHandler for withdraw(_amount)

    fromAccountBalance.account = fromAccount.id;
    fromAccountBalance.vault = vault.id;
    fromAccountBalance.shareToken = vault.id;
    fromAccountBalance.underlyingToken = vault.underlyingToken;
    fromAccountBalance.totalWithdrawnRaw = fromAccountBalance.totalWithdrawnRaw.plus(
      amount,
    );
    fromAccountBalance.totalSharesBurnedRaw = fromAccountBalance.totalSharesBurnedRaw.plus(
      event.params.value,
    );
    fromAccountBalance.netDepositsRaw = fromAccountBalance.netDepositsRaw.minus(amount);
    fromAccountBalance.shareBalanceRaw = fromAccountBalance.shareBalanceRaw.minus(
      event.params.value,
    );

    fromAccountBalance.totalWithdrawn = toDecimal(
      fromAccountBalance.totalWithdrawnRaw,
      underlyingToken.decimals,
    );
    fromAccountBalance.totalSharesBurned = toDecimal(
      fromAccountBalance.totalSharesBurnedRaw,
      shareToken.decimals,
    );
    fromAccountBalance.netDeposits = toDecimal(
      fromAccountBalance.netDepositsRaw,
      underlyingToken.decimals,
    );
    fromAccountBalance.shareBalance = toDecimal(
      fromAccountBalance.shareBalanceRaw,
      shareToken.decimals,
    );

    vault.totalWithdrawnRaw = vault.totalWithdrawnRaw.plus(amount);
    vault.totalSharesBurnedRaw = vault.totalSharesBurnedRaw.plus(event.params.value);

    vault.totalWithdrawn = toDecimal(vault.totalWithdrawnRaw, underlyingToken.decimals);
    vault.totalSharesBurned = toDecimal(vault.totalSharesBurnedRaw, shareToken.decimals);

    fromAccountBalance.save();
  }

  vault.netDepositsRaw = vault.totalDepositedRaw.minus(vault.totalWithdrawnRaw);
  vault.totalActiveSharesRaw = vault.totalSharesMintedRaw.minus(
    vault.totalSharesBurnedRaw,
  );

  vault.netDeposits = toDecimal(vault.netDepositsRaw, underlyingToken.decimals);
  vault.totalActiveShares = toDecimal(vault.totalActiveSharesRaw, shareToken.decimals);

  vault.save();
  fromAccount.save();
  toAccount.save();
}
