import path from 'path';
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'lib/main.ts'),
      name: 'Vicuna7B',
      fileName: (format) => `Vicuna7B.${format}.js`
    }
  },
  server: { https: true },
  plugins: [ mkcert() ]
});
