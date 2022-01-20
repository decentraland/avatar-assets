import { resolve } from 'path'
import { parseUrn } from '@dcl/urn-resolver';
import { ArgumentParser } from 'argparse';
import { ContentClient, DeploymentPreparationData } from 'dcl-catalyst-client';
import { EntityType, Pointer } from 'dcl-catalyst-commons';
import { Authenticator } from 'dcl-crypto';
import fs from 'fs';
import { I18N, Identity, V2Representation, V2Wearable, V3Wearable } from './types';
import { executeWithProgressBar, flatten, getContentFileMap, parseIdentityFile, sign } from './utils';

let totalDeployed: number = 0
const failedPointers: string[][] = []

export async function migrate(): Promise<void> {
  // Parse arguments
  const parser = new ArgumentParser({ add_help: true });
  parser.add_argument('--identityFilePath', { required: true, help: 'The path to the json file where the address and private key are, to use for deployment' });
  parser.add_argument('--target', { help: 'The address of the catalyst server where the wearables will be deployed' });
  parser.add_argument('--targetContent', { help: 'The address of the content server where the wearables will be deployed' });
  parser.add_argument('--id', { help: 'Specify the id of the wearable to migrate. Can be repeated multiple times. Supports wildcards (example --id "dcl://base-avatars/*")', action: 'append' })
   const args = parser.parse_args()
  if ((!args.target && !args.targetContent) || (args.target && args.targetContent)) {
    throw new Error('You must specify a target or target content, and only one of them')
  }

  // Prepare all I'll need
  const contentServerUrl = args.target ? `${args.target}/content` : args.targetContent
  const contentClient = new ContentClient({contentUrl: contentServerUrl })
  const identity: Identity = await parseIdentityFile(args.identityFilePath)

  // Get all wearables
  console.log(`Starting the migration. Get all wearables`)
  const allWearables: V2Wearable[] = getAllWearables().filter(w => !!w)
  let wearablesToDeploy: V2Wearable[]

  if (args.id) {
    wearablesToDeploy = allWearables.filter(({ id }) => matchesAnyId(id, args.id))
    console.log(`Will deploy only those that matched with provided ids. There are ${wearablesToDeploy.length} of them`)
  } else {
    wearablesToDeploy = allWearables
    console.log(`Fetched all ${wearablesToDeploy.length} wearables. Will start migration`)
  }

  // Transform v2 wearables into v3
  const v3Wearables: (DeploymentPreparationData & { pointers: string[]})[] = await executeWithProgressBar(`Download files and preparing entities`, wearablesToDeploy,
    wearable => toDeploymentPreparationData(wearable, contentClient))

  // Print wearables that will be deployed
  console.log(`Will be deploying ${v3Wearables.length} wearables, check log.txt`)
  fs.writeFileSync('log.txt', Buffer.from('Will be deploying these wearables:\n' + v3Wearables.map(w => w.pointers).join('\n')))

  // Deploy them
  await executeWithProgressBar(`Deploying new wearables`, v3Wearables, wearable => deploy(wearable, identity, contentClient))

  // Log Result
  console.log(`\n\nDeployed ${totalDeployed} wearables.`)
  console.log(`\n\nFailed to deploy ${failedPointers.length} wearables, check error.txt`)
  fs.writeFileSync('error.txt', Buffer.from('Failed to deploy the following wearables:\n' + failedPointers.map(p => p.join(',')).join('\n')))
}

async function deploy(entityToDeploy: DeploymentPreparationData & {pointers: string[]}, identity: Identity, contentClient: ContentClient) {

  const authChain = Authenticator.createSimpleAuthChain(entityToDeploy.entityId, identity.ethAddress, sign(entityToDeploy.entityId, identity))

  try {
    const deploymentTimestamp: number = await contentClient.deployEntity({ entityId: entityToDeploy.entityId, files: entityToDeploy.files, authChain: authChain })
    if (!!deploymentTimestamp && deploymentTimestamp != 0) {
      totalDeployed++
    } else {
      failedPointers.push(entityToDeploy.pointers)
    }
  } catch (error) {
    failedPointers.push(entityToDeploy.pointers)
  }
}

function matchesAnyId(id: string, idsMatchers: string[]) {
  return idsMatchers.some(matcher => {
    if (matcher.includes("*")) {
      return !!id.match(matcher.replace("\*", ".*"))
    } else {
      return id === matcher
    }
  })
}

async function toDeploymentPreparationData(wearable: V2Wearable, contentClient: ContentClient): Promise<DeploymentPreparationData & {pointers: string[]}> {
  // Prepare metadata and pointer
  const { metadata, pointers } = await migrateMetadata(wearable)

  // Read files
  const contentFileMap = getContentFileMap(wearable)
  const filesPromises = contentFileMap.map<Promise<[string, Buffer]>>(async ({ key, hash }) => [key, readWearableSync(hash)])
  const files = new Map(await Promise.all(filesPromises))

  // Build Entity
  const deploymentPreparationData: DeploymentPreparationData = await contentClient.buildEntity({
      type: EntityType.WEARABLE,
      pointers,
      files: files,
      metadata,
      timestamp: Date.now()
    })
  return {
    ...deploymentPreparationData,
    pointers: pointers
  }
}

function readWearableSync(hash: string): Buffer {
  return fs.readFileSync(resolve(__dirname, '..', '..', 'dist', hash))
}

/** We are migrating from the old wearables definition into a new one */
async function migrateMetadata(wearable: V2Wearable): Promise<{ metadata: V3Wearable, pointers: Pointer[] }> {
  const now = Date.now()
  const { type, baseUrl, thumbnail, image, id, representations, category, tags, replaces, hides, ...other } = wearable

  // Fix invalid metadata
  const legacyId = fixInvalidId(id)
  const i18n = fixI18N(legacyId, other.i18n)

  // Calculate new data from wearable
  const { urn, collectionAddress, collectionName } = await getInfoFromLegacyId(legacyId)
  const bodyShapesMap: Map<string, string> = await mapBodyShapesToUrn(representations);

  // Prepare new data property
  const data = {
    replaces,
    hides,
    tags,
    category,
    representations: representations.map((representation) => ({
      ...representation,
      bodyShapes: representation.bodyShapes.map(bodyShape => bodyShapesMap.get(bodyShape)!),
      contents: representation.contents.map(({ file }) => file)
    }))
  }

  // Build metadata
  const metadata: V3Wearable = {
    id: urn,
    description: other.description,
    image: image ? 'image.png' : undefined,
    thumbnail: thumbnail ? 'thumbnail.png' : undefined,
    collectionAddress,
    rarity: other.rarity,
    data,
    i18n,
    createdAt: now,
    updatedAt: now
  }

  // Build pointers
  const pointers = collectionAddress && collectionName ?
    [urn, urn.replace(collectionName, collectionAddress)] :
    [urn]

  return { metadata, pointers }
}

async function mapBodyShapesToUrn(representations: V2Representation[]): Promise<Map<string, string>> {
  const bodyShapes = flatten(representations.map(representation => representation.bodyShapes))
  const bodyShapesEntries = await Promise.all(bodyShapes.map<Promise<[string, string]>>(async (bodyShape) => [bodyShape, await mapLegacyIdToUrn(bodyShape)]));
  return new Map(bodyShapesEntries)
}

async function getInfoFromLegacyId(legacyId: string): Promise<{ urn: string, collectionAddress?: string, collectionName?: string }> {
  const asset = await parseUrn(legacyId)
  if (!asset) {
    throw new Error(`Failed to parse the following id '${legacyId}'`)
  }
  let collectionAddress: string | undefined
  let collectionName: string | undefined
  if (asset.type === 'blockchain-collection-v1') {
    collectionAddress = asset.contractAddress ?? undefined
    collectionName = asset.collectionName ?? undefined
  } else if (asset.type !== 'off-chain') {
    throw new Error(`Failed to parse the legacy id '${legacyId}'`)
  }
  return {
    urn: asset.uri.toString(),
    collectionAddress,
    collectionName
  }
}

/**
 * We are mapping the wearable previously called 'dcl://base-avatars/Moccasin' to 'dcl://base-avatars/SchoolShoes'
 * In this case, we are fixing the I18N
 */
function fixI18N(legacyId: string, i18n: I18N[]): I18N[] {
  if (legacyId === 'dcl://base-avatars/SchoolShoes') {
    return [
      {
        code: "en",
        text: "School Shoes"
      },
      {
        code: "es",
        text: "Zapatos Escolares"
      }
    ]
  }
  return i18n
}

async function mapLegacyIdToUrn(legacyId: string): Promise<string> {
  try {
    const fixedId = fixInvalidId(legacyId)
    const asset = await parseUrn(fixedId)
    if (asset?.type === 'off-chain' || asset?.type === 'blockchain-collection-v1') {
      return asset.uri.toString()
    }
  } catch { }
  throw new Error(`Failed to map legacy id '${legacyId}'`)
}

function fixInvalidId(legacyId: string): string {
  switch (legacyId) {
    case 'Basefemale':
      return 'dcl://base-avatars/BaseFemale'
    case 'dcl://base-avatars/Moccasin':
      return 'dcl://base-avatars/SchoolShoes'
    default:
      return legacyId
  }
}

function getAllWearables(): V2Wearable[] {
  return JSON.parse(fs.readFileSync(resolve(__dirname, '..', '..', 'dist', 'index.json')).toString())
}
