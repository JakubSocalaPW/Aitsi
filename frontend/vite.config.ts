import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'
import basicSsl from '@vitejs/plugin-basic-ssl'


const vendorChunks: Record<string, string[]> = {
  'vendor-vue': ['vue', 'vue-router', 'pinia'],
  'vendor-map': ['leaflet'],
  'vendor-ui': ['primevue']
}

export default defineConfig({
  plugins: [vue(), basicSsl()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    modules: {
      localsConvention: 'camelCase'
    }
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          for (const [chunkName, packages] of Object.entries(vendorChunks)) {
            if (packages.some((pkg) => id.includes(`node_modules/${pkg}`))) {
              return chunkName
            }
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
