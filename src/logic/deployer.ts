import { hexToBytes } from 'eth-connect'
import { AuthChain, Authenticator } from '@dcl/crypto'
import { ethSign } from '@dcl/crypto/dist/crypto'
import { createFetchComponent } from '@well-known-components/fetch-component'
import { createContentClient } from 'dcl-catalyst-client'
import { DeploymentPreparationData } from 'dcl-catalyst-client/dist/client/types'

import { Identity } from '../types'

export function generateAuthChain(entityId: string, identity: Identity): AuthChain {
  const signature = ethSign(hexToBytes(identity.privateKey), entityId)
  const authChain = Authenticator.createSimpleAuthChain(entityId, identity.ethAddress, signature)
  return authChain
}

export function deploy(deploymentData: DeploymentPreparationData, identity: Identity, target: string) {
  const fetchComponent = createFetchComponent()

  const contentClient = createContentClient({
    url: target,
    fetcher: fetchComponent
  })
  const authChain = generateAuthChain(deploymentData.entityId, identity)

  return contentClient.deploy({
    authChain,
    entityId: deploymentData.entityId,
    files: deploymentData.files
  })
}
