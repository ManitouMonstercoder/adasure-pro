const esbuild = require('esbuild');
const fs = require('fs');
const minify = require('html-minifier').minify;

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));

async function build() {
  const isWatch = process.argv.includes('--watch');
  const isMinify = process.argv.includes('--minify');

  const ctx = await esbuild.context({
    entryPoints: ['./src/entry.ts'],
    bundle: true,
    outfile: 'dist/adasure-pro.min.js',
    format: 'iife',
    minify: isMinify,
    alias: {
      '@': './src',
    },
    loader: {
      '.html': 'text',
      '.svg': 'text'
    },
    plugins: [
      {
        name: "CSSMinifyPlugin",
        setup(build) {
            build.onLoad({ filter: /\.css$/ }, async (args) => {
              const file = fs.readFileSync(args.path, 'utf8');
              const css = await esbuild.transform(file, { loader: "css", minify: true })
              return { loader: "text", contents: css.code }
            })
        }
      },
      {
        name: "HTMLMinifyPlugin",
        setup(build) {
          build.onLoad({ filter: /\.(html|svg)$/ }, async (args) => {
            const file = fs.readFileSync(args.path, 'utf8');
            var html = minify(file, {
              removeComments: true,
              removeEmptyAttributes: true,
              collapseWhitespace: true
            }).trim();

            return { loader: "text", contents: html }
          })
        }
      }
    ],
    banner: {
      js: `/*!
      * AdaSure Pro - Premium ADA Compliance Widget v${packageJson.version}
      * (c) ${new Date().getFullYear()} ${packageJson.author}
      * Commercial License - Not for redistribution
      * Home Page: ${packageJson.homepage}
      *
      * This software is proprietary and confidential.
      * Unauthorized copying, modification, or distribution is strictly prohibited.
      */`,
    },
  });

  if (isWatch) {
    await ctx.watch();
    console.log('⚡ Watching for changes...');
  } else {
    await ctx.rebuild();
    console.log('✅ Build complete!');
    await ctx.dispose();
  }
}

build().catch(() => process.exit(1));
