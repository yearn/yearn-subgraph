import {
  Vault,
  DepositEvent,
  WithdrawEvent,
  Transfer,
  Controller,
  Strategy
} from "../../../../generated/schema";
import { V1Contract } from "../../../../generated/yBUSDVault/V1Contract";
import { Controller as ControllerContract } from "../../../../generated/yBUSDVault/Controller";
import { Strategy as StrategyContract } from "../../../../generated/yBUSDVault/Strategy";
import { Strategy as StrategyABI } from "../../../../generated/templates";
import { Address, log } from "@graphprotocol/graph-ts";
import { getOrCreateToken } from "./token";
import { BIGINT_ZERO } from "../../constants";

export function getOrCreateVault(vaultAddress: Address): Vault {
  let vault = Vault.load(vaultAddress.toHexString());
  let vaultContract = V1Contract.bind(vaultAddress);

  if (vault == null) {
    vault = new Vault(vaultAddress.toHexString());

    vault.netDeposits = BIGINT_ZERO;
    vault.totalDeposited = BIGINT_ZERO;
    vault.totalWithdrawn = BIGINT_ZERO;
    vault.totalActiveShares = BIGINT_ZERO;
    vault.totalSharesMinted = BIGINT_ZERO;
    vault.totalSharesBurned = BIGINT_ZERO;
    vault.vaultBalance = BIGINT_ZERO;
    vault.strategyBalance = BIGINT_ZERO;
    vault.pricePerFullShare = BIGINT_ZERO;
    vault.totalSupply = BIGINT_ZERO;
    vault.available = BIGINT_ZERO;
    vault.name = "";
    vault.symbol = "";
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

  vault.vaultBalance = !balance.reverted ? balance.value : vault.vaultBalance;
  vault.pricePerFullShare = !pricePerFullShare.reverted
    ? pricePerFullShare.value
    : vault.pricePerFullShare;
  vault.totalSupply = !totalSupply.reverted
    ? totalSupply.value
    : vault.totalSupply;
  vault.available = !available.reverted ? available.value : vault.available;
  vault.token = token.id;
  vault.symbol = !symbol.reverted ? symbol.value : vault.symbol;
  vault.name = !name.reverted ? name.value : vault.name;

  // Saving controller and strategy as entities to have a historical list of
  // all controllers and entities the vault has. Also allows for dynamic
  // indexing of the Strategy ABI
  let controllerAddress = vaultContract.controller();
  let controller = getOrCreateController(controllerAddress);
  controller.vault = vault.id;
  controller.save();

  vault.currentController = controller.id;

  let controllerContract = ControllerContract.bind(
    controllerAddress as Address
  );

  let strategyAddress = controllerContract.strategies(tokenAddress);
  let strategy = getOrCreateStrategy(strategyAddress);
  strategy.vault = vault.id;
  strategy.save();

  let strategyContract = StrategyContract.bind(strategyAddress as Address);
  let strategyBalance = strategyContract.try_balanceOf();

  vault.currentStrategy = strategy.id;
  vault.strategyBalance = !strategyBalance.reverted
    ? strategyBalance.value
    : vault.strategyBalance;

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

export function getOrCreateController(
  address: Address,
  createIfNotFound: boolean = true
): Controller {
  let id = address.toHexString();
  let controller = Controller.load(id);

  if (controller == null && createIfNotFound) {
    controller = new Controller(id);
  }

  return controller as Controller;
}

export function getOrCreateStrategy(
  address: Address,
  createIfNotFound: boolean = true
): Strategy {
  let id = address.toHexString();
  let strategy = Strategy.load(id);

  if (strategy == null && createIfNotFound) {
    strategy = new Strategy(id);

    //dynamically index strategies
    StrategyABI.create(address);
  }

  return strategy as Strategy;
}
