import { defineConfig } from 'tsup';
import { Plugin } from 'esbuild';
import path from 'path';

const shaderExtensionPlugin: Plugin = {
  name: 'shader-extension-resolver',
  setup(build) {
    build.onResolve({ filter: /\.vs$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\.vs$/, '.vs.ts')),
    }));
    build.onResolve({ filter: /\.fs$/ }, args => ({
      path: path.resolve(args.resolveDir, args.path.replace(/\.fs$/, '.fs.ts')),
    }));
  },
};

export default defineConfig({
  external: [
    'path',
    'fs',
    'child_process',
    'crypto',
    'url',
    'module'
  ],
  entry: ['src/index.ts'],
  platform: 'browser',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  esbuildPlugins: [shaderExtensionPlugin],
  loader: {
    ".ts":"ts"
  }
});