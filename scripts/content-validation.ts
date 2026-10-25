import { readFileSync, existsSync, statSync, realpathSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import sharp, { type Metadata } from 'sharp';
import { siteSchema, contentSchemas, normalizeSite, type Site, type Theme } from '../src/lib/schema.ts';

export type MediaReference = { field: string; path: string; role: 'image' | 'og' | 'favicon' | 'source' };

export function mediaReferences(site: Site, includeGenerationSource = true): MediaReference[] {
  const refs: MediaReference[] = [{ field: 'seo.image', path: site.seo.image, role: 'og' }, { field: 'resources.favicon', path: site.resources.favicon, role: 'favicon' }];
  if (site.profile.avatar) refs.push({ field: 'profile.avatar', path: site.profile.avatar, role: 'image' });
  if (site.resources.logo) refs.push({ field: 'resources.logo', path: site.resources.logo, role: 'image' });
  if (includeGenerationSource && site.resources.ogGeneration) refs.push({ field: 'resources.ogGeneration.source', path: site.resources.ogGeneration.source, role: 'source' });
  site.links.items.forEach((item, index) => { if (item.enabled && item.image) refs.push({ field: `links.items[${index}].image`, path: item.image, role: 'image' }); });
  site.products.items.forEach((item, index) => { if (item.enabled && item.image) refs.push({ field: `products.items[${index}].image`, path: item.image, role: 'image' }); });
  return refs;
}

function readJson(path: string): unknown {
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch (error) { throw new Error(`${path}: ${error instanceof Error ? error.message : String(error)}`, { cause: error }); }
}

export const sectionNames = ['site', 'profile', 'links', 'products', 'footer'] as const;
export type SectionName = typeof sectionNames[number];
export type ContentSettings = Record<SectionName, unknown>;

export function readContentFiles(root = process.cwd()): ContentSettings {
  return Object.fromEntries(sectionNames.map(name => [name, readJson(join(root, `content/${name}.json`))])) as ContentSettings;
}

export function parseSettings(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).length !== sectionNames.length || !sectionNames.every(name => Object.hasOwn(input, name))) {
    throw new Error('site·profile·links·products·footer 다섯 영역을 모두 전달하세요.');
  }
  const sections: Record<string, unknown> = {};
  const errors: string[] = [];
  for (const [name, schema] of Object.entries(contentSchemas)) {
    const result = schema.safeParse((input as ContentSettings)[name as SectionName]);
    if (!result.success) {
      for (const issue of result.error.issues) errors.push(`content/${name}.json:${issue.path.join('.') || '<root>'}: ${issue.message}`);
    } else sections[name] = result.data;
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const { theme, ...common } = sections.site as Record<string, unknown>;
  const { socials, ...profile } = sections.profile as Record<string, unknown>;
  const result = siteSchema.safeParse({ ...common, profile, socials, links: sections.links, products: sections.products, footer: sections.footer });
  if (!result.success) {
    throw new Error(result.error.issues.map(issue => {
      const [section, ...path] = issue.path;
      const isCommon = ['language', 'seo', 'resources', 'copy', 'destinations'].includes(String(section));
      const file = isCommon ? 'site' : section === 'socials' ? 'profile' : String(section);
      return `content/${file}.json:${(isCommon || section === 'socials' ? issue.path : path).join('.')}: ${issue.message}`;
    }).join('\n'));
  }
  return { site: normalizeSite(result.data), theme: theme as Theme };
}

export function readSettings(root = process.cwd()) { return parseSettings(readContentFiles(root)); }

function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function themeWarnings(theme: Theme): string[] {
  return (['text', 'muted'] as const).flatMap(key => {
    const ratio = Math.min(contrast(theme.colors[key], theme.colors.background), contrast(theme.colors[key], theme.colors.surface));
    return ratio < 4.5 ? [`theme.colors.${key}: 글자 대비가 낮습니다 (${ratio.toFixed(2)}:1).`] : [];
  });
}

export async function loadValidatedContent(root = process.cwd(), input?: unknown) {
  const { site, theme } = input === undefined ? readSettings(root) : parseSettings(input);
  const publicRoot = join(root, 'public');
  const refs = mediaReferences(site);
  const warnings = themeWarnings(theme);
  const errors: string[] = [];
  const checked = new Map<string, Metadata>();
  for (const item of refs) {
    const [section, ...field] = item.field.split('.');
    const isCommon = section === 'seo' || section === 'resources';
    const location = `content/${isCommon ? 'site' : section}.json:${isCommon ? item.field : field.join('.')}`;
    const path = join(publicRoot, item.path);
    if (!existsSync(path) || !statSync(path).isFile()) { errors.push(`${location}: 파일을 찾을 수 없습니다 (${item.path}).`); continue; }
    try {
      const relativePath = relative(realpathSync(publicRoot), realpathSync(path));
      if (relativePath.startsWith(`..${sep}`) || relativePath === '..') throw new Error('public 밖으로 연결된 파일은 사용할 수 없습니다.');
      const bytes = statSync(path).size;
      if (bytes > 20 * 1024 * 1024) throw new Error('이미지는 20MB 이하여야 합니다.');
      let metadata = checked.get(item.path);
      if (!metadata) {
        metadata = await sharp(path, { limitInputPixels: 40_000_000, failOn: 'error' }).metadata();
        await sharp(path, { limitInputPixels: 40_000_000, failOn: 'error' }).resize(1, 1).raw().toBuffer();
        const extension = item.path.split('.').at(-1);
        const expected = extension === 'jpg' ? 'jpeg' : extension === 'avif' ? 'heif' : extension;
        if (metadata.format !== expected) throw new Error(`확장자와 실제 이미지 형식이 다릅니다 (${metadata.format}).`);
        checked.set(item.path, metadata);
        if (bytes > 500 * 1024) warnings.push(`${item.path}: ${(bytes / 1024).toFixed(0)}KB 이미지입니다. 용량 최적화를 고려하세요.`);
      }
      if (item.role === 'og' && (metadata.width !== 1200 || metadata.height !== 630)) warnings.push(`${item.path}: 공유 이미지 권장 크기는 1200×630입니다 (현재 ${metadata.width}×${metadata.height}).`);
    } catch (error) { errors.push(`${location}: 이미지를 읽을 수 없습니다 (${item.path}): ${error instanceof Error ? error.message : String(error)}`); }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  const used = new Set(refs.map(ref => ref.path));
  const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [relative(publicRoot, join(dir, entry.name)).split(sep).join('/')]);
  const unused = walk(publicRoot).filter(path => !used.has(path));
  if (unused.length) warnings.push(`배포하지 않는 미사용 public 파일: ${unused.join(', ')}`);
  return { site, theme, warnings, assets: mediaReferences(site, false) };
}
