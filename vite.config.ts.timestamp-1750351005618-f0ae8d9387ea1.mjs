// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "file:///C:/Users/GL021/Desktop/WMS/node_modules/vite/dist/node/index.js";
import vue from "file:///C:/Users/GL021/Desktop/WMS/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///C:/Users/GL021/Desktop/WMS/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import vueDevTools from "file:///C:/Users/GL021/Desktop/WMS/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
import AutoImport from "file:///C:/Users/GL021/Desktop/WMS/node_modules/unplugin-auto-import/dist/vite.js";
import Components from "file:///C:/Users/GL021/Desktop/WMS/node_modules/unplugin-vue-components/dist/vite.js";
import { ElementPlusResolver } from "file:///C:/Users/GL021/Desktop/WMS/node_modules/unplugin-vue-components/dist/resolvers.js";
var __vite_injected_original_import_meta_url = "file:///C:/Users/GL021/Desktop/WMS/vite.config.ts";
var vite_config_default = defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    AutoImport({
      resolvers: [ElementPlusResolver()]
    }),
    Components({
      resolvers: [ElementPlusResolver()]
    })
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // 可选：全局注入 SCSS 变量（避免在每个文件手动导入）
        additionalData: `@use "@/styles/variables.scss" as *;`
      }
    }
  },
  server: {
    proxy: {
      // 代理所有以 /api 开头的请求
      "/api": {
        target: "http://localhost:3000",
        // 你的后端地址
        changeOrigin: true
        // 允许跨域
        //rewrite: (path) => path.replace(/^\/api/, '') // 移除路径中的 /api
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxHTDAyMVxcXFxEZXNrdG9wXFxcXFdNU1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcR0wwMjFcXFxcRGVza3RvcFxcXFxXTVNcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL0dMMDIxL0Rlc2t0b3AvV01TL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZmlsZVVSTFRvUGF0aCwgVVJMIH0gZnJvbSAnbm9kZTp1cmwnXG5cbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcbmltcG9ydCB2dWVKc3ggZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlLWpzeCdcbmltcG9ydCB2dWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnXG5cbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXG5pbXBvcnQgQ29tcG9uZW50cyBmcm9tICd1bnBsdWdpbi12dWUtY29tcG9uZW50cy92aXRlJ1xuaW1wb3J0IHsgRWxlbWVudFBsdXNSZXNvbHZlciB9IGZyb20gJ3VucGx1Z2luLXZ1ZS1jb21wb25lbnRzL3Jlc29sdmVycydcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgdnVlSnN4KCksXG4gICAgdnVlRGV2VG9vbHMoKSxcbiAgICBBdXRvSW1wb3J0KHtcbiAgICAgIHJlc29sdmVyczogW0VsZW1lbnRQbHVzUmVzb2x2ZXIoKV0sXG4gICAgfSksXG4gICAgQ29tcG9uZW50cyh7XG4gICAgICByZXNvbHZlcnM6IFtFbGVtZW50UGx1c1Jlc29sdmVyKCldLFxuICAgIH0pXG4gIF0sXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgJ0AnOiBmaWxlVVJMVG9QYXRoKG5ldyBVUkwoJy4vc3JjJywgaW1wb3J0Lm1ldGEudXJsKSlcbiAgICB9LFxuICB9LFxuICAgIGNzczoge1xuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcbiAgICAgIHNjc3M6IHtcbiAgICAgICAgLy8gXHU1M0VGXHU5MDA5XHVGRjFBXHU1MTY4XHU1QzQwXHU2Q0U4XHU1MTY1IFNDU1MgXHU1M0Q4XHU5MUNGXHVGRjA4XHU5MDdGXHU1MTREXHU1NzI4XHU2QkNGXHU0RTJBXHU2NTg3XHU0RUY2XHU2MjRCXHU1MkE4XHU1QkZDXHU1MTY1XHVGRjA5XG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiBgQHVzZSBcIkAvc3R5bGVzL3ZhcmlhYmxlcy5zY3NzXCIgYXMgKjtgLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICAgIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAvLyBcdTRFRTNcdTc0MDZcdTYyNDBcdTY3MDlcdTRFRTUgL2FwaSBcdTVGMDBcdTU5MzRcdTc2ODRcdThCRjdcdTZDNDJcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDAnLCAvLyBcdTRGNjBcdTc2ODRcdTU0MEVcdTdBRUZcdTU3MzBcdTU3NDBcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLCAgICAgICAgICAgICAgLy8gXHU1MTQxXHU4QkI4XHU4REU4XHU1N0RGXG4gICAgICAgIC8vcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sICcnKSAvLyBcdTc5RkJcdTk2NjRcdThERUZcdTVGODRcdTRFMkRcdTc2ODQgL2FwaVxuICAgICAgfVxuICAgIH1cbiAgfVxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFEsU0FBUyxlQUFlLFdBQVc7QUFFN1MsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxTQUFTO0FBQ2hCLE9BQU8sWUFBWTtBQUNuQixPQUFPLGlCQUFpQjtBQUV4QixPQUFPLGdCQUFnQjtBQUN2QixPQUFPLGdCQUFnQjtBQUN2QixTQUFTLDJCQUEyQjtBQVRpSSxJQUFNLDJDQUEyQztBQVl0TixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixPQUFPO0FBQUEsSUFDUCxZQUFZO0FBQUEsSUFDWixXQUFXO0FBQUEsTUFDVCxXQUFXLENBQUMsb0JBQW9CLENBQUM7QUFBQSxJQUNuQyxDQUFDO0FBQUEsSUFDRCxXQUFXO0FBQUEsTUFDVCxXQUFXLENBQUMsb0JBQW9CLENBQUM7QUFBQSxJQUNuQyxDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxjQUFjLElBQUksSUFBSSxTQUFTLHdDQUFlLENBQUM7QUFBQSxJQUN0RDtBQUFBLEVBQ0Y7QUFBQSxFQUNFLEtBQUs7QUFBQSxJQUNMLHFCQUFxQjtBQUFBLE1BQ25CLE1BQU07QUFBQTtBQUFBLFFBRUosZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0UsUUFBUTtBQUFBLElBQ1IsT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUE7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBO0FBQUEsTUFFaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
