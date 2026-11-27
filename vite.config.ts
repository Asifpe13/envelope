import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || 'https://wiznbwjvyjkjvbnzhdcf.supabase.co'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/sb': {
          target: supabaseUrl,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/sb/, ''),
        },
      },
    },
    preview: {
      proxy: {
        '/sb': {
          target: supabaseUrl,
          changeOrigin: true,
          secure: true,
          rewrite: (path) => path.replace(/^\/sb/, ''),
        },
      },
    },
  }
})
