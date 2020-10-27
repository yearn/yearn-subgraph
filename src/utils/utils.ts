import { Address, BigInt, Bytes, ethereum as eth } from '@graphprotocol/graph-ts';

import {
  Account,
  Controller,
  Operation,
  // Deposit,
  Token,
  Transfer,
  Vault,
  VaultUpdate,
  // Withdrawal,
} from '../../generated/schema';
import { ERC20 } from '../../generated/yUSDVault/ERC20';
import { Vault as V1 } from '../../generated/yUSDVault/Vault';
import { BIGINT_ZERO, DEFAULT_DECIMALS } from '../utils/constants';

// make a derived ID from transaction hash and big number
export function createId(tx: Bytes, n: BigInt): String {
  return tx.toHexString().concat('-').concat(n.toString());
}

export function createUpdateId(address: Address, tx: Bytes, n: BigInt): String {
  return address
    .toHexString()
    .concat('-')
    .concat(tx.toHexString().concat('-').concat(n.toString()));
}

export function getOrCreateAccount(address: Address): Account {
  let id = address.toHexString();
  let account = Account.load(id);

  if (account == null) {
    account = new Account(id);
    account.save();
  }

  return account as Account;
}

export function getOrCreateToken(address: Address): Token {
  let id = address.toHexString();
  let token = Token.load(id);

  if (token == null) {
    token = new Token(id);
    token.address = address;

    let erc20Contract = ERC20.bind(address);
    let decimals = erc20Contract.try_decimals();
    // using try_cause some values might be missing
    let name = erc20Contract.try_name();
    let symbol = erc20Contract.try_symbol();

    // TODO: add overrides for name and symbol
    token.decimals = decimals.reverted ? DEFAULT_DECIMALS : decimals.value;
    token.name = name.reverted ? '' : name.value;
    token.symbol = symbol.reverted ? '' : symbol.value;

    token.save();
  }

  return token as Token;
}

// export function createDummyVaultUpdate(id: String): vaultUpdateId {
//   let vaultUpdate = new VaultUpdate(id);
//   vaultUpdate.timestamp = BIGINT_ZERO;
//   vaultUpdate.blockNumber = BIGINT_ZERO;

//   vaultUpdate.balance = BIGINT_ZERO;
//   vaultUpdate.deposits = BIGINT_ZERO;
//   vaultUpdate.withdrawals = BIGINT_ZERO;

//   vaultUpdate.shareBalance = BIGINT_ZERO;
//   vaultUpdate.sharesMinted = BIGINT_ZERO;
//   vaultUpdate.sharesBurnt = BIGINT_ZERO;

//   vaultUpdate.vault = id;
//   vaultUpdate.pricePerFullShare = BIGINT_ZERO;
// }

export function createOperation(
  id: String,
  vault: String,
  account: String,
  amount: BigInt,
  shares: BigInt,
  timestamp: BigInt,
  blockNumber: BigInt,
  type: String,
): Operation {
  let operation = new Operation(id);
  operation.vault = vault;
  operation.account = account;
  operation.amount = amount;
  operation.shares = shares;

  operation.shares = shares;
  operation.timestamp = timestamp;
  operation.blockNumber = blockNumber;

  operation.type = type;

  operation.save();

  return operation as Operation;
}

export function getOrCreateController(address: Address): Controller {
  let id = address.toHexString();
  let controller = Controller.load(id);

  if (controller == null) {
    controller = new Controller(id);
    controller.save();
  }

  return controller as Controller;
}

export function getOrCreateVault(address: Address): Vault {
  let id = address.toHexString();
  let vault = Vault.load(id);

  if (vault == null) {
    vault = new Vault(id);
    let vaultContract = V1.bind(address);

    let token = getOrCreateToken(vaultContract.token());
    let shareToken = getOrCreateToken(address);
    let contoller = getOrCreateController(vaultContract.controller());

    vault.token = token.id;
    vault.shareToken = shareToken.id;
    vault.controller = contoller.id;

    // TODO: populate other vault fields
    vault.timestamp = BIGINT_ZERO;
    vault.blockNumber = BIGINT_ZERO;

    // NOTE: empty at start
    vault.vaultUpdates = [];
    // vault.strategyUpdates = []

    vault.save();
  }

  return vault as Vault;
}

export function createVaultUpdate(
  vaultUpdateId: String,
  timestamp: BigInt,
  blockNumber: BigInt,
  deposits: BigInt,
  withdrawals: BigInt, // withdrawal doesn't change
  sharesMinted: BigInt,
  sharesBurnt: BigInt, // shares burnt don't change
  vaultId: String,
  pricePerFullShare: BigInt,
): VaultUpdate {
  let vault = Vault.load(vaultId);

  let vaultUpdate = new VaultUpdate(vaultUpdateId);

  vaultUpdate.timestamp = timestamp;
  vaultUpdate.blockNumber = blockNumber;

  vaultUpdate.balance = deposits.minus(withdrawals);
  vaultUpdate.deposits = deposits;
  vaultUpdate.withdrawals = withdrawals;

  vaultUpdate.shareBalance = sharesMinted.minus(sharesBurnt);
  vaultUpdate.sharesMinted = sharesMinted;
  vaultUpdate.sharesBurnt = sharesBurnt;
  // NOTE: don't update vaultUpdate.sharesBurnt

  vaultUpdate.vault = vault.id;
  vaultUpdate.pricePerFullShare = pricePerFullShare;

  let vaultUpdates = vault.vaultUpdates;
  if (vaultUpdates.length > 0) {
    let previousVaultUpdate = VaultUpdate.load(vaultUpdates[vaultUpdates.length - 1]);

    // TODO: add update algorithm
    vaultUpdate.withdrawalFees = previousVaultUpdate.withdrawalFees;
    vaultUpdate.performanceFees = previousVaultUpdate.performanceFees;
    vaultUpdate.earnings = vaultUpdate.withdrawalFees.plus(vaultUpdate.performanceFees);
  } else {
    vaultUpdate.withdrawalFees = BIGINT_ZERO;
    vaultUpdate.performanceFees = BIGINT_ZERO;
    vaultUpdate.earnings = BIGINT_ZERO;
  }

  vaultUpdates.push(vaultUpdate.id);
  vault.vaultUpdates = vaultUpdates;

  vaultUpdate.save();
  vault.save();

  return vaultUpdate as VaultUpdate;
}

// export function getOrCreateVaultUpdate(
//   vaultId: String,
//   vaultUpdateId: String,
//   call: DepositCall,
// ): VaultUpdate {
//   let vault = Vault.load(vaultId);
//   let vaultUpdate = VaultUpdate.load(vaultUpdateId);

//   if (vaultUpdate == null) {
//     vaultUpdate = new VaultUpdate(vaultUpdateId);

//     vaultUpdate.timestamp = call.block.timestamp;
//     vaultUpdate.blockNumber = call.block.number;

//     vaultUpdate.balance = call.inputs._amount;
//     vaultUpdate.deposits = call.inputs._amount;
//     // NOTE: don't update vaultUpdate.withdrawals

//     vaultUpdate.shareBalance = shares;
//     vaultUpdate.sharesMinted = shares;
//     // NOTE: don't update vaultUpdate.sharesBurnt

//     vaultUpdate.vault = vault.id;
//     vaultUpdate.pricePerFullShare = vaultContract.getPricePerFullShare();

//     let vaultUpdates = vault.vaultUpdates;
//     if (vaultUpdates.length > 0) {
//       let previousVaultUpdate = VaultUpdate.load(vaultUpdates[vaultUpdates.length - 1]);

//       // TODO: add update algorithm
//       vaultUpdate.withdrawalFees = previousVaultUpdate.withdrawalFees;
//       vaultUpdate.performanceFees = previousVaultUpdate.performanceFees;
//       vaultUpdate.earnings = vaultUpdate.withdrawalFees.plus(vaultUpdate.performanceFees);
//     } else {
//       vaultUpdate.withdrawalFees = BIGINT_ZERO;
//       vaultUpdate.performanceFees = BIGINT_ZERO;
//       vaultUpdate.earnings = BIGINT_ZERO;
//     }

//     vaultUpdate.save();
//   }

//   return vaultUpdate as VaultUpdate;
// }
