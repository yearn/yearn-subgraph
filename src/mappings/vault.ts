import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Deposit, Transfer, Vault, Withdrawal } from '../../generated/schema';
import { Vault as V1 } from '../../generated/yUSDVault/Vault';
import {
  DepositCall,
  Transfer as TransferEvent,
  WithdrawCall,
} from '../../generated/yUSDVault/Vault';
import { BIGINT_ZERO, DEFAULT_DECIMALS } from '../utils/constants';
import { createId } from '../utils/utils';

export function handleDeposit(call: DepositCall): void {
  let vaultAddress = call.to.toHexString();
  let vault = Vault.load(vaultAddress);

  if (vault == null) {
    vault = new Vault(vaultAddress);
    vault.pricePerFullShare = BigInt.fromI32(10).pow(18);
  }

  let id = createId(call.transaction.hash, call.transaction.index);

  let vaultContract = V1.bind(call.to);
  // TODO: does it have to be try_
  // TODO: problem we use current PricePerFullShare
  // while should use previous entry or 1 if none exists
  let pricePerFullShare = vault.pricePerFullShare;

  let deposit = new Deposit(id);

  deposit.vault = call.to;
  deposit.account = call.from;

  deposit.amount = call.inputs._amount;
  // NOTE: offset for decimals, pricePerFullShare is 10^18
  deposit.shares = call.inputs._amount
    .times(BigInt.fromI32(10).pow(18))
    .div(pricePerFullShare);
  deposit.timestamp = call.block.timestamp;
  deposit.blockNumber = call.block.number;

  // set new (current) value
  vault.pricePerFullShare = vaultContract.getPricePerFullShare();
  deposit.save();
  vault.save();
}

export function handleWithdrawal(call: WithdrawCall): void {
  let vaultAddress = call.to.toHexString();
  let vault = Vault.load(vaultAddress);

  // TODO: seems useless cause should exist at this point
  if (vault == null) {
    vault = new Vault(vaultAddress);
    vault.pricePerFullShare = BigInt.fromI32(10).pow(18);
  }

  let id = createId(call.transaction.hash, call.transaction.index);

  let vaultContract = V1.bind(call.to);
  // TODO: does it have to be try_
  // TODO: problem we use current PricePerFullShare
  // while should use previous entry or 1 if none exists
  let pricePerFullShare = vault.pricePerFullShare;

  let withdrawal = new Withdrawal(id);
  withdrawal.vault = call.to;
  withdrawal.account = call.from;

  withdrawal.amount = call.inputs._shares
    .times(pricePerFullShare)
    .div(BigInt.fromI32(10).pow(18));
  withdrawal.shares = call.inputs._shares;
  withdrawal.timestamp = call.block.timestamp;
  withdrawal.blockNumber = call.block.number;

  vault.pricePerFullShare = vaultContract.getPricePerFullShare();
  withdrawal.save();
  vault.save();
  // TODO:
}

export function handleTransfer(_event: TransferEvent): void {
  // TODO:
}
