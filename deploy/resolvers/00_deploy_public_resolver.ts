import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer, owner } = await getNamedAccounts()

  const registry = await ethers.getContract('ONSRegistry', owner)
  const nameWrapper = await ethers.getContract('NameWrapper', owner)
  const controller = await ethers.getContract('ETHRegistrarController', owner)
  const reverseRegistrar = await ethers.getContract('ReverseRegistrar', owner)

  const deployArgs = {
    from: deployer,
    args: [
      registry.address,
      nameWrapper.address,
      controller.address,
      reverseRegistrar.address,
    ],
    log: true,
  }
  await deploy('PublicResolver', deployArgs)

  const publicResolver = await ethers.getContract('PublicResolver')

  const tx = await reverseRegistrar.setDefaultResolver(publicResolver.address)
  console.log(`Setting default resolver on ReverseRegistrar to PublicResolver (tx: ${tx.hash})...`)
  await tx.wait()

  return true
}

func.id = 'resolver'
func.tags = ['PublicResolver']
func.dependencies = [
  'ONSRegistry',
  'ETHRegistrarController',
  'NameWrapper',
  'ReverseRegistrar',
]

export default func
