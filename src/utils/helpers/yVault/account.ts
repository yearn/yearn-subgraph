import { Account } from '../../../../generated/schema';

export function getOrCreateAccount(id: String): Account {
  // @ts-ignore: assign wrapper object to primitive
  let account = Account.load(id);

  if (account == null) {
    // @ts-ignore: assign wrapper object to primitive
    account = new Account(id);
  }

  return account as Account;
}
