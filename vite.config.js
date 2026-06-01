import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'cursor-debug-ingest',
      configureServer(server) {
        server.middlewares.use('/__cursor_debug', (req, res, next) => {
          if (req.method !== 'POST') return next();
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
            if (body.length > 1_000_000) req.destroy();
          });
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const logPath = path.resolve(projectRoot, '.cursor', 'debug-35dfed.log');
              fs.mkdirSync(path.dirname(logPath), { recursive: true });
              fs.appendFileSync(logPath, `${JSON.stringify(payload)}\n`, 'utf8');
            } catch {
              // ignore parse/write errors in debug ingest
            }
            res.statusCode = 204;
            res.end();
          });
        });
      },
    },
  ],
})
