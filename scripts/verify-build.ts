import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';
import { loadValidatedContent } from './content-validation';
import { escapeHtml, resolveDeployment } from './deployment';

const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const deployment = resolveDeployment(env.SITE_URL, env.BASE_PATH);
const { site, assets } = await loadValidatedContent();
const html = readFileSync('dist/index.html', 'utf8');
assert.ok(html.includes(`<title>${escapeHtml(site.seo.title)}</title>`), 'HTML title 누락');
assert.ok(html.includes('property="og:image"'), '공유 이미지 메타데이터 누락');
assert.ok(!html.includes('<!-- site-metadata -->'), '메타데이터 변환 실패');
if (deployment.canonical) {
  assert.ok(html.includes(`rel="canonical" href="${deployment.canonical}"`), 'canonical 불일치');
  assert.ok(html.includes(`content="${new URL(site.seo.image, deployment.canonical).href}"`), '공유 이미지 절대 주소 불일치');
}
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  const path = match[1];
  if (/^https?:/.test(path)) continue;
  assert.ok(path.startsWith(deployment.base), `기본 경로 불일치: ${path}`);
  assert.ok(existsSync(join('dist', path.slice(deployment.base.length))), `빌드 파일 누락: ${path}`);
}
for (const item of assets) assert.ok(existsSync(join('dist', item.path)), `배포 이미지 누락: ${item.path}`);
function verifyEditorExcluded(dir: string) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    assert.ok(!['editor', '__editor'].includes(entry.name), `로컬 편집기 파일 포함: ${path}`);
    if (entry.isDirectory()) verifyEditorExcluded(path);
    else if (/\.(js|css|html)$/.test(path)) {
      const text = readFileSync(path, 'utf8');
      assert.ok(!text.includes('__editor') && !text.includes('link-hub-editor-preview') && !text.includes('X-Link-Hub-Editor') && !text.includes('data-local-editor-nav'), `편집기 코드 포함: ${path}`);
    }
  }
}
verifyEditorExcluded('dist');
console.log(`배포 파일·메타데이터·이미지 검증 완료 (base: ${deployment.base})`);
