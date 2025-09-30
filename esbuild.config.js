const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

// Plugin to handle CSS imports
const cssPlugin = {
  name: 'css',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const css = await fs.promises.readFile(args.path, 'utf8');
      return {
        contents: `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(css)};
          document.head.appendChild(style);
        `,
        loader: 'js',
      };
    });
  },
};

// Plugin to handle SCSS imports
const scssPlugin = {
  name: 'scss',
  setup(build) {
    build.onLoad({ filter: /\.scss$/ }, async (args) => {
      const sass = require('sass');
      const result = sass.compile(args.path);
      return {
        contents: `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(result.css)};
          document.head.appendChild(style);
        `,
        loader: 'js',
      };
    });
  },
};

// Development server
const serve = async () => {
  const ctx = await esbuild.context({
    entryPoints: ['src/renderer/main.js'],
    bundle: true,
    outdir: 'dist-renderer',
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
    },
    define: {
      __THEME__: JSON.stringify(process.env.THEME || 'default'),
    },
    plugins: [cssPlugin, scssPlugin],
    jsx: 'automatic',
    jsxImportSource: 'react',
  });

  const { host, port } = await ctx.serve({
    servedir: '.',
    port: 3000,
  });

  console.log(`Server running at http://${host}:${port}`);
};

// Production build
const build = async () => {
  await esbuild.build({
    entryPoints: ['src/renderer/main.js'],
    bundle: true,
    outdir: 'dist-renderer',
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    loader: {
      '.js': 'jsx',
      '.jsx': 'jsx',
    },
    define: {
      __THEME__: JSON.stringify(process.env.THEME || 'default'),
    },
    plugins: [cssPlugin, scssPlugin],
    jsx: 'automatic',
    jsxImportSource: 'react',
  });

  // Copy index.html to dist-renderer
  await fs.promises.copyFile('index.html', 'dist-renderer/index.html');
  console.log('Build completed successfully');
};

module.exports = { serve, build };