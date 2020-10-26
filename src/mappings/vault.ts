import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Account, Deposit, Transfer, Vault, Withdrawal } from '../../generated/schema';
import { Vault as V1 } from '../../generated/yUSDVault/Vault';
import {
  DepositCall,
  Transfer as TransferEvent,
  WithdrawCall,
} from '../../generated/yUSDVault/Vault';
import { BIGINT_ZERO, DEFAULT_DECIMALS } from '../utils/constants';
import { createId, getOrCreateAccount, getOrCreateToken } from '../utils/utils';

export function handleDeposit(call: DepositCall): void {
  let id = createId(call.transaction.hash, call.transaction.index);

  let account = getOrCreateAccount(call.from);
  let vaultContract = V1.bind(call.to);

  let deposit = new Deposit(id);
  deposit.vault = call.to;
  deposit.account = account.id;
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

  let account = getOrCreateAccount(call.from);
  let vaultContract = V1.bind(call.to);

  let withdrawal = new Withdrawal(id);
  withdrawal.vault = call.to;
  withdrawal.account = account.id;

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

export function handleTransfer(event: TransferEvent): void {
  let id = createId(event.transaction.hash, event.transaction.index);

  let vaultContract = V1.bind(event.address);

  let token = getOrCreateToken(event.address);
  let sender = getOrCreateAccount(event.params.from);
  let receiver = getOrCreateAccount(event.params.from);

  let transfer = new Transfer(id);
  transfer.from = sender.id;
  transfer.to = receiver.id;

  transfer.token = token.id;
  transfer.shares = event.params.value;
  transfer.amount = vaultContract
    .balance()
    .times(event.params.value)
    .div(vaultContract.totalSupply());

  transfer.timestamp = event.block.timestamp;
  transfer.blockNumber = event.block.number;
  transfer.save();
}
