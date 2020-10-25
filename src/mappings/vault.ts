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
  let id = createId(call.transaction.hash, call.transaction.index);

  let vaultContract = V1.bind(call.to);

  let deposit = new Deposit(id);
  deposit.vault = call.to;
  deposit.account = call.from;
  deposit.amount = call.inputs._amount;

  if (vaultContract.balance().equals(BIGINT_ZERO)) {
    deposit.shares = call.inputs._amount;
  } else {
    // TODO: link this line on contract
    // _amount.mul(totalSupply()).div(_pool);
    deposit.shares = call.inputs._amount
      .times(vaultContract.totalSupply())
      .div(vaultContract.balance());
  }

  deposit.timestamp = call.block.timestamp;
  deposit.blockNumber = call.block.number;
  deposit.save();
}

export function handleWithdrawal(call: WithdrawCall): void {
  let id = createId(call.transaction.hash, call.transaction.index);

  let vaultContract = V1.bind(call.to);

  let withdrawal = new Withdrawal(id);
  withdrawal.vault = call.to;
  withdrawal.account = call.from;

  withdrawal.amount = vaultContract
    .balance()
    .times(call.inputs._shares)
    .div(vaultContract.totalSupply());
  // TODO: code line
  // balance().mul(_shares).div(totalSupply());

  withdrawal.shares = call.inputs._shares;
  withdrawal.timestamp = call.block.timestamp;
  withdrawal.blockNumber = call.block.number;
  withdrawal.save();
}

export function handleTransfer(_event: TransferEvent): void {
  // TODO:
}
