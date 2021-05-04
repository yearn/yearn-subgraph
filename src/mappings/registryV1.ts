import {
  AddDelegatedVaultCall,
  AddVaultCall,
  AddWrappedVaultCall,
} from '../../generated/RegistryV1/RegistryV1Contract';
import { VaultV1Template } from '../../generated/templates';

export function handleAddVaultCall(call: AddVaultCall): void {
  let vaultAddress = call.inputs._vault;
  VaultV1Template.create(vaultAddress);
}

export function handleAddWrappedVaultCall(call: AddWrappedVaultCall): void {
  let vaultAddress = call.inputs._vault;
  VaultV1Template.create(vaultAddress);
}

export function handleAddDelegatedVaultCall(call: AddDelegatedVaultCall): void {
  let vaultAddress = call.inputs._vault;
  VaultV1Template.create(vaultAddress);
}
