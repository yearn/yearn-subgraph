import { Account, AccountVaultBalance } from "../../../../generated/schema";
import { BIGINT_ZERO } from "../../constants";

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

export function getOrCreateAccountVaultBalance(
  id: String,
  createIfNotFound: boolean = true
): AccountVaultBalance {
  let balance = AccountVaultBalance.load(id);

  if (balance == null && createIfNotFound) {
    balance = new AccountVaultBalance(id);

    balance.balance = BIGINT_ZERO;
    balance.totalDeposited = BIGINT_ZERO;
    balance.totalWithdrawn = BIGINT_ZERO;
    balance.totalSent = BIGINT_ZERO;
    balance.totalReceived = BIGINT_ZERO;
    balance.shareBalance = BIGINT_ZERO;
    balance.totalSharesMinted = BIGINT_ZERO;
    balance.totalSharesBurned = BIGINT_ZERO;
    balance.totalSharesSent = BIGINT_ZERO;
    balance.totalSharesReceived = BIGINT_ZERO;
  }

  return balance as AccountVaultBalance;
}
