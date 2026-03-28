import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-512.png'],
      manifest: {
        name: 'Cantus',
        short_name: 'Cantus',
        description: 'Gestión de repertorios musicales',
        theme_color: '#000000',
        icons: [
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icon-512.png', // Rehusando el mismo para simplicidad en este paso, el navegador lo escala.
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
