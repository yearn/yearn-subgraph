import { HarvestCall } from "../../generated/yUSDVault/V1Contract";
import { Address } from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateStrategy,
  getOrCreateHarvest,
  getOrCreateToken
} from "../utils/helpers";
import { ZERO_ADDRESS, BIGINT_ONE } from "../utils/constants";
import { toDecimal } from "../utils/decimals";

export function handleHarvest(call: HarvestCall): void {
  let strategy = getOrCreateStrategy(call.to);
  let transactionId = call.to
    .toHexString()
    .concat("-")
    .concat(call.transaction.hash.toHexString());
  let harvest = getOrCreateHarvest(transactionId);
  let vaultAddress = Address.fromString(strategy.vault);

  // get entity without updating it, to handle "Before" cases
  let vaultBefore = getOrCreateVault(vaultAddress, false);
  // get entity and update it, to handle "After" cases
  let vaultAfter = getOrCreateVault(vaultAddress);

  let underlyingToken = getOrCreateToken(Address.fromString(vaultBefore.underlyingToken));

  harvest.caller = call.from;
  harvest.vault = vaultAfter.id;
  harvest.strategy = strategy.id;
  harvest.pricePerFullShareBefore = vaultBefore.pricePerFullShare;
  harvest.pricePerFullShareAfter = vaultAfter.pricePerFullShare;
  harvest.pricePerFullShareBeforeRaw = vaultBefore.pricePerFullShareRaw;
  harvest.pricePerFullShareAfterRaw = vaultAfter.pricePerFullShareRaw;
  harvest.blockNumber = call.block.number;
  harvest.timestamp = call.block.timestamp;
  harvest.transactionHash = call.transaction.hash;
  harvest.vaultBalanceBefore = vaultBefore.vaultBalance;
  harvest.vaultBalanceAfter = vaultAfter.vaultBalance;
  harvest.strategyBalanceBefore = vaultBefore.strategyBalance;
  harvest.strategyBalanceAfter = vaultAfter.strategyBalance;
  harvest.vaultBalanceBeforeRaw = vaultBefore.vaultBalanceRaw;
  harvest.vaultBalanceAfterRaw = vaultAfter.vaultBalanceRaw;
  harvest.strategyBalanceBeforeRaw = vaultBefore.strategyBalanceRaw;
  harvest.strategyBalanceAfterRaw = vaultAfter.strategyBalanceRaw;

  let earningsRaw = harvest.vaultBalanceAfterRaw - harvest.vaultBalanceBeforeRaw;
  harvest.earningsRaw = earningsRaw;
  harvest.earnings = toDecimal(earningsRaw, underlyingToken.decimals);

  vaultAfter.totalEarningsRaw = vaultAfter.totalEarningsRaw + earningsRaw;
  vaultAfter.totalEarnings = toDecimal(vaultAfter.totalEarningsRaw, underlyingToken.decimals);
  vaultAfter.totalHarvestCalls = vaultAfter.totalHarvestCalls + BIGINT_ONE;

  strategy.totalEarningsRaw = strategy.totalEarningsRaw + earningsRaw;
  strategy.totalEarnings = toDecimal(strategy.totalEarningsRaw, underlyingToken.decimals);

  vaultAfter.save();
  strategy.save();
  harvest.save();
}
