# Avatar Assets

Please refer to https://playbooks.decentraland.systems/platform-team/avatar-assets.html for instructions

## Frequent Failures

This section describes the most common mistakes made while updating an asset's metadata (`asset.json` file). If a validation error is raised when creating a Pull Request, please ensure it may be related to one of the issues listed below:

### Category

The `category` property must contain one of the following values:

- body_shape
- earring
- eyebrows
- eyes
- eyewear
- facial_hair
- feet
- hair
- hands_wear
- hat
- helmet
- lower_body
- mask
- mouth
- skin
- tiara
- top_head
- upper_body

## Deployment rate limit

Catalyst deployments are serialized and wait 13 seconds between entity submissions by default, keeping the rate below five entities per minute. HTTP 429 responses are retried after one minute, up to two times.

The interval can be overridden for controlled testing with `DCL_DEPLOYMENT_INTERVAL_MS`. Production CI should keep the default value.
