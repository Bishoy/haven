'use strict';

const fs = require('fs/promises');
const path = require('path');
const { rollup } = require('rollup');
const { babel } = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const terser = require('@rollup/plugin-terser');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const EXCLUDED_TOP_LEVEL = new Set([
  'docs',
  '.github',
  '.git',
  'dist',
  'node_modules',
  'scripts',
]);

const EXCLUDED_FILE_NAMES = new Set([
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini',
  'yarn.lock',
]);

function removeConsoleLogPlugin() {
  return {
    name: 'remove-console-log',
    visitor: {
      ExpressionStatement(pathRef) {
        const expression = pathRef.node.expression;
        if (!expression || expression.type !== 'CallExpression') {
          return;
        }

        const callee = expression.callee;
        if (!callee || callee.type !== 'MemberExpression' || callee.computed) {
          return;
        }

        if (
          !callee.object ||
          callee.object.type !== 'Identifier' ||
          callee.object.name !== 'console'
        ) {
          return;
        }

        if (
          !callee.property ||
          callee.property.type !== 'Identifier' ||
          callee.property.name !== 'log'
        ) {
          return;
        }

        pathRef.remove();
      },
    },
  };
}

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function removeDir(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

async function copyRepoContents(sourceDir, targetDir) {
  await ensureDir(targetDir);

  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (
      entry.name.charAt(0) === '.' ||
      EXCLUDED_TOP_LEVEL.has(entry.name) ||
      EXCLUDED_FILE_NAMES.has(entry.name)
    ) {
      continue;
    }

    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyRepoContents(sourcePath, targetPath);
      continue;
    }

    if (entry.isFile()) {
      await ensureDir(path.dirname(targetPath));
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function createBabelPlugin(extraPlugins) {
  return babel({
    babelHelpers: 'bundled',
    exclude: /node_modules/,
    extensions: ['.js'],
    presets: [
      [
        '@babel/preset-env',
        {
          bugfixes: true,
          corejs: 3,
          useBuiltIns: 'usage',
        },
      ],
    ],
    plugins: extraPlugins || [],
  });
}

async function writeBundle(options) {
  const bundle = await rollup({
    input: options.input,
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      createBabelPlugin(options.babelPlugins),
      terser({
        compress: options.compress,
        ecma: 5,
        format: {
          comments: false,
        },
        mangle: true,
      }),
    ],
  });

  await bundle.write({
    file: options.output,
    format: 'iife',
    name: options.name,
    strict: true,
  });

  await bundle.close();
}

async function buildRuntimeBundle() {
  await writeBundle({
    input: path.join(rootDir, 'app.js'),
    output: path.join(distDir, 'app.js'),
    name: 'HavenRuntimeBundle',
    babelPlugins: [removeConsoleLogPlugin],
    compress: {
      passes: 2,
    },
  });
}

async function buildDesignerBundle() {
  await writeBundle({
    input: path.join(rootDir, 'designer', 'app.js'),
    output: path.join(distDir, 'designer.js'),
    name: 'HavenDesignerBundle',
    babelPlugins: [],
    compress: {
      passes: 2,
    },
  });
}

async function rewriteDesignerHtml() {
  const htmlPath = path.join(distDir, 'designer.html');
  const html = await fs.readFile(htmlPath, 'utf8');
  const rewritten = html.replace(
    /<script type="module" src="designer\/app\.js"><\/script>/,
    '<script src="designer.js"></script>',
  );

  if (rewritten === html) {
    throw new Error('Could not rewrite designer.html script reference');
  }

  await fs.writeFile(htmlPath, rewritten, 'utf8');
}

async function main() {
  await removeDir(distDir);
  await copyRepoContents(rootDir, distDir);
  await buildRuntimeBundle();
  await buildDesignerBundle();
  await rewriteDesignerHtml();
}

main().catch(function (error) {
  console.error(error);
  process.exitCode = 1;
});
