export const takeFirst = (arr: any[]) => (arr && arr.length > 0 ? arr[0] : null)
export const takeLast = (arr: any[]) =>
  arr && arr.length > 0 ? arr[arr.length - 1] : null
