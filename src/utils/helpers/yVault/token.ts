import { Address } from '@graphprotocol/graph-ts';

import { Token } from '../../../../generated/schema';
import { ERC20 } from '../../../../generated/yBUSDVault/ERC20';
import { DEFAULT_DECIMALS } from '../../decimals';

export function getOrCreateToken(tokenAddress: Address, persist: boolean = true): Token {
  let addressString = tokenAddress.toHexString();

  let token = Token.load(addressString);

  if (token == null) {
    token = new Token(addressString);
    token.address = tokenAddress;

    let erc20Token = ERC20.bind(tokenAddress);

    let tokenDecimals = erc20Token.try_decimals();
    let tokenName = erc20Token.try_name();
    let tokenSymbol = erc20Token.try_symbol();

    token.decimals = !tokenDecimals.reverted ? tokenDecimals.value : DEFAULT_DECIMALS;
    token.name = !tokenName.reverted ? tokenName.value : '';
    token.symbol = !tokenSymbol.reverted ? tokenSymbol.value : '';

    if (persist) {
      token.save();
    }
  }

  return token as Token;
}
