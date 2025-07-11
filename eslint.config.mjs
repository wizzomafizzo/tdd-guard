import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.es2020,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      'no-extra-semi': 'off', // Let Prettier handle semicolons
      semi: 'off', // Let Prettier handle semicolons
    },
  },
  {
    ignores: ['dist/**', 'coverage/**', 'node_modules/**', 'hooks/**'],
  },
]
