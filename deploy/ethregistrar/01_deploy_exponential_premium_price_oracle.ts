import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  if (network.name === 'mainnet') {
    return true
  }

  await deploy('DummyOracle', {
    from: deployer,
    args: ['160000000000'],
    log: true,
  })

  const dummyOracle = await ethers.getContract('DummyOracle')

  await deploy('ExponentialPremiumPriceOracle', {
    from: deployer,
    args: [
      dummyOracle.address,
      [0, 0, '20294266869609', '5073566717402', '158548959919'],
      '100000000000000000000000000',
      21,
    ],
    log: true,
  })

  return true
}

func.id = 'price-oracle'
func.tags = ['ExponentialPremiumPriceOracle']
func.dependencies = []

export default func
