import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, cpSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { rawSite } from './fixtures';
import { siteSchema } from '../src/lib/schema';
import { assetUrl } from '../src/lib/asset-url';
import { loadValidatedContent, readSettings } from '../scripts/content-validation';
import { escapeHtml, renderMetadata, resolveDeployment } from '../scripts/deployment';

describe('콘텐츠 편집 시 배포 계약', () => {
  it('중복 ID와 실행 가능한 URL을 거부한다', () => {
    const content = siteSchema.parse(rawSite);
    content.links.items[0].id = content.socials.items[0].id;
    expect(siteSchema.safeParse(content).success).toBe(false);
    content.links.items[0].id = 'unique-link';
    content.links.items[0].url = 'javascript:alert(1)';
    expect(siteSchema.safeParse(content).success).toBe(false);
  });
  it('이미지가 없는 featured 카드와 경로 이탈을 거부한다', () => {
    const content = siteSchema.parse(rawSite);
    content.links.items[0].image = undefined;
    expect(siteSchema.safeParse(content).success).toBe(false);
    content.links.items[0].image = 'media/../private.png';
    expect(siteSchema.safeParse(content).success).toBe(false);
  });
  it('실제 누락 파일의 편집 위치를 알려준다', async () => {
    const root = mkdtempSync(join(tmpdir(), 'link-hub-'));
    try {
      cpSync('content', join(root, 'content'), { recursive: true });
      await expect(loadValidatedContent(root)).rejects.toThrow('content/profile.json:avatar: 파일을 찾을 수 없습니다');
    } finally { rmSync(root, { recursive: true }); }
  });
});

describe('GitHub Pages 배포 계약', () => {
  it.each(['/', '/link-hub/', '/repo.with-dot/'])('%s 아래의 이미지 주소를 만든다', base => {
    expect(assetUrl('media/avatar.svg', base)).toBe(`${base}media/avatar.svg`);
  });
  it('커스텀 도메인과 저장소 하위 경로를 지원한다', () => {
    expect(resolveDeployment('https://example.com', '/').canonical).toBe('https://example.com/');
    expect(resolveDeployment('https://user.github.io/link-hub', '/link-hub/').canonical).toBe('https://user.github.io/link-hub/');
  });
  it('메타데이터와 실제 서비스 경로의 불일치를 거부한다', () => {
    expect(() => resolveDeployment('https://user.github.io/', '/repo/')).toThrow('일치');
    expect(() => resolveDeployment(undefined, '//external.com/')).toThrow();
    expect(() => resolveDeployment('https://example.com/?token=secret', '/')).toThrow();
  });
  it('배포 주소를 지정하지 않으면 임의의 canonical을 만들지 않는다', () => {
    const { site, theme } = readSettings();
    expect(renderMetadata(site, theme, resolveDeployment())).not.toContain('rel="canonical"');
  });
  it('HTML에 삽입하는 사용자 문구를 이스케이프한다', () => {
    expect(escapeHtml('"<&')).toBe('&quot;&lt;&amp;');
    const { site, theme } = readSettings();
    const markup = renderMetadata({ ...site, seo: { ...site.seo, description: '"/><script>alert(1)</script>' } }, theme, resolveDeployment('https://example.com'));
    expect(markup).not.toContain('<script>');
    expect(markup).toContain('&lt;script&gt;');
  });
});

describe('분석 연결 계약', () => {
  afterEach(() => { vi.resetModules(); });
  it('초기 방문을 한 번 수집하고 허용된 캠페인 값만 전달한다', async () => {
    const analytics = await import('../src/lib/analytics');
    const track = vi.fn();
    analytics.configureAnalytics({ track });
    const location = { pathname: '/repo/', search: '?utm_source=ig&fbclid=private&email=hello' };
    analytics.trackInitialPage(location);
    analytics.trackInitialPage(location);
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('page_view', { page_path: '/repo/', utm_source: 'ig' });
  });
  it('분석 제공자가 동기·비동기로 실패해도 호출자에게 오류를 전파하지 않는다', async () => {
    const analytics = await import('../src/lib/analytics');
    analytics.configureAnalytics({ track() { throw new Error('offline'); } });
    expect(() => analytics.track('share_success', { method: 'clipboard' })).not.toThrow();
    analytics.configureAnalytics({ track() { return Promise.reject(new Error('offline')); } });
    analytics.track('share_success', { method: 'clipboard' });
    await new Promise(resolve => setTimeout(resolve, 0));
  });
});
