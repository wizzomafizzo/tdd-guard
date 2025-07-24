import { Linter } from '../linters/Linter'
import { Config } from '../config/Config'
import { ESLint } from '../linters/eslint/ESLint'

export class LinterProvider {
  getLinter(config?: Config): Linter | null {
    const actualConfig = config ?? new Config()

    if (actualConfig.linterType === 'eslint') {
      return new ESLint()
    }

    return null
  }
}
