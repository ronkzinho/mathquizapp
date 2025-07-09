import babelParser from '@babel/eslint-parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintPluginSvelte from 'eslint-plugin-svelte3';

export default [
  // === Flat Config uses an array of config objects ===

  {
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
      'yarn.lock'
      // Add dist ignores if needed:
      // 'util/dist/*',
      // '!util/dist/applab.js'
    ]
  },

  // === Base config for your normal TS + Svelte files ===
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        module: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules
    }
  },

  // === Svelte override ===
  {
    files: ['**/*.svelte'],
    plugins: {
      svelte3: eslintPluginSvelte
    },
    processor: 'svelte3/svelte3',
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
        ecmaVersion: 2020
      }
    },
    settings: {
      'svelte3/typescript': () => import('typescript')
    }
  },

  // === Special override for util/dist/applab.js ===
  {
    files: ['util/dist/applab.js'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: true,
        babelOptions: {
          configFile: './babel.config.json'
        },
        sourceType: 'module'
      },
      ecmaVersion: 5,
      globals: {
        window: 'readonly',
        document: 'readonly'
      }
    },
    rules: {
      // Example ES5 safety: disallow arrow functions etc.
      // Add rules here if you want to block modern syntax.
    }
  }
];
