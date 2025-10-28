import { defineConfig } from 'vite';

export default defineConfig({
  esbuild: {
    jsxFactory: 'createElement',
    jsxFragment: 'createFragment'
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  server: {
    port: 5173,
    open: true
  }
});
