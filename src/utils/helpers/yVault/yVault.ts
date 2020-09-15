import {
  Vault,
  DepositEvent,
  WithdrawEvent,
  Transfer
} from "../../../../generated/schema";
import { V1Contract } from "../../../../generated/yBUSDVault/V1Contract";
import { Address, log } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "./token";

export function getOrCreateVault(vaultAddress: Address): Vault {
  let vault = Vault.load(vaultAddress.toHexString());
  let vaultContract = V1Contract.bind(vaultAddress);

  if (vault == null) {
    vault = new Vault(vaultAddress.toHexString());
  }

  // Might be worth using the "try_" version of these calls in the future.
  let tokenAddress = vaultContract.token();
  let token = getOrCreateToken(tokenAddress);

  let balance = vaultContract.try_balance();
  let pricePerFullShare = vaultContract.try_getPricePerFullShare();
  let totalSupply = vaultContract.try_totalSupply();
  let available = vaultContract.try_available();
  let symbol = vaultContract.try_symbol();
  let name = vaultContract.try_name();
  let controller = vaultContract.try_controller();

  vault.balance = !balance.reverted ? balance.value : vault.balance;
  vault.getPricePerFullShare = !pricePerFullShare.reverted
    ? pricePerFullShare.value
    : vault.getPricePerFullShare;
  vault.totalSupply = !totalSupply.reverted ? totalSupply.value : vault.totalSupply;
  vault.available = !available.reverted ? available.value : vault.available;
  vault.token = token.id;
  vault.symbol = !symbol.reverted ? symbol.value : vault.symbol;
  vault.name = !name.reverted ? name.value : vault.name;
  vault.controller = !controller.reverted ? controller.value : vault.controller;

  return vault as Vault;
}

export function getOrCreateVaultTransfer(
  id: String,
  createIfNotFound: boolean = true
): Transfer {
  let transfer = Transfer.load(id);

  if (transfer == null && createIfNotFound) {
    transfer = new Transfer(id);
  }

  return transfer as Transfer;
}

export function getOrCreateVaultDepositEvent(
  id: String,
  createIfNotFound: boolean = true
): DepositEvent {
  let event = DepositEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new DepositEvent(id);
  }

  return event as DepositEvent;
}

export function getOrCreateVaultWithdrawEvent(
  id: String,
  createIfNotFound: boolean = true
): WithdrawEvent {
  let event = WithdrawEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new WithdrawEvent(id);
  }

  return event as WithdrawEvent;
}
