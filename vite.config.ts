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
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5176,
    strictPort: true,
    cors: true,
  },
})
