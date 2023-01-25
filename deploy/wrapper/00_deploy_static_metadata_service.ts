import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  let metadataHost = process.env.METADATA_HOST || 'op-metadata-service.appspot.com'
  if (network.name === 'localhost') {
    metadataHost = 'http://localhost:8080'
  }

  const metadataUrl = `${metadataHost}/name/0x{id}`

  await deploy('StaticMetadataService', {
    from: deployer,
    args: [metadataUrl],
    log: true,
  })

  return true
}

func.id = 'metadata'
func.tags = ['StaticMetadataService']
func.dependencies = []

export default func
