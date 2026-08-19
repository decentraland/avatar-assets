const DEFAULT_DEPLOYMENT_INTERVAL_MS = 13_000
const RATE_LIMIT_RETRY_DELAY_MS = 60_000
const MAX_RATE_LIMIT_RETRIES = 2

let lastDeploymentAt = 0

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function getDeploymentIntervalMs(): number {
  const configuredInterval = Number(process.env.DCL_DEPLOYMENT_INTERVAL_MS)

  return Number.isFinite(configuredInterval) && configuredInterval >= 0
    ? configuredInterval
    : DEFAULT_DEPLOYMENT_INTERVAL_MS
}

function isRateLimitError(error: unknown): boolean {
  return /(?:status|status code)[^\d]*429\b|\b429\b/i.test(String(error))
}

/**
 * Limit entity submissions to a safe rate and retry transient Catalyst 429s.
 * The default interval sends fewer than five entities per rolling minute.
 */
export async function deployWithRateLimit<T>(deployment: () => Promise<T>): Promise<T> {
  let rateLimitRetries = 0

  while (true) {
    const intervalMs = getDeploymentIntervalMs()
    const waitMs = Math.max(0, intervalMs - (Date.now() - lastDeploymentAt))

    if (waitMs > 0) {
      console.info(`Catalyst rate limit: waiting ${Math.ceil(waitMs / 1000)}s before the next entity`)
      await sleep(waitMs)
    }

    lastDeploymentAt = Date.now()

    try {
      return await deployment()
    } catch (error) {
      if (!isRateLimitError(error) || rateLimitRetries >= MAX_RATE_LIMIT_RETRIES) {
        throw error
      }

      rateLimitRetries += 1
      console.warn(
        `Catalyst returned HTTP 429. Waiting ${RATE_LIMIT_RETRY_DELAY_MS / 1000}s before retry ${rateLimitRetries}/${MAX_RATE_LIMIT_RETRIES}`
      )
      await sleep(RATE_LIMIT_RETRY_DELAY_MS)
    }
  }
}
