import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
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

      useConfig: false
    }),
    ViteAliases({
      dir: 'lib',

      prefix: '@lib',

      deep: true,

      depth: 1,

      createLog: false,

      logPath: 'lib/logs',

      createGlobalAlias: true,

      adjustDuplicates: false,

      useAbsolute: false,

      useIndexes: false,

      useConfig: false
    })
  ]
});
