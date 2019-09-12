# Decentraland Avatar Assets

This repository contains the supporting assets for avatars in the Decentraland world.

## Getting Started

First, install and run the tests to verify that your system is ready to work with assets:

```
yarn install
make compile
make test && make catalog
```

## Pipeline

`make catalog` generates a new version of all the asset packs under the `assets` folder. All the files are stored in the `dist` folder, separated by asset pack.
