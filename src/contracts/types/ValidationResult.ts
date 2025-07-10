export type ValidationResult = {
  decision: 'approve' | 'block' | undefined
  reason: string
}
