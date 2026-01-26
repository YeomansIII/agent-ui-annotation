import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';
import vue from '@vitejs/plugin-vue';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    vue(),
    svelte(),
    dts({
      include: ['src'],
      rollupTypes: false,
    }),
  ],
  resolve: {
    alias: {
      '@core': resolve(__dirname, 'src/core'),
      '@element': resolve(__dirname, 'src/element'),
      '@adapters': resolve(__dirname, 'src/adapters'),
      '@themes': resolve(__dirname, 'src/themes'),
    },
  },
  build: {
    lib: {
      entry: {
        'agent-ui-annotation': resolve(__dirname, 'src/index.ts'),
        'adapters/react/AgentUIAnnotation': resolve(__dirname, 'src/adapters/react/AgentUIAnnotation.tsx'),
        'adapters/vanilla/index': resolve(__dirname, 'src/adapters/vanilla/index.ts'),
        'adapters/vue/index': resolve(__dirname, 'src/adapters/vue/index.ts'),
        'adapters/svelte/index': resolve(__dirname, 'src/adapters/svelte/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'vue', /^svelte(\/.*)?$/],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          vue: 'Vue',
          svelte: 'Svelte',
        },
        // Preserve module structure for proper tree-shaking
        preserveModules: false,
      },
    },
    sourcemap: true,
    minify: 'esbuild',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
