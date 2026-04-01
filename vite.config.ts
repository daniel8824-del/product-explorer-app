import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || ''),
      GEMINI_API_KEY: JSON.stringify(process.env.GEMINI_API_KEY || ''),
    }
  }
});
