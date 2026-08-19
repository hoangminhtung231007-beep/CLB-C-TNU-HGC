import { defineConfig } from 'vite';
import { resolve } from 'path';

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
  server: {
    port: 3000
  }
});
