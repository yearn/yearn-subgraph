import { Address, BigInt, Bytes, ethereum as eth } from '@graphprotocol/graph-ts';

import {
  Account,
  Deposit,
  Token,
  Transfer,
  Vault,
  Withdrawal,
} from '../../generated/schema';
import { ERC20 } from '../../generated/yUSDVault/ERC20';
import { DEFAULT_DECIMALS } from '../utils/constants';

// make a derived ID from transaction hash and big number
export function createId(tx: Bytes, n: BigInt): String {
  // return n.toHex() + '-' + tx.toHex();
  return tx.toHexString().concat('-').concat(n.toString());
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
