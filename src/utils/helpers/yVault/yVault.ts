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
import { BIGINT_ZERO, BIGDECIMAL_ZERO } from "../../constants";
import { toDecimal } from "../../decimals";

export function getOrCreateVault(vaultAddress: Address): Vault {
  let vault = Vault.load(vaultAddress.toHexString());
  let vaultContract = V1Contract.bind(vaultAddress);

  if (vault == null) {
    vault = new Vault(vaultAddress.toHexString());

    // Initialize parsed values as BigDecimal 0
    vault.netDeposits = BIGDECIMAL_ZERO;
    vault.totalDeposited = BIGDECIMAL_ZERO;
    vault.totalWithdrawn = BIGDECIMAL_ZERO;
    vault.totalActiveShares = BIGDECIMAL_ZERO;
    vault.totalSharesMinted = BIGDECIMAL_ZERO;
    vault.totalSharesBurned = BIGDECIMAL_ZERO;
    vault.vaultBalance = BIGDECIMAL_ZERO;
    vault.strategyBalance = BIGDECIMAL_ZERO;
    vault.totalSupply = BIGDECIMAL_ZERO;
    vault.available = BIGDECIMAL_ZERO;

    // Initialize raw values as BigInt 0
    vault.pricePerFullShare = BIGINT_ZERO;
    vault.netDepositsRaw = BIGINT_ZERO;
    vault.totalDepositedRaw = BIGINT_ZERO;
    vault.totalWithdrawnRaw = BIGINT_ZERO;
    vault.totalActiveSharesRaw = BIGINT_ZERO;
    vault.totalSharesMintedRaw = BIGINT_ZERO;
    vault.totalSharesBurnedRaw = BIGINT_ZERO;
    vault.vaultBalanceRaw = BIGINT_ZERO;
    vault.strategyBalanceRaw = BIGINT_ZERO;
    vault.totalSupplyRaw = BIGINT_ZERO;
    vault.availableRaw = BIGINT_ZERO;
  }

  // Might be worth using the "try_" version of these calls in the future.
  let underlyingTokenAddress = vaultContract.token();
  let underlyingToken = getOrCreateToken(underlyingTokenAddress);
  // The vault itself is an ERC20
  let shareToken = getOrCreateToken(vaultAddress);

  let balance = vaultContract.try_balance();
  let pricePerFullShare = vaultContract.try_getPricePerFullShare();
  let totalSupply = vaultContract.try_totalSupply();
  let available = vaultContract.try_available();

  vault.vaultBalanceRaw = !balance.reverted ? balance.value : vault.vaultBalanceRaw;
  vault.pricePerFullShare = !pricePerFullShare.reverted
    ? pricePerFullShare.value
    : vault.pricePerFullShare;
  vault.totalSupplyRaw = !totalSupply.reverted
    ? totalSupply.value
    : vault.totalSupplyRaw;
  vault.availableRaw = !available.reverted ? available.value : vault.availableRaw;
  vault.underlyingToken = underlyingToken.id;
  vault.shareToken = underlyingToken.id;

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

  let strategyAddress = controllerContract.strategies(underlyingTokenAddress);
  let strategy = getOrCreateStrategy(strategyAddress);
  strategy.vault = vault.id;
  strategy.save();

  let strategyContract = StrategyContract.bind(strategyAddress as Address);
  let strategyBalance = strategyContract.try_balanceOf();

  vault.currentStrategy = strategy.id;
  vault.strategyBalanceRaw = !strategyBalance.reverted
    ? strategyBalance.value
    : vault.strategyBalanceRaw;

  vault.strategyBalance = toDecimal(vault.strategyBalanceRaw, underlyingToken.decimals);
  vault.vaultBalance = toDecimal(vault.vaultBalanceRaw, underlyingToken.decimals);
  vault.totalSupply = toDecimal(vault.totalSupplyRaw, underlyingToken.decimals);
  vault.available = toDecimal(vault.availableRaw, underlyingToken.decimals);

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
