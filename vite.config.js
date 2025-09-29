import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => ({
  root: '.',
  build: {
    base: './',
    outDir: 'dist-renderer',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
  define: {
    __THEME__: JSON.stringify(mode === 'punky' ? 'punky' : 'default'),
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "${resolve(__dirname, `src/renderer/themes/${mode === 'punky' ? 'punky' : 'default'}.scss`)}";`
      }
    }
  }
}));