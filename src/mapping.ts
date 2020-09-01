import { Address } from "@graphprotocol/graph-ts"
import {Contract, Transfer} from "../generated/Contract/Contract"
import { Vault, Deposit, Withdrawal } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHexString()
  let vault = new Vault(id)
  let c = Contract.bind(event.address)

  vault.price = c.getPricePerFullShare()
  vault.save()
}
