import { ethereum } from "@graphprotocol/graph-ts";
import { Transfer } from "../../generated/yUSDVault/V1Contract";
import {
  getOrCreateVault,
  getOrCreateVaultTransfer,
  getOrCreateVaultDepositEvent,
  getOrCreateVaultWithdrawEvent,
  getOrCreateAccount
} from "../utils/helpers";
import { ZERO_ADDRESS } from "../utils/constants";

export function handleTransfer(event: Transfer): void {
  let transactionId = event.address
    .toHexString()
    .concat("-")
    .concat(event.transaction.hash.toHexString())
    .concat("-")
    .concat(event.transactionLogIndex.toString());

  let vaultAddress = event.address;
  let vault = getOrCreateVault(vaultAddress);
  let fromAccount = getOrCreateAccount(event.params.from.toHexString());
  let toAccount = getOrCreateAccount(event.params.to.toHexString());

  let transactionHash = event.transaction.hash;
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;
  let value = event.params.value;

  let totalSupply = vault.totalSupply;
  let balance = vault.balance;

  vault.timestamp = timestamp;
  vault.blockNumber = blockNumber;

  vault.save();
  fromAccount.save();
  toAccount.save();

  let vaultDeposit = event.params.from.toHexString() == ZERO_ADDRESS;
  let vaultWithdrawal = event.params.to.toHexString() == ZERO_ADDRESS;

  let amount = (balance * value) / totalSupply;

  // Vault deposit
  if (vaultDeposit) {
    let deposit = getOrCreateVaultDepositEvent(transactionId);

    deposit.vault = vault.id;
    deposit.account = toAccount.id;
    deposit.amount = amount;
    deposit.shares = value;
    deposit.timestamp = timestamp;
    deposit.blockNumber = blockNumber;
    deposit.transactionHash = transactionHash;
    deposit.getPricePerFullShare = vault.getPricePerFullShare;

    deposit.save();
  }

  // Vault withdrawal
  if (vaultWithdrawal) {
    let withdraw = getOrCreateVaultWithdrawEvent(transactionId);

    withdraw.vault = vault.id;
    withdraw.account = fromAccount.id;
    withdraw.amount = amount;
    withdraw.shares = value;
    withdraw.timestamp = timestamp;
    withdraw.blockNumber = blockNumber;
    withdraw.transactionHash = transactionHash;
    withdraw.getPricePerFullShare = vault.getPricePerFullShare;

    withdraw.save();
  }

  let transfer = getOrCreateVaultTransfer(transactionId);

  transfer.vault = vault.id;
  transfer.from = fromAccount.id;
  transfer.to = toAccount.id;
  transfer.value = value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.getPricePerFullShare = vault.getPricePerFullShare;
  transfer.balance = balance;
  transfer.totalSupply = totalSupply;
  transfer.available = vault.available;
  transfer.transactionHash = transactionHash;

  transfer.save();
}
