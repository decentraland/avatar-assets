import * as AWS from 'aws-sdk'

export const getS3 = () => new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_ACCESS_SECRET
})

export const s3CheckFile = (bucketName: string, key: string): Promise<boolean> => {
  const params = {
    Bucket: bucketName,
    Key: key
  }
  return new Promise((resolve, reject) => {
    getS3().headObject(params, function (err, data) {
      (err) ? resolve(false) : resolve(true)
    })
  })
}

export const s3UploadFile = (bucketName: string, key: string, data: Buffer) => {
  const params = {
    Bucket: bucketName,
    Key: key,
    Body: data,
    ACL: 'public-read'
  }
  return new Promise((resolve, reject) => {
    getS3().upload(params, function(err, data) {
      (err) ? reject(err) : resolve(data)
    })
  })
}
