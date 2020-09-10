import { Account } from "../../../../generated/schema";

export function getOrCreateAccount(
  id: String,
  createIfNotFound: boolean = true
): Account {
  let account = Account.load(id);

  if (account == null && createIfNotFound) {
    account = new Account(id);
  }

  return account as Account;
}
