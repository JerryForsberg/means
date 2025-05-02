import { defineConfig } from 'tailwindcss'
import tailwindPlugin from '@tailwindcss/vite'

export default defineConfig({
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"IBM Plex Sans"', 'sans-serif'],
            },
        },
    },
    plugins: [tailwindPlugin()],
})
