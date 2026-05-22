import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
})
