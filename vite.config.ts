import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim().replace(/\/+$/, "")

  if (command === "serve" && !apiProxyTarget) {
    throw new Error("VITE_API_PROXY_TARGET 환경변수를 설정해 주세요.")
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: apiProxyTarget ? {
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    } : undefined,
    assetsInclude: ['**/*.svg', '**/*.csv'],
  }
})
