import { Address, log } from '@graphprotocol/graph-ts';

import {
  Controller,
  Deposit,
  Harvest,
  Strategy,
  Transfer,
  Vault,
  Withdrawal,
} from '../../../../generated/schema';
import { Strategy as StrategyABI } from '../../../../generated/templates';
import { Controller as ControllerContract } from '../../../../generated/yBUSDVault/Controller';
import { Strategy as StrategyContract } from '../../../../generated/yBUSDVault/Strategy';
import { V1Contract } from '../../../../generated/yBUSDVault/V1Contract';
import { BIGDECIMAL_ZERO, BIGINT_ZERO } from '../../constants';
import { getOrCreateToken } from './token';

// export function getOrCreateVaultTransfer(id: String): Transfer {
//   // @ts-ignore: assign wrapper object to primitive
//   let action = Transfer.load(id);

//   if (action == null) {
//     // @ts-ignore: assign wrapper object to primitive
//     action = new Transfer(id);
//   }

//   return action as Transfer;
// }

// export function getOrCreateVaultDeposit(id: String): Deposit {
//   // @ts-ignore: assign wrapper object to primitive
//   let action = Deposit.load(id);

//   if (action == null) {
//     // @ts-ignore: assign wrapper object to primitive
//     action = new Deposit(id);
//   }

//   return action as Deposit;
// }

// export function getOrCreateVaultWithdrawal(id: String): Withdrawal {
//   // @ts-ignore: assign wrapper object to primitive
//   let action = Withdrawal.load(id);

//   if (action == null) {
//     // @ts-ignore: assign wrapper object to primitive
//     action = new Withdrawal(id);
//   }

//   return action as Withdrawal;
// }

// export function getOrCreateHarvest(id: String): Harvest {
//   // @ts-ignore: assign wrapper object to primitive
//   let action = Harvest.load(id);

//   if (action == null) {
//     // @ts-ignore: assign wrapper object to primitive
//     action = new Harvest(id);
//   }

//   return action as Harvest;
// }

export function getOrCreateController(address: Address): Controller {
  let id = address.toHexString();
  let controller = Controller.load(id);

  if (controller == null) {
    controller = new Controller(id);
  }

  return controller as Controller;
}

// FIXME:
export function getOrCreateStrategy(address: Address): Strategy {
  let id = address.toHexString();
  let strategy = Strategy.load(id);

  if (strategy == null) {
    strategy = new Strategy(id);
    // dynamically index strategies
    StrategyABI.create(address);
  }

  return strategy as Strategy;
}

export function getOrCreateVault(vaultAddress: Address): Vault {
  let vault = Vault.load(vaultAddress.toHexString());
  // let vaultContract = V1Contract.bind(vaultAddress);

  if (vault == null) {
    vault = new Vault(vaultAddress.toHexString());
  }

  return vault as Vault;
}
