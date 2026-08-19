import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

function copyStaticFolder(src, dest) {
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'pages/admin.html'),
        thanhvien: resolve(__dirname, 'pages/thanh-vien.html'),
        tintuc: resolve(__dirname, 'pages/tin-tuc.html'),
        gioithieu: resolve(__dirname, 'pages/gioi-thieu.html'),
        bandieuhanh: resolve(__dirname, 'pages/ban-dieu-hanh.html'),
        hoso: resolve(__dirname, 'pages/ho-so.html')
      }
    }
  },
  plugins: [
    {
      name: 'copy-components-and-assets',
      closeBundle() {
        copyStaticFolder(resolve(__dirname, 'components'), resolve(__dirname, 'dist/components'));
        copyStaticFolder(resolve(__dirname, 'assets'), resolve(__dirname, 'dist/assets'));
      }
    }
  ],
  server: {
    port: 3000
  }
});

