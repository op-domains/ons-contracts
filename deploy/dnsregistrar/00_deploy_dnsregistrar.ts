import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  const registry = await ethers.getContract('ONSRegistry')
  const dnssec = await ethers.getContract('DNSSECImpl')

  await deploy('TLDPublicSuffixList', {
    from: deployer,
    args: [],
    log: true,
  })

  const publicSuffixList = await ethers.getContract('TLDPublicSuffixList')

  await deploy('DNSRegistrar', {
    from: deployer,
    args: [dnssec.address, publicSuffixList.address, registry.address],
    log: true,
  })

  return true
}

func.id = 'dns-registrar'
func.tags = ['DNSRegistrar']
func.dependencies = ['ONSRegistry', 'DNSSecOracle']

export default func
