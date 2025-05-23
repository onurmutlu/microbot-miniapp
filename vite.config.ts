import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import UnoCSS from 'unocss/vite'
import { fileURLToPath, URL } from 'node:url'
import { presetUno, presetAttributify, presetIcons } from 'unocss'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    UnoCSS({
      presets: [
        presetUno(),
        presetAttributify(),
        presetIcons({
          scale: 1.2,
          cdn: 'https://esm.sh/'
        })
      ],
      theme: {
        colors: {
          primary: {
            DEFAULT: '#3B82F6',
            dark: '#1E40AF',
            light: '#60A5FA'
          },
          secondary: {
            DEFAULT: '#10B981',
            dark: '#059669',
            light: '#34D399'
          },
          accent: {
            DEFAULT: '#F59E0B',
            dark: '#D97706',
            light: '#FBBF24'
          }
        }
      },
      shortcuts: {
        'btn': 'px-4 py-2 rounded-lg font-medium transition-colors',
        'btn-primary': 'btn bg-primary text-white hover:bg-primary-dark',
        'btn-secondary': 'btn bg-secondary text-white hover:bg-secondary-dark',
        'card': 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6',
        'input': 'w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-700 dark:text-white'
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: true,
    port: 5176,
    strictPort: false,
    cors: {
      origin: '*'
    },
    hmr: {
      clientPort: 5176,
      protocol: 'ws',
      host: 'localhost',
      overlay: true
    },
    open: true,
    watch: {
      usePolling: false
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
      }
    }
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'https://microbot-api.siyahkare.com/api'),
    'import.meta.env.VITE_WS_URL': JSON.stringify(process.env.VITE_WS_URL || 'wss://microbot-api.siyahkare.com/api/ws'),
    'import.meta.env.VITE_TEST_MODE': JSON.stringify(process.env.VITE_TEST_MODE || 'true')
  }
})
