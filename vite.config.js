const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const { resolve } = require('path');

module.exports = defineConfig(({ mode }) => {
  const theme = mode === 'punky' ? 'punky' : 'default';
  
  return {
    plugins: [react()],
    root: '.',
    build: {
      base: './',
      outDir: 'dist-renderer',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        }
      }
    },
    server: {
      port: 3000,
    },
    define: {
      __THEME__: JSON.stringify(theme),
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "${resolve(__dirname, `src/renderer/themes/${theme}.scss`)}";`
        }
      }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    }
  };
});