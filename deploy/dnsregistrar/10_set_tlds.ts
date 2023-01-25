import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const tld_map = {
  mainnet: ['xyz'],
  testnet: ['xyz']
}

const ZERO_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';

async function setTLDsOnRoot(
  owner: string,
  root: any,
  registry: any,
  registrar: any,
  tlds: any[],
) {
  if (tlds === undefined) {
    return []
  }

  const transactions: any[] = []
  for (const tld of tlds) {
    const labelhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tld))
    if (
      registrar.address !== (await registry.owner(ethers.utils.namehash(tld)))
    ) {
      console.log(`Transferring .${tld} to new DNS registrar`)
      transactions.push(
        await root.setSubnodeOwner(labelhash, registrar.address, {
          from: owner,
          gasLimit: 10000000,
        }),
      )
    }
  }
  return transactions
}

async function setTLDsOnRegistry(
  owner: string,
  registry: any,
  registrar: any,
  tlds: any[],
) {
  if (tlds === undefined) {
    return []
  }

  const transactions: any[] = []
  for (const tld of tlds) {
    const labelhash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(tld))
    if (
      registrar.address !== (await registry.owner(ethers.utils.namehash(tld)))
    ) {
      console.log(`Transferring .${tld} to new DNS registrar`)
      transactions.push(
        await registry.setSubnodeOwner(
          ZERO_HASH,
          labelhash,
          registrar.address,
          { from: owner },
        ),
      )
    }
  }
  return transactions
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, network } = hre
  const { owner } = await getNamedAccounts()

  const registrar = await ethers.getContract('DNSRegistrar')
  const signer = await ethers.getSigner(owner)

  let transactions: any[] = []
  if (network.tags.use_root) {
    const root = await ethers.getContract('Root', signer)
    const registry = await ethers.getContract('ONSRegistry', signer)
    transactions = await setTLDsOnRoot(
      owner,
      root,
      registry,
      registrar,
      tld_map[network.name as keyof typeof tld_map],
    )
  } else {
    const registry = await ethers.getContract('ONSRegistry', signer)
    transactions = await setTLDsOnRegistry(
      owner,
      registry,
      registrar,
      tld_map[network.name as keyof typeof tld_map],
    )
  }

  if (transactions.length > 0) {
    console.log(
      `Waiting on ${transactions.length} transactions setting DNS TLDs`,
    )
    await Promise.all(transactions.map((tx) => tx.wait()))
  }

  return true
}

func.id = 'set-dns-registrar'
func.tags = ['SetDNSRegistrar']
func.dependencies = ['ONSRegistry', 'Root', 'DNSSecOracle']

export default func
