import { readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, loadEnv, type Plugin, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadValidatedContent } from './scripts/content-validation.ts';
import { publishSite } from './src/lib/schema.ts';
import { escapeHtml, renderMetadata, resolveDeployment } from './scripts/deployment.ts';
import { localEditorPlugin } from './scripts/editor-plugin.ts';

const virtualModule = 'virtual:link-hub-content';
const resolvedModule = `\0${virtualModule}`;
const mime: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const root = process.cwd();
  const env = { ...loadEnv(mode, root, ''), ...process.env };
  let content = await loadValidatedContent(root);
  const deployment = resolveDeployment(env.SITE_URL, env.BASE_PATH);
  const contentPlugin: Plugin = {
      name: 'link-hub-content',
      resolveId(id) { if (id === virtualModule) return resolvedModule; },
      load(id) {
        if (id !== resolvedModule) return;
        return `export const site = ${JSON.stringify(publishSite(content.site))}; export const theme = ${JSON.stringify(content.theme)};`;
      },
      configureServer(server) {
        let reloadTimer: ReturnType<typeof setTimeout>;
        server.watcher.add([join(root, 'content'), join(root, 'public')]);
        server.watcher.on('all', (event, file) => {
          const path = relative(root, file).replaceAll('\\', '/');
          if (!['change', 'add', 'unlink'].includes(event) || (!/^content\/[a-z-]+\.json$/.test(path) && !path.startsWith('public/'))) return;
          clearTimeout(reloadTimer);
          reloadTimer = setTimeout(() => { void (async () => { try {
            content = await loadValidatedContent(root);
            const module = server.moduleGraph.getModuleById(resolvedModule);
            if (module) server.moduleGraph.invalidateModule(module);
            server.ws.send({ type: 'full-reload', path: `${deployment.base}index.html` });
          } catch (error) {
            server.ws.send({ type: 'error', err: { message: error instanceof Error ? error.message : String(error), stack: '' } });
          } })(); }, 200);
        });
        server.httpServer?.once('close', () => clearTimeout(reloadTimer));
        server.middlewares.use((req, res, next) => {
          const rawPath = (req.url ?? '').split('?')[0];
          const path = rawPath.startsWith(deployment.base) ? rawPath.slice(deployment.base.length) : rawPath.replace(/^\//, '');
          const asset = content.assets.find(item => item.path === path);
          if (asset) {
            res.setHeader('Content-Type', mime[path.split('.').at(-1)!] ?? 'application/octet-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.end(readFileSync(join(root, 'public', path)));
          } else if (path.startsWith('media/') || /\.(svg|png|jpe?g|webp|avif)$/.test(path)) {
            res.statusCode = 404; res.end('Not found');
          } else next();
        });
      },
      transformIndexHtml(html, context) {
        if (context.path.includes('/__editor')) return html;
        const { site, theme } = content;
        return html.replace(/<html lang="[^"]+">/, `<html lang="${site.language}" style="background:${theme.colors.background}">`)
          .replace(/<title>[^<]*<\/title>/, () => `<title>${escapeHtml(site.seo.title)}</title>`)
          .replace('<!-- site-metadata -->', () => renderMetadata(site, theme, deployment))
          .replace(/<noscript>.*?<\/noscript>/s, () => `<noscript>${escapeHtml(site.copy.noScript)}</noscript>`);
      },
      generateBundle() {
        for (const path of new Set(content.assets.map(item => item.path))) this.emitFile({ type: 'asset', fileName: path, source: readFileSync(join(root, 'public', path)) });
      }
  };
  return {
    base: deployment.base,
    publicDir: false,
    plugins: [react(), localEditorPlugin(root, deployment.base), contentPlugin],
    server: { host: '127.0.0.1', port: 5173, strictPort: true, watch: { usePolling: true, interval: 300 } },
    preview: { host: '127.0.0.1', port: 4173, strictPort: true }
  };
});
