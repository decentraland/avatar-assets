import { Wearable } from '@dcl/schemas'

export function validate(metadata: any): any[] {
  const result = Wearable.validate(metadata)

  if (!result) {
    return Wearable.validate.errors as any[]
  }

  return []
}
