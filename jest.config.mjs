import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)'
  ],

  // Module paths
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },

  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/jest.config.mjs',
    '!**/jest.setup.ts',
    // Next.js App Router server components — these render on the server only
    // and cannot be executed in jsdom. They are covered by Playwright E2E tests.
    '!app/**/page.tsx',
    '!app/**/layout.tsx',
    '!app/**/not-found.tsx',
    '!app/api/**',
    // CMS integration layer — requires live Strapi server, covered by E2E/Docker build
    '!lib/cms/**',
    // Storybook story files — consumed by Storybook, not Jest
    '!**/*.stories.{js,jsx,ts,tsx}',
    // Storybook config — not application code
    '!.storybook/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/e2e/',
  ],

  // Transform configuration
  // next-auth v5 is ESM; exclude it from the ignore list so SWC can transform it.
  transformIgnorePatterns: [
    '/node_modules/(?!(next-auth|@auth)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
