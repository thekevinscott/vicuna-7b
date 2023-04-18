import { resolve } from 'path';
import { defineConfig } from 'vite'

export default defineConfig({
  base: 'vicuna-7b',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
