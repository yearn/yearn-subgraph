import { ethereum } from "@graphprotocol/graph-ts";
import {
  V1Contract,
  DepositCall,
  DepositAllCall,
  WithdrawCall,
  WithdrawAllCall,
  Transfer as TransferEvent,
} from "../generated/yUSDVault/V1Contract";

import { erc20Contract } from "../generated/yUSDVault/erc20Contract";

import { Address } from "@graphprotocol/graph-ts";

import { Vault, Deposit, Withdraw, Transfer } from "../generated/schema";

function getVault(vaultAddress: Address): Vault {
  let vault = new Vault(vaultAddress.toHexString());
  let vaultContract = V1Contract.bind(vaultAddress);
  vault.balance = vaultContract.balance();
  vault.getPricePerFullShare = vaultContract.getPricePerFullShare();
  vault.totalSupply = vaultContract.totalSupply();
  vault.balance = vaultContract.balance();
  vault.available = vaultContract.available();
  vault.token = vaultContract.token();
  vault.symbol = vaultContract.symbol();
  vault.name = vaultContract.name();
  vault.controller = vaultContract.controller();
  return vault;
}

export function handleTransfer(event: TransferEvent): void {
  let emptyAddress = "0x0000000000000000000000000000000000000000";
  let transactionId = event.transaction.hash.toHexString() + '-' + event.transactionLogIndex.toString();
  let transactionHash = event.transaction.hash;
  let vaultAddress = event.address;
  let timestamp = event.block.timestamp;
  let blockNumber = event.block.number;
  let to = event.params.to;
  let from = event.params.from;
  let value = event.params.value;
  let transfer = new Transfer(transactionId);
  let vault = getVault(vaultAddress);
  let vaultDeposit = from.toHexString() == emptyAddress;
  let vaultWithdrawal = to.toHexString() == emptyAddress;
  let totalSupply = vault.totalSupply;
  let balance = vault.balance;

  vault.timestamp = timestamp;
  vault.blockNumber = blockNumber;
  vault.save();

  // Vault deposit
  if (vaultDeposit) {
    let deposit = new Deposit(transactionId);
    let amount = (balance * value) / totalSupply;
    deposit.vaultAddress = vaultAddress;
    deposit.account = to;
    deposit.amount = amount;
    deposit.shares = value;
    deposit.timestamp = timestamp;
    deposit.blockNumber = blockNumber;
    deposit.getPricePerFullShare = vault.getPricePerFullShare;
    deposit.save();
  }

  // Vault withdrawal
  if (vaultWithdrawal) {
    let withdraw = new Withdraw(transactionId);
    let amount = (balance * value) / totalSupply;
    withdraw.vaultAddress = vaultAddress;
    withdraw.account = from;
    withdraw.amount = amount;
    withdraw.shares = value;
    withdraw.timestamp = timestamp;
    withdraw.blockNumber = blockNumber;
    withdraw.getPricePerFullShare = vault.getPricePerFullShare;
    withdraw.save();
  }

  transfer.from = from;
  transfer.to = to;
  transfer.value = value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.vaultAddress = vaultAddress;
  transfer.getPricePerFullShare = vault.getPricePerFullShare;
  transfer.balance = balance;
  transfer.totalSupply = totalSupply;
  transfer.available = vault.available;
  transfer.transactionHash = transactionHash;
  transfer.save();
}
