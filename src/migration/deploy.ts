import { resolve } from 'path'
import { parseUrn } from '@dcl/urn-resolver';
import { ArgumentParser } from 'argparse';
import { ContentClient, DeploymentPreparationData } from 'dcl-catalyst-client';
import { EntityType, Pointer } from 'dcl-catalyst-commons';
import fs from 'fs';
import { I18N, Identity, WearableMetadata } from './types';
import { executeWithProgressBar, flatten, generateAuthChain, getContentFileMap, parseIdentityFile } from './utils';
import { BodyShapeRespresentation, Wearable } from '../types';

let totalDeployed: number = 0
const failedPointers: string[][] = []

export async function deployWearables(allWearables: Wearable[]): Promise<void> {
  // Parse arguments
  const parser = new ArgumentParser({ add_help: true });
  parser.add_argument('--identityFilePath', { required: true, help: 'The path to the json file where the address and private key are, to use for deployment' });
  parser.add_argument('--target', { required: true, help: 'The address of the catalyst server where the wearables will be deployed' });
  parser.add_argument('--id', { required: true, help: 'Specify the id of the wearable to deploy. Can be repeated multiple times. Supports wildcards (example --id "dcl://base-avatars/*")', action: 'append' })
  const args = parser.parse_args()

  // Prepare all I'll need
  const contentServerUrl = args.target.includes('localhost') ? args.target : `${args.target}/content`
  const contentClient = new ContentClient({contentUrl: contentServerUrl })
  const identity: Identity = await parseIdentityFile(args.identityFilePath)

  // Filter the wearables to deploy
  console.log(`Starting the deployment`)
  const wearablesToDeploy = allWearables.filter(({ id }) => matchesAnyId(id, args.id))
  console.log(`Will deploy only those that matched with provided ids. There are ${wearablesToDeploy.length} of them`)

  // Transform wearables into the entities to deploy
  const entitiesToDeploy = await Promise.all(wearablesToDeploy.map(wearable => toDeploymentPreparationData(wearable, contentClient)))

  // Print wearables that will be deployed
  console.log(`Will be deploying ${entitiesToDeploy.length} wearables, check log.txt`)
  fs.writeFileSync('log.txt', Buffer.from('Will be deploying these wearables:\n' + entitiesToDeploy.map(w => w.pointers).join('\n')))

  // Deploy them
  await executeWithProgressBar(`Deploying new wearables`, entitiesToDeploy, entityToDeploy => deploy(entityToDeploy, identity, contentClient))

  // Log Result
  console.log(`\n\nDeployed ${totalDeployed} wearables.`)
  console.log(`\n\nFailed to deploy ${failedPointers.length} wearables, check error.txt`)
  fs.writeFileSync('error.txt', Buffer.from('Failed to deploy the following wearables:\n' + failedPointers.map(p => p.join(',')).join('\n')))
}

async function deploy(entityToDeploy: DeploymentPreparationData & {pointers: string[]}, identity: Identity, contentClient: ContentClient) {

  const authChain = generateAuthChain(entityToDeploy.entityId, identity)
  
  try {
    const deploymentTimestamp: number = await contentClient.deployEntity({ entityId: entityToDeploy.entityId, files: entityToDeploy.files, authChain })
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

async function toDeploymentPreparationData(wearable: Wearable, contentClient: ContentClient): Promise<DeploymentPreparationData & {pointers: string[]}> {
  // Prepare metadata and pointer
  const metadata = await buildMetadata(wearable)
  const pointers = await buildPointers(wearable.id)

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

/** Build the wearable metadata in the format the content server needs */
async function buildMetadata(wearable: Wearable): Promise<WearableMetadata> {
  const now = Date.now()
  const { type, baseUrl, thumbnail, image, id, representations, category, tags, replaces, hides, ...other } = wearable

  // Fix invalid metadata
  const legacyId = fixInvalidId(id)
  const i18n = fixI18N(legacyId, other.i18n)

  // Calculate new data from wearable
  const { urn, collectionAddress } = await getInfoFromLegacyId(legacyId)
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
  const metadata: WearableMetadata = {
    id: urn,
    name: other.name,
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

  return metadata
}

async function buildPointers(wearableId: string): Promise<Pointer[]> {
  // Fix invalid metadata
  const legacyId = fixInvalidId(wearableId)

  const { urn, collectionAddress, collectionName } = await getInfoFromLegacyId(legacyId)

  // Build pointers
  const pointers = collectionAddress && collectionName ?
    [urn, urn.replace(collectionName, collectionAddress)] :
    [urn]
  
  return pointers
}

async function mapBodyShapesToUrn(representations: BodyShapeRespresentation[]): Promise<Map<string, string>> {
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
