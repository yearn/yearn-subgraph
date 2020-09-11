import {
  Vault,
  DepositEvent,
  WithdrawEvent,
  MintEvent,
  BurnEvent,
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

  vault.balance = vaultContract.balance();
  vault.getPricePerFullShare = vaultContract.getPricePerFullShare();
  vault.totalSupply = vaultContract.totalSupply();
  vault.balance = vaultContract.balance();
  vault.available = vaultContract.available();
  vault.token = token.id;
  vault.symbol = vaultContract.symbol();
  vault.name = vaultContract.name();
  vault.controller = vaultContract.controller();

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

export function getOrCreateVaultBurnEvent(
  id: String,
  createIfNotFound: boolean = true
): BurnEvent {
  let event = BurnEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new BurnEvent(id);
  }

  return event as BurnEvent;
}

export function getOrCreateVaultMintEvent(
  id: String,
  createIfNotFound: boolean = true
): MintEvent {
  let event = MintEvent.load(id);

  if (event == null && createIfNotFound) {
    event = new MintEvent(id);
  }

  return event as MintEvent;
}
