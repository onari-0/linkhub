import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

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
  expect(html).not.toContain('featured.svg');
  expect(html.indexOf('aria-label="새 이름의 채널"')).toBeLessThan(html.indexOf('aria-label="TikTok"'));
});
