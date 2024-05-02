import fs from 'fs'
import path from 'path'
import { createDotEnvConfigComponent } from '@well-known-components/env-config-provider'
import { BodyShape, Emote, EmoteCategory, EmoteRepresentationADR74, EntityType, I18N, Locale } from '@dcl/schemas'
import { hexToBytes } from 'eth-connect'
import { Authenticator } from '@dcl/crypto'
import { ethSign } from '@dcl/crypto/dist/crypto'
import { readFile, readFilesFrom } from '../adapters/file-system'
import { parseUrn } from '@dcl/urn-resolver'
import { extractAssetTextures } from '../logic/glb-optimizer'
import { ArgumentParser } from 'argparse'
import { DeploymentPreparationData } from 'dcl-catalyst-client/dist/client/types'
import { createContentClient, DeploymentBuilder } from 'dcl-catalyst-client'
import { createFetchComponent } from '@well-known-components/fetch-component'
import { createLogComponent } from '@well-known-components/logger'

const rootDirectory = path.resolve(__dirname, '../..')

export type JSONData = {
  name: string
  loop: boolean
  description: string
  i18n: {
    [key: string]: string
  }
  tags: string[]
  main: {
    type: string
    model: string
  }[]
}

export function getBodyShapeByType(type: string): BodyShape {
  return type.toLowerCase().includes('female') ? BodyShape.FEMALE : BodyShape.MALE
}

async function main() {
  const logs = await createLogComponent({})
  const config = await createDotEnvConfigComponent({ path: ['.env'] })
  const fetchComponent = createFetchComponent()

  const logger = logs.getLogger('avatar-assets')

  const parser = new ArgumentParser({ add_help: true })
  parser.add_argument('--deploy', {
    required: false,
    action: 'store_true',
    help: 'If not provided, only prepare the assets'
  })
  parser.add_argument('--ci', {
    required: false,
    action: 'store_true',
    help: 'Run for CI'
  })
  parser.add_argument('--target', {
    required: true,
    help: 'The address of the catalyst server where the wearables will be deployed'
  })
  parser.add_argument('directories', {
    metavar: 'directories',
    type: 'str',
    nargs: '+',
    help: 'directories with asset.json to upload'
  })

  const args = parser.parse_args()

  let ethAddress = ''
  let privateKey = ''
  if (args.deploy) {
    ethAddress = await config.requireString('ADDRESS')
    privateKey = await config.requireString('PRIVATE_KEY')
  }

  const target = args.target.includes('localhost') ? args.target : `${args.target}/content`

  const contentClient = createContentClient({
    url: target,
    fetcher: fetchComponent
  })

  const errors: any[] = []

  for (const updatedDirectory of args.directories) {
    const fullpath = path.join(rootDirectory, updatedDirectory)
    const assetJsonPath = path.join(fullpath, 'asset.json')
    if (!fs.existsSync(assetJsonPath)) {
      continue
    }

    const json: JSONData = readFile<JSONData>(assetJsonPath)
    json.tags = json.tags || []

    const legacyId = `dcl://base-emotes/` + json.name

    const urn = await parseUrn(legacyId)
    if (!urn) {
      console.error(`Failed to parse the legacy ID: '${legacyId}'`)
      continue
    }

    const glbFilesPaths = readFilesFrom(fullpath, ['.glb'])
    const extractedTextures = await extractAssetTextures(glbFilesPaths)
    const extractTexturesFilesNames: string[] = []

    const files = new Map<string, Uint8Array>()
    for (const texture of extractedTextures) {
      extractTexturesFilesNames.push(texture.fileName)
      files.set(texture.fileName, new Uint8Array(texture.buffer))
    }
    files.set('thumbnail.png', new Uint8Array(fs.readFileSync(path.join(fullpath, 'thumbnail.png'))))

    const metadata: Omit<Emote, 'rarity' | 'collectionAddress'> = {
      id: urn.uri.toString(),
      name: json.name,
      description: json.description,
      image: '',
      thumbnail: 'thumbnail.png', // default value for thumbnails
      i18n: Object.keys(json.i18n).reduce((cumm, code) => {
        const text = json.i18n[code]
        cumm.push({ code: code as Locale, text })
        return cumm
      }, [] as I18N[]),
      emoteDataADR74: {
        category: EmoteCategory.MISCELLANEOUS,
        representations: json.main.map(
          (element): EmoteRepresentationADR74 => ({
            bodyShapes: [getBodyShapeByType(element.type)],
            mainFile: element.model,
            contents: extractTexturesFilesNames
          })
        ),
        loop: json.loop,
        tags: [...json.tags, 'base-emote']
      }
    }

    const collection = 'base-emotes'
    const name = json.name

    if (Emote.validate(metadata)) {
      if (args.deploy) {
        const deploymentData: DeploymentPreparationData = await DeploymentBuilder.buildEntity({
          type: EntityType.EMOTE,
          pointers: [metadata.id],
          files,
          metadata: { ...metadata }
        })

        const { entityId } = deploymentData

        const signature = ethSign(hexToBytes(privateKey), entityId)
        const authChain = Authenticator.createSimpleAuthChain(entityId, ethAddress, signature)

        await contentClient.deploy({
          authChain,
          entityId: deploymentData.entityId,
          files: deploymentData.files
        })
        logger.info(`Emote ${name} from base-avatars deployed`)
      }
    } else if (Emote.validate.errors) {
      errors.push({
        asset: `${collection}/${name}`,
        validationResult: Emote.validate.errors
      })
      console.log(
        `validation error (${collection}/${name}): ${JSON.stringify(
          Emote.validate.errors.map((result) => result!.message).join(' ')
        )}`
      )
    }
  }

  if (args.ci) {
    const previewUrl = `https://play.decentraland.org/?BUILDER_SERVER_URL=https://builder-api.decentraland.org&DEBUG_MODE=true&DISABLE_backpack_editor_v2=&ENABLE_backpack_editor_v1=&CATALYST=${target}&WITH_COLLECTIONS=urn:decentraland:off-chain:base-emotes`
    if (errors.length) {
      fs.writeFileSync('validation-errors.json', JSON.stringify(errors, null, 2))
    }
    fs.writeFileSync('output', `PREVIEW_URL=${previewUrl}`)
  } else {
    console.log(`to deploy: yarn emotes --deploy --target ${target} ${args.directories.join(' ')}`)
  }
}

main().catch(console.error)
