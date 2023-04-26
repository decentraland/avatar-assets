# Decentraland Avatar Assets

This repository contains the supporting assets for avatars in the Decentraland world.

## Getting Started

- Install Node dependencies

```
npm install
```

- Create a file containing a keypair of the Ethereum address and private key to deploy to the content server.

```
{
    "ethAddress": "...",
    "privateKey": "..."
}
```

## Prepare Deployment to Content Server

> ℹ️ This script generates a deployment command for base wearables that have been updated in a specific commit.

> **Pending:** Extend support for deploying any updated wearable (not limited to base-wearables) across multiple commits.

### How to Use

Run `npm run prepare-deploy <COMMIT_HASH>` to generate the command needed to deploy the base wearables updated in that specific commit.

The generated deploy command will contain all the wearables to be deployed:


`npm run deploy -- --identityFilePath <identity-file> --target <node-to-deploy> --id <first-wearable-to-deploy> --id <N-wearable-to-deploy>`

- `--identityFilePath`: Replace with the file path of the identity key (e.g: ~/keys/address).
- `--target`: Replace with the target node where the wearables will be deployed (e.g: https://peer-testing-2.decentraland.org).

### Examples

#### Deploy Base Wearables Updated in a Specific Commit

```
npm run prepare-deploy 679911429fb0415fb77dfdbc91d011c187444faa
```

This command will generate: `npm run deploy -- --identityFilePath <identity-file> --target <node-to-deploy> --id dcl://base-avatars/relaxed_hair`, as the commit only updated the `relaxed_hair` wearable.

**Please note that the parameters should not be enclosed within double quotes (").**

## Deploy to Content Server

> ℹ️ This script will generate a new entity every time the script is run

> ⚠️ If you are deploying new base wearables please be sure that its urn is in https://github.com/decentraland/catalyst/blob/master/lambdas/src/apis/collections/off-chain/base-avatars.ts

### How to Use

`npm run deploy` generates the new assets and deploys them to the specified content server.

It needs the following arguments to be passed:

- `--identityFilePath`: file path to the key/address pair to sign the messages for the content server validation.
- `--target`: the target URL of the content server where the assets will be deployed.
- `--id`: id of the assets to be deployed. It allows wildcards to specify multiple assets. Examples: `*` or `dcl://base-avatars/*`.

### Examples

#### Deploy a Specific Asset to a Content Server

```
npm run deploy -- --identityFilePath "/path/to/admin/key/file" --target "https://peer.decentraland.zone" --id "dcl://base-avatars/BaseMale"
```

#### Deploy Multiple Assets to a Content Server

```
npm run deploy -- --identityFilePath "/path/to/admin/key/file" --target "https://peer.decentraland.zone" --id "dcl://base-avatars/BaseFemale" --id "dcl://base-avatars/BaseMale"
```

#### Deploy all Base Avatars to a Content Server

```
npm run deploy -- --identityFilePath "/path/to/admin/key/file" --target "https://peer.decentraland.zone" --id "dcl://base-avatars/*"
```

#### Deploy all Files to a Local Server

ℹ️ A running local server is necessary to test this.

```
npm run deploy -- --identityFilePath "/path/to/admin/key/file" --target "http://localhost:6969" --id "*"
```
