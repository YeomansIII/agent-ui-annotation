import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'demo',
  base: '/agent-ui-annotation/',
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@element': resolve(__dirname, 'src/element'),
      '@adapters': resolve(__dirname, 'src/adapters'),
      '@themes': resolve(__dirname, 'src/themes'),
    },
  },
  build: {
    outDir: '../dist-demo',
    emptyOutDir: true,
  },
});
