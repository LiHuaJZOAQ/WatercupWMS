import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-') && tag.startsWith('md-')
        }
      }
    }),
    vueJsx(),
    vueDevTools()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
    css: {
    preprocessorOptions: {
      scss: {
        // 可选：全局注入 SCSS 变量（避免在每个文件手动导入）
        additionalData: `@use "@/styles/variables.scss" as *;`,
      },
    },
  },
    server: {
    proxy: {
      // 代理所有以 /api 开头的请求
      '/api': {
        target: 'http://localhost:3000', // 你的后端地址
        changeOrigin: true,              // 允许跨域
        //rewrite: (path) => path.replace(/^\/api/, '') // 移除路径中的 /api
      }
    }
  }
})
