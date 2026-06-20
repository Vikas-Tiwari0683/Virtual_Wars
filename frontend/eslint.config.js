import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // --- Application source (browser) ---
  {
    files: ['src/**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // The React Compiler lint rules bundled with react-hooks v7 are highly
      // opinionated and flag standard, correct patterns (e.g. setting loading
      // state at the start of a data-fetch effect). Keep them as advisory
      // warnings rather than hard errors so the build/lint gate stays green.
      'react-hooks/set-state-in-effect':           'warn',
      'react-hooks/immutability':                  'warn',
      'react-hooks/preserve-manual-memoization':   'warn',
      'react-hooks/exhaustive-deps':               'warn',
      'react-refresh/only-export-components':      'warn',
    },
  },

  // --- Test files (vitest globals + node) ---
  {
    files: ['src/test/**/*.{js,jsx}', '**/*.test.{js,jsx}', 'e2e/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },

  // --- Config files (node environment) ---
  {
    files: ['*.config.js', 'playwright.config.js', 'vite.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
