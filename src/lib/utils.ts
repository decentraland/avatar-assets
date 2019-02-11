export const takeFirst = (arr: Array<any>) => (arr && arr.length > 0 ? arr[0] : null)
export const takeLast = (arr: Array<any>) =>
  arr && arr.length > 0 ? arr[arr.length - 1] : null
