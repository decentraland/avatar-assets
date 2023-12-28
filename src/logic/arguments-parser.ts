import { ArgumentParser } from 'argparse'
import { Arguments, Identity } from '../types'
import fs from 'fs'

/**
 * Load the identity from the json file
 *
 * @export
 * @param {string} identityFilePath
 * @return {*}  {Promise<Identity>}
 */
export async function loadIdentity(identityFilePath: string): Promise<Identity> {
  const buffer = await fs.promises.readFile(identityFilePath)
  return JSON.parse(buffer.toString())
}

/**
 * Parse and validate the arguments received from the command line
 *
 * @export
 * @return {*}  {Arguments}
 */
export function getArguments(): Arguments {
  const parser = new ArgumentParser({ add_help: true })
  parser.add_argument('--identityFilePath', {
    required: false,
    help: 'The path to the json file where the address and private key are, to use for deployment'
  })
  parser.add_argument('--privateKey', {
    required: false,
    help: 'The private key to use for deployment'
  })
  parser.add_argument('--publicKey', {
    required: false,
    help: 'The public key to use for deployment'
  })
  parser.add_argument('--target', {
    required: true,
    help: 'The address of the catalyst server where the wearables will be deployed'
  })
  parser.add_argument('--id', {
    required: true,
    help: 'Specify the id of the wearable to deploy. Can be repeated multiple times. Supports wildcards (example --id "dcl://base-avatars/*")',
    action: 'append'
  })

  const args = parser.parse_args()

  if (!(args.identityFilePath ? !args.privateKey && !args.publicKey : args.privateKey && args.publicKey)) {
    throw new Error('Either identityFilePath or both privateKey and publicKey must be specified, but not a mix.')
  }

  if (args.identityFilePath && !fs.existsSync(args.identityFilePath)) {
    throw new Error('Identity file does not exist')
  }

  if (args.id.length === 0) {
    throw new Error('At least one id must be specified')
  }

  return {
    target: args.target.includes('localhost') ? args.target : `${args.target}/content`,
    identityFilePath: args.identityFilePath,
    publicKey: args.publicKey,
    privateKey: args.privateKey,
    id: args.id
  }
}
