const EthCrypto = require("eth-crypto")
const { Authenticator } = require("dcl-crypto")
const { EntityType, EntityVersion } = require("dcl-catalyst-commons")
const { CatalystClient, DeploymentBuilder } = require("dcl-catalyst-client")

const catalystUrl = "https://peer-ue-2.decentraland.zone"

let options = {
  vus: 200,
  duration: "600s",
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const { address, privateKey, publicKey } = EthCrypto.createIdentity()

const setup = async () => {
  const randomFileSufix = (Math.random() + 1).toString(36).substring(7)

  const contentPaths = [`aFile-${randomFileSufix}`, `anotherFile-${randomFileSufix}`, `aThirdFile-${randomFileSufix}`]

  const buffers = new Map(contentPaths.map((filePath) => [filePath, Buffer.from("Hello")]))

  const { entityId, files } = await DeploymentBuilder.buildEntity({
    type: EntityType.PROFILE,
    pointers: [address],
    version: EntityVersion.V3,
    files: buffers,
  })

  // Signing message
  const messageToSign = entityId

  const messageHash = Authenticator.createEthereumMessageHash(messageToSign)
  const signature = EthCrypto.sign(privateKey, messageHash)
  const authChain = Authenticator.createSimpleAuthChain(entityId, address, signature)

  const client = new CatalystClient({ catalystUrl })

  return { entityId, files, authChain, client }
}

async function main() {
  while (true) {
    const { entityId, files, authChain, client } = await setup()

    console.log("DEPLOYING", {
      authChain,
      entityId,
      files,
    })

    client.deployEntity({
      authChain,
      entityId,
      files,
    })

    await sleep(2000)
  }
}

main().catch((err) => {
  console.log("ERROR", err)
})
