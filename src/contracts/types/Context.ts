import type { ProcessedLintData } from '../../processors/lintProcessor'

export type Context = {
  modifications: string
  todo?: string
  test?: string
  lint?: ProcessedLintData
}
