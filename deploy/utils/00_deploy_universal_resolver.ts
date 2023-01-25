import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const registry = await ethers.getContract('ONSRegistry')

  await deploy('UniversalResolver', {
    from: deployer,
    args: [registry.address],
    log: true,
  })

  return true
}

func.id = 'universal-resolver'
func.tags = [ 'UniversalResolver']
func.dependencies = ['ONSRegistry']

export default func
