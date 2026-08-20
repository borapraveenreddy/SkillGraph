import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: './', // Enforces relative paths for assets on Vercel deployment
    server: {
        port: 3000,
    },
});