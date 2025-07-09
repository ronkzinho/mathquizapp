module.exports = {
  root: true,
  ignores: [
    '.DS_Store',
    'node_modules',
    '/build',
    '/.svelte-kit',
    '/package',
    '.env',
    '.env.*',
    '!.env.example',
    'pnpm-lock.yaml',
    'package-lock.json',
    'yarn.lock',
    // Optional: ignore dist output except App Lab if needed:
    // 'dist/*',
    // 'util/dist/*',
    '!util/dist/applab.js'
  ],
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  plugins: ['svelte3', '@typescript-eslint'],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3'
    },
    {
      files: ['util/dist/applab.js'],
      parser: '@babel/eslint-parser',
      parserOptions: {
        requireConfigFile: true,
        babelOptions: {
          configFile: './babel.config.json'
        },
        sourceType: 'module'
      },
      env: {
        browser: true,
        es5: true
      },
      rules: {
        // Add ES5-specific lint rules here if needed
      }
    }
  ],
  settings: {
    'svelte3/typescript': () => require('typescript')
  },
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  }
};
