import { ethereum } from "@graphprotocol/graph-ts"
import {V1Contract, Transfer} from "../generated/yUSDVault/V1Contract"
import {V1CContract} from "../generated/V1Controller/V1CContract"
import { Vault, Transfer as t } from "../generated/schema"

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

  let id2 = event.transaction.hash.toHexString()
  let transfer = new t(id2)
  transfer.vault = vault.id
  transfer.from = event.params.from
  transfer.to = event.params.to
  transfer.amount = event.params.value
  transfer.timestamp = event.block.timestamp
  transfer.save()

}