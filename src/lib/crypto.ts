import * as crypto from 'crypto'

export const getSHA256 = (data: string) => {
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex')
}
