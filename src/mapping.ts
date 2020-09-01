import { Address } from "@graphprotocol/graph-ts"
import {V1Contract, Transfer} from "../generated/yUSDVault/V1Contract"
import { Vault } from "../generated/schema"

export function handleTransfer(event: Transfer): void {
  let id = event.address.toHexString()
  let vault = new Vault(id)
  let c = V1Contract.bind(event.address)

  vault.timestamp = event.block.timestamp
  vault.block = event.block.number
  vault.getPricePerFullShare = c.getPricePerFullShare()
  vault.totalSupply = c.totalSupply()
  vault.balance = c.balance()
  vault.available = c.available()
  vault.token = c.token()
  vault.symbol = c.symbol()
  vault.name  = c.name()
  vault.controller = c.controller()
  vault.save()
}
