import path from 'path';
import { defineConfig } from 'vite'
import mkcert from 'vite-plugin-mkcert';
import dts from "vite-plugin-dts";


export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'packages/vicuna-7b/vicuna7b.ts'),
      name: 'Vicuna7B',
      fileName: (format) => `Vicuna7B.${format}.js`
    }
  },
  server: { https: true },
  plugins: [
    mkcert(),
    dts({
      insertTypesEntry: true,
    }),
  ]
});
