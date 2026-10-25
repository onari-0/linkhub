import type { Site, Theme } from '../src/lib/schema.ts';

export function normalizeBasePath(raw = '/'): string {
  if (!/^\/(?:[A-Za-z0-9_.-]+\/?)*$/.test(raw) || raw.split('/').some(segment => segment === '.' || segment === '..')) {
    throw new Error('BASE_PATH는 / 또는 /저장소명/ 형식의 경로여야 합니다.');
  }
  return raw.endsWith('/') ? raw : `${raw}/`;
}

export function resolveDeployment(siteUrl?: string, basePath = '/') {
  const base = normalizeBasePath(basePath);
  if (!siteUrl) return { base, canonical: undefined };
  const parsed = new URL(siteUrl);
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) || parsed.search || parsed.hash || parsed.username || parsed.password) {
    throw new Error('SITE_URL에는 쿼리·해시·인증 정보가 없는 HTTPS 사이트 주소를 설정하세요.');
  }
  if (normalizeBasePath(parsed.pathname) !== base) throw new Error('SITE_URL의 경로와 BASE_PATH가 일치해야 합니다.');
  parsed.pathname = base;
  return { base, canonical: parsed.href };
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
}

export function renderMetadata(site: Site, theme: Theme, deployment: ReturnType<typeof resolveDeployment>): string {
  const meta = (name: string, value: string, property = false) => `<meta ${property ? 'property' : 'name'}="${name}" content="${escapeHtml(value)}" />`;
  const faviconTypes: Record<string, string> = { svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', avif: 'image/avif' };
  const faviconType = faviconTypes[site.resources.favicon.split('.').at(-1)!];
  const image = deployment.canonical ? new URL(site.seo.image, deployment.canonical).href : `${deployment.base}${site.seo.image}`;
  return [
    meta('description', site.seo.description), meta('theme-color', theme.colors.background),
    `<link rel="icon" type="${faviconType}" href="${deployment.base}${escapeHtml(site.resources.favicon)}" />`,
    meta('og:type', 'website', true), meta('og:title', site.seo.title, true), meta('og:description', site.seo.description, true), meta('og:image', image, true), meta('og:image:alt', site.seo.imageAlt || site.seo.description, true),
    meta('twitter:card', 'summary_large_image'), meta('twitter:title', site.seo.title), meta('twitter:description', site.seo.description), meta('twitter:image', image),
    ...(deployment.canonical ? [meta('og:url', deployment.canonical, true), `<link rel="canonical" href="${escapeHtml(deployment.canonical)}" />`] : [])
  ].join('\n    ');
}
