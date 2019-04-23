import * as AWS from 'aws-sdk'
import { env, utils } from 'decentraland-commons'
import { future, IFuture } from 'fp-future'

const accessKeyId = env.get('AWS_ACCESS_KEY', '')
const secretAccessKey = env.get('AWS_ACCESS_SECRET', '')

if (!accessKeyId || !secretAccessKey) {
  throw new Error(
    'You need to add an AWS key and secret to your env file. Check the .env.example file'
  )
}

export const s3 = new AWS.S3({ accessKeyId, secretAccessKey })

export const checkFile = async (
  bucketName: string,
  key: string
): Promise<boolean> => {
  const params = {
    Bucket: bucketName,
    Key: key
  }
  const ret: IFuture<boolean> = future<boolean>()
  s3.headObject(params, (_, data) => {
    return ret.resolve(!!data)
  })
  return ret
}

export const uploadFile = (
  bucketName: string,
  key: string,
  data: Buffer
): Promise<AWS.S3.ManagedUpload> => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ACL: 'public-read'
  }
  return utils.promisify<AWS.S3.ManagedUpload>(s3.upload.bind(s3))(params)
}
