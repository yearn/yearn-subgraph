import { Address } from '@graphprotocol/graph-ts';

import { HarvestCall } from '../../generated/yUSDVault/V1Contract';
import { BIGINT_ONE } from '../utils/constants';
import { toDecimal } from '../utils/decimals';
import {
  getOrCreateHarvest,
  getOrCreateStrategy,
  getOrCreateToken,
  getOrCreateTransaction,
  getOrCreateVault,
} from '../utils/helpers';

export function handleHarvest(call: HarvestCall): void {
  let strategy = getOrCreateStrategy(call.to);
  let transactionId = call.to
    .toHexString()
    .concat('-')
    .concat(call.transaction.hash.toHexString());
  let harvest = getOrCreateHarvest(transactionId);
  let vaultAddress = Address.fromString(strategy.vault);

  // get entity without updating it, to handle "Before" cases
  let vaultBefore = getOrCreateVault(vaultAddress, false);
  // get entity and update it, to handle "After" cases
  let vaultAfter = getOrCreateVault(vaultAddress);

  let underlyingToken = getOrCreateToken(Address.fromString(vaultBefore.underlyingToken));

  let transaction = getOrCreateTransaction(call.transaction.hash.toHexString());
  transaction.blockNumber = call.block.number;
  transaction.timestamp = call.block.timestamp;
  transaction.transactionHash = call.transaction.hash;
  transaction.save();

  harvest.caller = call.from;
  harvest.vault = vaultAfter.id;
  harvest.strategy = strategy.id;
  harvest.pricePerFullShareBefore = vaultBefore.pricePerFullShare;
  harvest.pricePerFullShareAfter = vaultAfter.pricePerFullShare;
  harvest.pricePerFullShareBeforeRaw = vaultBefore.pricePerFullShareRaw;
  harvest.pricePerFullShareAfterRaw = vaultAfter.pricePerFullShareRaw;
  harvest.transaction = call.transaction.hash.toHexString();
  harvest.vaultBalanceBefore = vaultBefore.vaultBalance;
  harvest.vaultBalanceAfter = vaultAfter.vaultBalance;
  harvest.strategyBalanceBefore = vaultBefore.strategyBalance;
  harvest.strategyBalanceAfter = vaultAfter.strategyBalance;
  harvest.vaultBalanceBeforeRaw = vaultBefore.vaultBalanceRaw;
  harvest.vaultBalanceAfterRaw = vaultAfter.vaultBalanceRaw;
  harvest.strategyBalanceBeforeRaw = vaultBefore.strategyBalanceRaw;
  harvest.strategyBalanceAfterRaw = vaultAfter.strategyBalanceRaw;

  let earningsRaw = harvest.vaultBalanceAfterRaw.minus(harvest.vaultBalanceBeforeRaw);
  harvest.earningsRaw = earningsRaw;
  harvest.earnings = toDecimal(earningsRaw, underlyingToken.decimals);

  vaultAfter.totalEarningsRaw = vaultAfter.totalEarningsRaw.plus(earningsRaw);
  vaultAfter.totalEarnings = toDecimal(
    vaultAfter.totalEarningsRaw,
    underlyingToken.decimals,
  );
  vaultAfter.totalHarvestCalls = vaultAfter.totalHarvestCalls.plus(BIGINT_ONE);

  strategy.totalEarningsRaw = strategy.totalEarningsRaw.plus(earningsRaw);
  strategy.totalEarnings = toDecimal(strategy.totalEarningsRaw, underlyingToken.decimals);

  vaultAfter.save();
  strategy.save();
  harvest.save();
}
