import { HarvestCall } from "../../generated/yUSDVault/V1Contract";
import { Address } from "@graphprotocol/graph-ts";
import {
  getOrCreateVault,
  getOrCreateStrategy
} from "../utils/helpers";
import { ZERO_ADDRESS } from "../utils/constants";

export function handleHarvest(call: HarvestCall): void {
  // Vault is automatically updated on the helper method, so calling it and saving
  // the entity is enough to have it updated.
  let strategy = getOrCreateStrategy(call.to);
  let vault = getOrCreateVault(Address.fromString(strategy.vault));
  vault.save();
}
