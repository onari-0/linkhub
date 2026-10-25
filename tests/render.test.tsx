import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Page } from '../src/Page';
import { readSettings } from '../scripts/content-validation';

vi.mock('../src/lib/content', async importOriginal => {
  const original = await importOriginal<typeof import('../src/lib/content')>();
  return {
    ...original,
    site: {
      ...original.site,
      socials: { ...original.site.socials, items: original.site.socials.items.map(item => ({ ...item, enabled: false })) },
      links: { ...original.site.links, items: [...original.site.links.items].reverse().map(item => ({ ...item, enabled: item.id !== 'main-instagram', title: item.id === 'main-youtube' ? '새 이름의 채널' : item.title })) }
    }
  };
});

import App from '../src/App';

it('실제 페이지가 수정된 제목·순서를 표시하고 숨긴 SNS·카드를 제외한다', () => {
  const html = renderToStaticMarkup(<App/>);
  expect(html).toContain('새 이름의 채널');
  expect(html).not.toContain('aria-label="Instagram"');
  expect(html).not.toContain('onari-instagram.jpg');
  expect(html.indexOf('aria-label="새 이름의 채널')).toBeGreaterThanOrEqual(0);
  expect(html.indexOf('aria-label="새 이름의 채널')).toBeLessThan(html.indexOf('aria-label="TikTok'));
});

it('배경은 선택한 경우에만 표시하고 공개·편집기 자산 경로를 각각 적용한다', () => {
  const { site, theme } = readSettings();
  const withoutBackground = { ...site, resources: { ...site.resources } };
  delete withoutBackground.resources.backgroundImage;
  expect(renderToStaticMarkup(<Page site={withoutBackground} theme={theme}/>)).not.toContain('class="page-background"');
  const withBackground = { ...site, resources: { ...site.resources, backgroundImage: 'media/featured.svg' } };
  for (const base of ['/repo/', '/repo/__editor/assets/']) {
    const html = renderToStaticMarkup(<Page site={withBackground} theme={theme} assetBase={base}/>);
    expect(html).toContain('class="page-background" aria-hidden="true"');
    expect(html).toContain(`${base}media/featured.svg`);
  }
});
