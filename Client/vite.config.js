import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
export default defineConfig({
  plugins: [
    react({
      include: /\.(jsx|js)$/,
    }),
    tailwindcss(),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 
  base: '/',

})
