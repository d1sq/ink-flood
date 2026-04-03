import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import sveltePreprocess from 'svelte-preprocess';
import path from 'path';

const MODULE_ID = 'ink-flood';

export default defineConfig({
  root: 'src',
  base: `/modules/${MODULE_ID}/dist/`,
  publicDir: path.resolve(__dirname, 'public'),

  plugins: [
    svelte({
      preprocess: sveltePreprocess({ typescript: true }),
      compilerOptions: {
        cssHash: ({ hash, css }) => `trl-${hash(css)}`,
      },
    }),
  ],

  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
    lib: {
      entry: 'index.ts',
      formats: ['es'],
      fileName: MODULE_ID,
    },
    rollupOptions: {
      output: {
        assetFileNames: `${MODULE_ID}.[ext]`,
      },
    },
  },
});
