import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { createEditorStore, editorAssetPath, listEditorAssets, EditorError } from './editor-store.ts';
import { sectionNames } from './content-validation.ts';

const mime: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };
const loopback = (host: string) => ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost', '[::1]'].includes(host);

function assertLocal(req: IncomingMessage) {
  const host = new URL(`http://${req.headers.host ?? 'invalid'}`);
  if (!loopback(host.hostname) || !loopback(req.socket.remoteAddress ?? '')) throw new EditorError(403, '로컬에서만 사용할 수 있습니다.');
  if (req.headers.origin && req.headers.origin !== host.origin) throw new EditorError(403, '동일한 로컬 주소에서 요청하세요.');
  if (req.headers['sec-fetch-site'] === 'cross-site') throw new EditorError(403, '외부 사이트의 요청은 허용하지 않습니다.');
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
}

async function body(req: IncomingMessage) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') throw new EditorError(415, 'JSON 요청이 필요합니다.');
  const parts: Buffer[] = []; let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > 4 * 1024 * 1024) throw new EditorError(413, '설정은 4MB 이하여야 합니다.');
    parts.push(Buffer.from(chunk));
  }
  try { return JSON.parse(Buffer.concat(parts).toString('utf8')) as { settings?: unknown; revision?: unknown }; }
  catch { throw new EditorError(400, 'JSON 문법을 확인하세요.'); }
}

export function localEditorPlugin(root: string, base: string): Plugin {
  const prefix = `${base}__editor`;
  return {
    name: 'link-hub-local-editor',
    apply: 'serve',
    transformIndexHtml(html, context) {
      if (!context.server || context.path.includes('/__editor')) return html;
      const toolbar = `<nav data-local-editor-nav aria-label="로컬 편집 도구" style="--color-accent:#70549b;width:calc(100% - 40px);max-width:520px;margin:12px auto 0;display:flex;justify-content:flex-end;font:13px/1.5 system-ui"><a href="${prefix}/" style="display:inline-flex;align-items:center;min-height:40px;padding:8px 16px;border:1px solid #e6dfea;border-radius:999px;background:#fffdfb;color:#70549b">페이지 편집</a></nav>`;
      return html.replace(/<body\b[^>]*>/i, tag => `${tag}${toolbar}`);
    },
    configureServer(server) {
      if (!loopback(String(server.config.server.host))) throw new Error('편집 도구가 있는 개발 서버는 --host 127.0.0.1 또는 localhost로 실행하세요.');
      const token = randomBytes(32).toString('hex');
      const store = createEditorStore(root);
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (!path.startsWith(`${prefix}/`) && path !== prefix) return next();
        void (async () => {
          assertLocal(req);
          if (path === prefix && req.method === 'GET') { res.writeHead(302, { Location: `${prefix}/` }); res.end(); return; }
          if ([`${prefix}/`, `${prefix}/preview`].includes(path) && req.method === 'GET') {
            const preview = path.endsWith('/preview');
            const html = await server.transformIndexHtml(path, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="editor-token" content="${token}"><title>${preview ? '페이지 미리보기' : 'Link Hub 로컬 편집기'}</title></head><body><div id="root"></div><script type="module" src="/editor/${preview ? 'preview' : 'main'}.tsx"></script></body></html>`);
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Frame-Options': 'SAMEORIGIN', 'Content-Security-Policy': "frame-ancestors 'self'", 'X-Content-Type-Options': 'nosniff' }); res.end(html); return;
          }
          if (path.startsWith(`${prefix}/assets/`) && req.method === 'GET') {
            const asset = path.slice(`${prefix}/assets/`.length);
            const file = editorAssetPath(root, asset);
            res.writeHead(200, { 'Content-Type': mime[asset.split('.').at(-1)!], 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }); res.end(readFileSync(file)); return;
          }
          if (req.headers['x-link-hub-editor'] !== token) throw new EditorError(403, '편집기 연결이 만료되었습니다. 페이지를 새로고침하세요.');
          if (path === `${prefix}/api/settings` && req.method === 'GET') {
            const schemas = Object.fromEntries(sectionNames.map(name => [name, JSON.parse(readFileSync(join(root, `schemas/${name}.schema.json`), 'utf8'))]));
            json(res, 200, { ...store.snapshot(), schemas, assets: listEditorAssets(root) }); return;
          }
          if (path === `${prefix}/api/validate` && req.method === 'POST') {
            const input = await body(req);
            json(res, 200, await store.validate(input?.settings)); return;
          }
          if (path === `${prefix}/api/settings` && req.method === 'PUT') {
            const input = await body(req);
            json(res, 200, await store.save(input?.settings, input?.revision)); return;
          }
          throw new EditorError(404, '편집기 경로를 찾을 수 없습니다.');
        })().catch(error => json(res, error instanceof EditorError ? error.status : 400, { error: error instanceof Error ? error.message : String(error) }));
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0];
        if (path === prefix || path.startsWith(`${prefix}/`) || path.startsWith(`${base}editor/`)) { res.statusCode = 404; res.end('Not found'); }
        else next();
      });
    }
  };
}
