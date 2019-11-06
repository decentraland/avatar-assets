import * as AWS from 'aws-sdk'
import * as mimeTypes from 'mime-types'
import { promisify } from 'util'

const ACCESS_KEY = process.env['AWS_ACCESS_KEY'] || ''
const ACCESS_SECRET = process.env['AWS_ACCESS_SECRET'] || ''
if (!ACCESS_KEY || !ACCESS_SECRET) {
  throw new Error('You need to add an AWS key and secret to the env. Vars: AWS_ACCESS_KEY and AWS_ACCESS_SECRET')
}

const BUCKET_NAME = process.env['AWS_BUCKET_NAME'] || ''
if (!BUCKET_NAME) {
  throw new Error('You need to add an AWS bucket name to the env. Var: AWS_BUCKET_NAME')
}

export const ACL = {
  private: 'private' as 'private',
  publicRead: 'public-read' as 'public-read',
  publicReadWrite: 'public-read-write' as 'public-read-write',
  authenticatedRead: 'authenticated-read' as 'authenticated-read',
  awsExecRead: 'aws-exec-read' as 'aws-exec-read',
  bucketOwnerRead: 'bucket-owner-read' as 'bucket-owner-read',
  bucketOwnerFullControl: 'bucket-owner-full-control' as 'bucket-owner-full-control'
}
export type ACLValues = typeof ACL[keyof typeof ACL]

export const s3 = new AWS.S3({
  accessKeyId: ACCESS_KEY,
  secretAccessKey: ACCESS_SECRET
})

export function uploadFile(
  key: string,
  data: Buffer,
  acl: ACLValues,
  options: Partial<AWS.S3.PutObjectRequest> = {}
): Promise<AWS.S3.ManagedUpload.SendData> {
  const ContentType = options.ContentType || mimeTypes.lookup(key) || ''

  const params = {
    ...options,
    Bucket: BUCKET_NAME,
    Key: key,
    Body: data,
    ACL: acl,
    ContentType
  }

  return promisify(s3.upload.bind(s3))(params)
}
