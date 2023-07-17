import { namehash } from 'ethers/lib/utils'
import { ethers, network } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { keccak256 } from 'js-sha3'
import { DeploymentsExtension } from "hardhat-deploy/types";
const { makeInterfaceId } = require('@openzeppelin/test-helpers')

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const utils = ethers.utils;
const labelhash = (name: string) => utils.keccak256(utils.toUtf8Bytes(name))

async function computeInterfaceId(deployments: DeploymentsExtension, name: string) {
  const artifact = await deployments.getArtifact(name);
  const iface = new utils.Interface(artifact.abi);

  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { owner } = await getNamedAccounts()

  const registry = await ethers.getContract('ONSRegistry', owner)
  const root = await ethers.getContract('Root', owner);
  const registrar = await ethers.getContract('BaseRegistrarImplementation', owner)
  const nameWrapper = await ethers.getContract('NameWrapper', owner)
  const controller = await ethers.getContract('ETHRegistrarController', owner)
  const resolver = await ethers.getContract('PublicResolver')

  const tx1 = await registrar.setResolver(resolver.address)
  console.log(`Setting resolver for .op to PublicResolver (tx: ${tx1.hash})...`)
  await tx1.wait()

  const ownerOfResolver = await registry.owner(namehash('resolver'))
  if (ownerOfResolver == ZERO_ADDRESS) {
    const tx = await root.setSubnodeOwner('0x' + keccak256('resolver'), owner)
    console.log(`Setting owner of resolver.op to owner on registry (tx: ${tx.hash})...`)
    await tx.wait()
  } else if (ownerOfResolver != owner) {
    console.log('resolver.op is not owned by the owner address, not setting resolver')
    return
  }

  const tx2 = await registry.setResolver(namehash('resolver'), resolver.address)
  console.log(`Setting resolver for resolver.op to PublicResolver (tx: ${tx2.hash})...`)
  await tx2.wait()

  const tx3 = await resolver['setAddr(bytes32,address)'](namehash('resolver'), resolver.address)
  console.log(`Setting address for resolver.op to PublicResolver (tx: ${tx3.hash})...`)
  await tx3.wait()

  const providerWithOns = new ethers.providers.StaticJsonRpcProvider(
    network.name === 'mainnet' ? 'https://mainnet.optimism.io' : 'https://goerli.optimism.io',
    { chainId: network.name === 'mainnet' ? 10 : 420, name: 'optimism_goerli', ensAddress: registry.address },
  )

  const resolverAddr = await providerWithOns.getResolver('op')
  if (resolverAddr === null) {
    console.log('No resolver set for .op not setting interface')
    return
  }

  const tx4 = await root.setSubnodeOwner('0x' + keccak256('op'), owner)
  console.log(`Temporarily setting owner of op to owner  (tx: ${tx4.hash})...`)
  await tx4.wait()

  const iNameWrapper = await computeInterfaceId(deployments, 'NameWrapper') 
  const tx5 = await resolver.setInterface(namehash('op'), iNameWrapper, nameWrapper.address)
  console.log(`Setting NameWrapper interface ID ${iNameWrapper} on .op resolver (tx: ${tx5.hash})...`)
  await tx5.wait()

  const iRegistrarController = await computeInterfaceId(deployments, 'IETHRegistrarController')
  const tx6 = await resolver.setInterface(namehash('op'), iRegistrarController, controller.address)
  console.log(`Setting IETHRegistrarController interface ID ${iRegistrarController} on .op resolver (tx: ${tx6.hash})...`)
  await tx6.wait()

  const iBulkRenewal = await computeInterfaceId(deployments, 'IBulkRenewal')
  const tx7 = await resolver.setInterface(namehash('op'), iBulkRenewal, controller.address)
  console.log(`Setting BulkRenewal interface ID ${iBulkRenewal} on .op resolver (tx: ${tx7.hash})...`)
  await tx7.wait()

  const tx8 = await root.setSubnodeOwner('0x' + keccak256('op'), registrar.address)
  console.log(`Set owner of op back to registrar (tx: ${tx8.hash})...`)
  await tx8.wait();

  return true
}

func.id = 'final-setup'
func.tags = ['FinalSetup']
func.dependencies = [
  'ONSRegistry',
  'BaseRegistrarImplementation',
  'NameWrapper',
  'ETHRegistrarController',
  'PublicResolver',
]

export default func
