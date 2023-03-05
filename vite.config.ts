import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath, URL } from 'node:url';
import { ViteAliases } from 'vite-aliases';

export default defineConfig({
  plugins: [
    sveltekit(),
    ViteAliases({
      dir: 'src',

      prefix: '@',

      deep: true,

      depth: 1,

      createLog: false,

      logPath: 'src/logs',

      createGlobalAlias: true,

      adjustDuplicates: false,

      useAbsolute: false,

      useIndexes: false,

      useConfig: false,

      useTypescript: true,

      root: process.cwd()
    })
  ]
});
