import { defineConfig } from 'tailwindcss'
import tailwindPlugin from '@tailwindcss/vite'

export default defineConfig({
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    plugins: [tailwindPlugin()],
})
