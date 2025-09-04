import type { TestState, TestRunEndReason } from 'vitest/node'
import type { SerializedError } from '@vitest/utils'

export type FormattedError = {
  message: string | undefined
  stack?: string
  expected?: unknown
  actual?: unknown
}

export type FormattedTest = {
  name: string
  fullName: string
  state: TestState
  errors?: FormattedError[]
}

export type ModuleResult = {
  moduleId: string
  tests: FormattedTest[]
}

export type TestRunOutput = {
  testModules: ModuleResult[]
  unhandledErrors: never[]
  reason?: TestRunEndReason
}

export type { SerializedError }
