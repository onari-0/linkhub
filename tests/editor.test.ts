import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, symlinkSync, mkdirSync, realpathSync } from 'node:fs';
import { request as httpRequest } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer, preview } from 'vite';
import { createEditorStore, editorAssetPath } from '../scripts/editor-store';
import { localEditorPlugin } from '../scripts/editor-plugin';
import { sectionNames } from '../scripts/content-validation';

const roots: string[] = [];
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'link-hub-editor-')); roots.push(root);
  for (const dir of ['content', 'public', 'schemas']) cpSync(dir, join(root, dir), { recursive: true });
  return root;
}
const bytes = (root: string) => sectionNames.map(name => readFileSync(join(root, 'content', `${name}.json`), 'utf8'));
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('초안 검증과 로컬 저장', () => {
  it('미리보기는 파일을 바꾸지 않고 저장은 변경한 영역만 반영한다', async () => {
    const root = fixture(); const store = createEditorStore(root); const before = bytes(root);
    const { settings, revision } = store.snapshot();
    (settings.profile as Record<string, unknown>).name = '저장 전 초안';
    const draft = await store.validate(settings);
    expect(draft.site.profile.name).toBe('저장 전 초안'); expect(bytes(root)).toEqual(before);
    const saved = await store.save(settings, revision);
    expect(saved.changed).toEqual(['profile']); expect(saved.revision).not.toBe(revision);
    expect(JSON.parse(bytes(root)[1]).name).toBe('저장 전 초안');
    expect(bytes(root).filter((_, i) => i !== 1)).toEqual(before.filter((_, i) => i !== 1));
    expect(saved.settings.products).toEqual(settings.products);
  });
  it('유효하지 않은 URL·중복 ID·누락 이미지는 다섯 파일 모두 보존한다', async () => {
    const root = fixture(); const store = createEditorStore(root); const before = bytes(root);
    for (const mutate of [
      (settings: ReturnType<typeof store.snapshot>['settings']) => { (settings.profile as Record<string, unknown>).avatar = 'media/missing.png'; },
      (settings: ReturnType<typeof store.snapshot>['settings']) => { (settings.products as { items: unknown[] }).items = [{ id: 'invalid-url', title: '상품', url: 'javascript:alert(1)' }]; },
      (settings: ReturnType<typeof store.snapshot>['settings']) => { const links = settings.links as { items: { id: string }[] }; links.items[1].id = links.items[0].id; }
    ]) {
      const { settings, revision } = store.snapshot(); mutate(settings);
      await expect(store.save(settings, revision)).rejects.toThrow(); expect(bytes(root)).toEqual(before);
    }
  });
  it('외부 파일 변경과 오래된 탭의 저장을 거부해 초안을 덮어쓰지 않는다', async () => {
    const root = fixture(); const store = createEditorStore(root); const first = store.snapshot();
    const other = store.snapshot(); (other.settings.footer as Record<string, unknown>).message = '다른 창의 변경';
    await store.save(other.settings, other.revision);
    (first.settings.profile as Record<string, unknown>).name = '오래된 창';
    await expect(store.save(first.settings, first.revision)).rejects.toMatchObject({ status: 409 });
    expect(JSON.parse(bytes(root)[4]).message).toBe('다른 창의 변경');
    expect(JSON.parse(bytes(root)[1]).name).not.toBe('오래된 창');
    const next = store.snapshot(); writeFileSync(join(root, 'content/profile.json'), bytes(root)[1] + '\n');
    await expect(store.save(next.settings, next.revision)).rejects.toMatchObject({ status: 409 });
  });
  it('영역 누락·임의 경로·심볼릭 링크 저장을 허용하지 않는다', async () => {
    const root = fixture(); const store = createEditorStore(root); const { settings, revision } = store.snapshot();
    await expect(store.validate({ ...settings, '../other': {} })).rejects.toThrow('다섯 영역');
    await expect(store.validate(undefined)).rejects.toThrow('다섯 영역');
    rmSync(join(root, 'content/footer.json')); symlinkSync(join(root, 'content/profile.json'), join(root, 'content/footer.json'));
    await expect(store.save(settings, revision)).rejects.toThrow('일반 파일');
  });
  it('미사용 이미지도 미리볼 수 있고 public 경로 이탈은 거부한다', () => {
    const root = fixture();
    expect(editorAssetPath(root, 'media/avatar.svg')).toBe(realpathSync(join(root, 'public/media/avatar.svg')));
    expect(() => editorAssetPath(root, '../content/site.json')).toThrow();
    symlinkSync(join(root, 'content/site.json'), join(root, 'public/outside.svg'));
    expect(() => editorAssetPath(root, 'outside.svg')).toThrow();
  });
});

describe('로컬 편집기 HTTP 경계', () => {
  it('하위 경로에서 동일 출처·세션 토큰을 확인하고 실제 content를 저장한다', async () => {
    const root = fixture(); mkdirSync(join(root, 'editor')); writeFileSync(join(root, 'editor/main.tsx'), 'export {};');
    const server = await createServer({ configFile: false, root, base: '/local/', publicDir: false, plugins: [localEditorPlugin(root, '/local/')], optimizeDeps: { noDiscovery: true }, server: { host: '127.0.0.1', port: 0 } });
    try {
      await server.listen();
      const address = server.httpServer!.address(); if (!address || typeof address === 'string') throw new Error('서버 주소 누락');
      const origin = `http://127.0.0.1:${address.port}`; const base = `${origin}/local/__editor`;
      const page = await fetch(`${base}/`); expect(page.status).toBe(200);
      const html = await page.text(); const token = html.match(/name="editor-token" content="([a-f0-9]+)"/)?.[1]; expect(token).toBeTruthy();
      const headers = { 'X-Link-Hub-Editor': token!, 'Content-Type': 'application/json' };
      expect((await fetch(`${base}/api/settings`)).status).toBe(403);
      expect((await fetch(`${base}/api/settings`, { headers: { ...headers, Origin: 'https://external.example' } })).status).toBe(403);
      const hostStatus = await new Promise<number | undefined>((resolve, reject) => {
        const req = httpRequest(`${base}/`, { headers: { Host: 'external.example' } }, res => { res.resume(); resolve(res.statusCode); });
        req.on('error', reject); req.end();
      });
      expect(hostStatus).toBe(403);
      const snapshot = await (await fetch(`${base}/api/settings`, { headers })).json();
      expect(Object.keys(snapshot.settings).sort()).toEqual([...sectionNames].sort());
      snapshot.settings.footer.message = 'HTTP 저장'; const before = bytes(root);
      const draft = await fetch(`${base}/api/validate`, { method: 'POST', headers, body: JSON.stringify({ settings: snapshot.settings }) });
      expect(draft.status).toBe(200); expect(bytes(root)).toEqual(before);
      const saved = await fetch(`${base}/api/settings`, { method: 'PUT', headers, body: JSON.stringify(snapshot) });
      expect(saved.status).toBe(200); expect(JSON.parse(bytes(root)[4]).message).toBe('HTTP 저장');
      expect((await fetch(`${base}/api/settings`, { method: 'PUT', headers, body: JSON.stringify(snapshot) })).status).toBe(409);
      expect((await fetch(`${base}/api/validate`, { method: 'POST', headers, body: 'broken' })).status).toBe(400);
      expect((await fetch(`${base}/assets/media/avatar.svg`)).headers.get('content-type')).toBe('image/svg+xml');
      expect((await fetch(`${base}/assets/outside.svg`)).status).toBe(404);
    } finally { await server.close(); }
  });
  it('정적 preview에서는 편집 화면·API·소스 경로를 404로 차단한다', async () => {
    const root = fixture(); mkdirSync(join(root, 'dist')); writeFileSync(join(root, 'dist/index.html'), '<h1>공개 페이지</h1>');
    const server = await preview({ configFile: false, root, base: '/local/', plugins: [localEditorPlugin(root, '/local/')], preview: { host: '127.0.0.1', port: 0 } });
    try {
      const address = server.httpServer.address(); if (!address || typeof address === 'string') throw new Error('서버 주소 누락');
      const origin = `http://127.0.0.1:${address.port}`;
      expect((await fetch(`${origin}/local/`)).status).toBe(200);
      for (const path of ['__editor/', '__editor/api/settings', '__editor/preview', 'editor/main.tsx']) expect((await fetch(`${origin}/local/${path}`)).status).toBe(404);
    } finally { await new Promise<void>((resolve, reject) => server.httpServer.close(error => error ? reject(error) : resolve())); }
  });
});
