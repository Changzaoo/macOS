import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { pathToFileURL } from 'url';

function attachQuery(req: { url?: string; originalUrl?: string; query?: Record<string, string> }) {
  const parsed = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost');
  req.query = Object.fromEntries(parsed.searchParams);
  return req;
}

const apiModule = (file: string) => pathToFileURL(path.resolve(__dirname, file)).href;

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'local-vercel-api',
        configureServer(server) {
          server.middlewares.use('/api/vercel/logo', async (req, res) => {
            const { default: handler } = await import(apiModule('./api/vercel/logo.js'));
            await handler(attachQuery(req), res);
          });
          server.middlewares.use('/api/vercel/projects', async (req, res) => {
            const { default: handler } = await import(apiModule('./api/vercel/projects.js'));
            await handler(attachQuery(req), res);
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 2000,
    },
  };
});
