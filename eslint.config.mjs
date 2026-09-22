import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import security from 'eslint-plugin-security'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      security,
    },
    rules: {
      'security/detect-object-injection': 'off',
      'security/detect-eval-with-expression': 'error',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Project-specific ignores:
    'node_modules/**',
    'coverage/**',
    'storybook-static/**',
    'playwright-report/**',
    'test-results/**',
    'backend/**',
    'cms/**',
  ]),
])

export default eslintConfig
