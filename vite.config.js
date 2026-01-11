// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Автоматически обновляет приложение при изменениях
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Кэшируем все ресурсы для оффлайна
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i, // Кэшируем запросы к Supabase (опционально)
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 неделя
              },
            },
          },
        ],
      },
      manifest: {
        name: 'Finance Empire',
        short_name: 'Finance',
        description: 'Управляй деньгами как профи',
        theme_color: '#4338ca', // Цвет шапки (Indigo 600)
        background_color: '#f3f4f6',
        display: 'standalone', // КЛЮЧЕВОЕ: Убирает адресную строку браузера
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Чтобы иконка красиво смотрелась в кружочках/квадратах
          }
        ]
      }
    })
  ],
})