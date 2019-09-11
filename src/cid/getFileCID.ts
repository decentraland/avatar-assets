
const unix = require('ipfs-unixfs')
const { DAGNode } = require('ipld-dag-pb')
const promise = f => (...args) => new Promise((a,b)=>f(...args, (err, res) => err ? b(err) : a(res)));

const createDag = promise(DAGNode.create)

export const getFileDAG = buffer => createDag(
    new unix('file', buffer).marshal()
).then((dagNode: any) => dagNode.toJSON())

export const getFileCID = buffer => promise(DAGNode.create)(
    new unix('file', buffer).marshal()
).then((dagNode: any) => dagNode.toJSON().multihash)