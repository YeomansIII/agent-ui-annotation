import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { resolve } from 'path';

export default defineConfig({
  plugins: [svelte()],
  server: {
    fs: {
      allow: [
        // Allow serving files from the parent package
        resolve(__dirname, '../..'),
      ],
    },
  },
});
