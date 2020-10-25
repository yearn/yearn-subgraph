import { BigInt, Bytes, ethereum as eth } from '@graphprotocol/graph-ts';

// make a derived ID from transaction hash and big number
export function createId(tx: Bytes, n: BigInt): String {
  // return n.toHex() + '-' + tx.toHex();
  return tx.toHexString().concat('-').concat(n.toString());
}
