import { Address, BigInt, Bytes } from '@graphprotocol/graph-ts';

import { Account, Operation, Transfer, Vault, VaultUpdate } from '../../generated/schema';
import { Vault as V1 } from '../../generated/yUSDVault/Vault';
import {
  DepositCall,
  Transfer as TransferEvent,
  WithdrawCall,
} from '../../generated/yUSDVault/Vault';
import { BIGINT_ZERO, DEFAULT_DECIMALS } from '../utils/constants';
import {
  createId,
  createOperation,
  createUpdateId,
  createVaultUpdate,
  getOrCreateAccount,
  getOrCreateToken,
  getOrCreateVault,
} from '../utils/utils';

// TODO:
// - AccountUpdate
// - AccountVaultBalance

export function handleDeposit(call: DepositCall): void {
  let id = createId(call.transaction.hash, call.transaction.index);
  let vaultAddress = call.to;

  let account = getOrCreateAccount(call.from);
  let vault = getOrCreateVault(vaultAddress);
  let vaultContract = V1.bind(vaultAddress);

  // TODO: link this line on contract
  let shares = vaultContract.balance().equals(BIGINT_ZERO)
    ? call.inputs._amount
    : call.inputs._amount.times(vaultContract.totalSupply()).div(vaultContract.balance());

  // this is not supported by AS, yet
  // let params: IParams = {
  //   id: id,
  //   vault: vault.id,
  //   account: account.id,
  //   amount: call.inputs._amount,
  //   shares: shares,
  //   timestamp: call.block.timestamp,
  //   blockNumber: call.block.number,
  //   type: 'Withdrawal',
  // };

  createOperation(
    id,
    vault.id,
    account.id,
    call.inputs._amount,
    shares,
    call.block.timestamp,
    call.block.number,
    'Deposit',
  );

  // TODO: vaultUpdate

  let vaultUpdateId = createUpdateId(
    vaultAddress,
    call.transaction.hash,
    call.transaction.index,
  );

  createVaultUpdate(
    vaultUpdateId,
    call.block.timestamp,
    call.block.number,
    // call.inputs._amount, // don't pass
    call.inputs._amount,
    BIGINT_ZERO, // withdrawal doesn't change
    // shares, // don't pass
    shares,
    BIGINT_ZERO, // shares burnt don't change
    vault.id,
    vaultContract.getPricePerFullShare(),
    // earnings, // don't pass
    // withdrawalFees, // don't pass
    // performanceFees, // don't pass
  );

  // TODO: accountUpdate
  // deposit.save();
}

export function handleWithdrawal(call: WithdrawCall): void {
  let id = createId(call.transaction.hash, call.transaction.index);
  let vaultAddress = call.to;

  let account = getOrCreateAccount(call.from);
  let vault = getOrCreateVault(vaultAddress);
  let vaultContract = V1.bind(vaultAddress);

  let amount = vaultContract
    .balance()
    .times(call.inputs._shares)
    .div(vaultContract.totalSupply());

  createOperation(
    id,
    vault.id,
    account.id,
    amount,
    call.inputs._shares,
    call.block.timestamp,
    call.block.number,
    'Withdrawal',
  );

  let vaultUpdateId = createUpdateId(
    vaultAddress,
    call.transaction.hash,
    call.transaction.index,
  );

  createVaultUpdate(
    vaultUpdateId,
    call.block.timestamp,
    call.block.number,
    // call.inputs._amount, // don't pass
    BIGINT_ZERO, // deposit doesn't change
    amount,
    // shares, // don't pass
    BIGINT_ZERO, // shares minted don't change
    call.inputs._shares,
    vault.id,
    vaultContract.getPricePerFullShare(),
    // earnings, // don't pass
    // withdrawalFees, // don't pass
    // performanceFees, // don't pass
  );

  // TODO: accountUpdate
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

  // TODO: accountUpdate

  transfer.save();
}
