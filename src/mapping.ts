import { ethereum } from "@graphprotocol/graph-ts";
import {
  V1Contract,
  DepositCall,
  WithdrawCall,
  Transfer as TransferEvent,
} from "../generated/yUSDVault/V1Contract";

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
  let vaultAddress = event.address;
  let vault = getVault(vaultAddress);
  vault.timestamp = event.block.timestamp;
  vault.blockNumber = event.block.number;
  vault.save();

  let transactionAddress = event.transaction.hash.toHexString();
  let transfer = new Transfer(transactionAddress);
  transfer.from = event.params.from;
  transfer.to = event.params.to;
  transfer.amount = event.params.value;
  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.vaultAddress = vaultAddress;
  transfer.getPricePerFullShare = vault.getPricePerFullShare;
  transfer.balance = vault.balance;
  transfer.totalSupply = vault.totalSupply;
  transfer.available = vault.available;
  transfer.save();
}

export function handleDeposit(call: DepositCall): void {
  let transactionAddress = call.transaction.hash.toHexString();
  let deposit = new Deposit(transactionAddress);
  let amount = call.inputs._amount;
  let account = call.from;
  let vaultAddress = call.to;
  let vault = getVault(vaultAddress);
  let totalSupply = vault.totalSupply;
  let balance = vault.balance;
  deposit.timestamp = call.block.timestamp;
  deposit.blockNumber = call.block.number;
  deposit.account = account;
  deposit.vaultAddress = vaultAddress;
  deposit.amount = amount;
  deposit.shares = (amount * totalSupply) / balance;
  deposit.save();
}

export function handleWithdraw(call: WithdrawCall): void {
  let transactionAddress = call.transaction.hash.toHexString();
  let withdraw = new Withdraw(transactionAddress);
  let account = call.from;
  let shares = call.inputs._shares;
  let vaultAddress = call.to;
  let vault = getVault(vaultAddress);
  let totalSupply = vault.totalSupply;
  let balance = vault.balance;
  withdraw.timestamp = call.block.timestamp;
  withdraw.blockNumber = call.block.number;
  withdraw.vaultAddress = vaultAddress;
  withdraw.account = account;
  withdraw.shares = shares;
  withdraw.amount = (balance * shares) / totalSupply;
  withdraw.save();
}
