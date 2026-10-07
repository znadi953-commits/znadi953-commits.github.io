import { defineConfig, type Plugin, type Connect } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { sourceTags } from './vite-source-tags.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Local-dev shim for the Vercel serverless functions living in /api.
 * Maps GET|POST|PUT|DELETE /api/<name> -> api/<name>.js and invokes its
 * default-exported handler with an Express-like req/res shim, so the
 * frontend can call `/api/...` in dev exactly like on Vercel.
 */
function vercelApiDev(): Plugin {
  // Vercel env (Supabase keys, project ref...) into process.env for the
  // server-side handlers. Client-side VITE_* vars come from .env.
  const vercelEnv = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.resolve(__dirname, 'vercel.json'), 'utf8')).env || {};
    } catch {
      return {};
    }
  })();

  const readBody = (req: IncomingMessage): Promise<any> =>
    new Promise((resolve) => {
      let raw = '';
      req.on('data', (c) => (raw += c));
      req.on('end', () => {
        if (!raw) return resolve(undefined);
        const ct = String(req.headers['content-type'] || '');
        if (ct.includes('application/json')) {
          try {
            resolve(JSON.parse(raw));
          } catch {
            resolve(raw);
          }
        } else {
          resolve(raw);
        }
      });
      req.on('error', () => resolve(undefined));
    });

  const makeRes = (res: ServerResponse) => {
    const shim = {
      setHeader(k: string, v: string | number | string[]) {
        res.setHeader(k, v);
        return shim;
      },
      getHeader(k: string) {
        return res.getHeader(k);
      },
      status(code: number) {
        res.statusCode = code;
        return shim;
      },
      json(data: unknown) {
        if (!res.getHeader('content-type'))
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(data));
        return shim;
      },
      send(data: unknown) {
        res.end(typeof data === 'string' ? data : JSON.stringify(data));
        return shim;
      },
      end(data?: unknown) {
        res.end(data as string | undefined);
        return shim;
      },
    };
    return shim;
  };

  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    void (async () => {
      try {
        const url = new URL(req.url || '/', 'http://localhost');
        const name = url.pathname.replace(/^\/+|\/+$/g, '');
        if (!name || name.includes('..')) return next();
        const file = path.resolve(__dirname, 'api', `${name}.js`);
        if (!fs.existsSync(file)) return next();

        for (const [k, v] of Object.entries(vercelEnv)) {
          if (process.env[k] === undefined) process.env[k] = String(v);
        }

        const mod = await (async () => {
          try {
            return await import(/* @vite-ignore */ file);
          } catch {
            return null;
          }
        })();
        const handler = mod?.default;
        if (typeof handler !== 'function') return next();

        const query: Record<string, string> = {};
        url.searchParams.forEach((v, k) => (query[k] = v));
        const body = await readBody(req);

        const reqShim = { method: req.method, url: req.url, headers: req.headers, query, body };
        await handler(reqShim, makeRes(res));
        if (!res.writableEnded) res.end();
      } catch (err) {
        if (!res.writableEnded) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(JSON.stringify({ error: String((err as Error)?.message || err) }));
        }
      }
    })();
  };

  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use('/api', middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api', middleware);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), sourceTags(), vercelApiDev()],
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5173,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
