import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        // lottie-react menaruh bundle UMD di field "browser" sehingga default
        // import-nya menjadi objek modul, bukan komponen — paksa pakai build ES.
        'lottie-react': 'lottie-react/build/index.es.js',
      },
    },
    server: {
      port: Number(env.VITE_APP_PORT) || 5174,
    },
    build: {
      rollupOptions: {
        output: {
          // Pisahkan dependency pihak ketiga agar chunk app lebih kecil & cache lebih awet.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id))
              return 'vendor-react';
            if (/[\\/]node_modules[\\/](@radix-ui|cmdk|lucide-react|class-variance-authority|tailwind-merge|clsx)[\\/]/.test(id))
              return 'vendor-ui';
            return 'vendor';
          },
        },
      },
    },
  };
});
