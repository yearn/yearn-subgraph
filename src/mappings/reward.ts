import { Address } from '@graphprotocol/graph-ts';

import { ERC20 } from '../../generated/Governance/ERC20';
import {
  RewardAdded,
  RewardPaid,
  Staked,
  Withdrawn,
} from '../../generated/Governance/Governance';
import { GovernanceRewards } from '../../generated/schema';
import { BIGINT_ZERO } from '../utils/constants';
import { getOrCreateAccount, getOrCreateToken } from '../utils/helpers';

let YFI = Address.fromString('0x0bc529c00C6401aEF6D220BE8C6Ea1667F6Ad93e');
function getOrCreateGovernance(address: Address): GovernanceRewards {
  let governance = GovernanceRewards.load(address.toHexString());

  if (governance == null) {
    governance = new GovernanceRewards(address.toHexString());
    governance.currentRewards = BIGINT_ZERO;
    governance.pendingRewards = BIGINT_ZERO;
    governance.totalRewards = BIGINT_ZERO;
    governance.stakingToken = getOrCreateToken(YFI).id;
    governance.stakedTokens = BIGINT_ZERO;
    governance.stakingTokenTotalSupply = BIGINT_ZERO;
  }

  let tokenContract = ERC20.bind(Address.fromString(governance.stakingToken));
  let tokenTotalSupply = tokenContract.try_totalSupply();
  governance.stakingTokenTotalSupply = !tokenTotalSupply.reverted
    ? tokenTotalSupply.value
    : governance.stakingTokenTotalSupply;

  return governance as GovernanceRewards;
}

export function handleRewardAdded(event: RewardAdded): void {
  let governance = getOrCreateGovernance(event.address);
  governance.pendingRewards = event.params.reward;
  governance.currentRewards = governance.currentRewards.plus(event.params.reward);
  governance.totalRewards = governance.totalRewards.plus(event.params.reward);
  governance.save();
}

export function handleRewardPaid(event: RewardPaid): void {
  let governance = getOrCreateGovernance(event.address);
  governance.currentRewards = governance.currentRewards.minus(event.params.reward);
  governance.save();

  let account = getOrCreateAccount(event.params.user.toHexString());
  account.governanceRewards = account.governanceRewards.plus(event.params.reward);
  account.save();
}

export function handleStaked(event: Staked): void {
  let governance = getOrCreateGovernance(event.address);
  governance.stakedTokens = governance.stakedTokens.plus(event.params.amount);
  governance.save();

  let account = getOrCreateAccount(event.params.user.toHexString());
  account.stakedTokens = account.stakedTokens.plus(event.params.amount);
  account.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let governance = getOrCreateGovernance(event.address);
  governance.stakedTokens = governance.stakedTokens.minus(event.params.amount);
  governance.save();

  let account = getOrCreateAccount(event.params.user.toHexString());
  account.stakedTokens = account.stakedTokens.minus(event.params.amount);
  account.save();
}
