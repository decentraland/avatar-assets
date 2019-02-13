export const takeFirst = (arr: any[]) => (arr && arr.length > 0 ? arr[0] : null)
export const takeLast = (arr: any[]) =>
  arr && arr.length > 0 ? arr[arr.length - 1] : null

export function asSafeAction(callback: any, log: any) {
  return async function(...args: any[]) {
    return callback(...args)
      .catch((error: Error) => log.error(error.message))
      .finally(process.exit)
  }
}
