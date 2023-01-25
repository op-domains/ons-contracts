import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import namehash from 'eth-ens-namehash'
import { keccak256 } from 'js-sha3'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  if (!network.tags.use_root) {
    return true
  }

  const registry = await ethers.getContract('ONSRegistry')
  const root = await ethers.getContract('Root')

  await deploy('BaseRegistrarImplementation', {
    from: deployer,
    args: [registry.address, namehash.hash('op')],
    log: true,
  })

  const registrar = await ethers.getContract('BaseRegistrarImplementation')

  const tx1 = await registrar.transferOwnership(owner, { from: deployer })
  console.log(`Transferring ownership of registrar to owner (tx: ${tx1.hash})...`)
  await tx1.wait()

  const tx2 = await root.connect(await ethers.getSigner(owner)).setSubnodeOwner('0x' + keccak256('op'), registrar.address)
  console.log(`Setting owner of op node to registrar on root (tx: ${tx2.hash})...`)
  await tx2.wait()

  return true
}

func.id = 'registrar'
func.tags = ['BaseRegistrarImplementation']
func.dependencies = ['ONSRegistry', 'Root']

export default func
