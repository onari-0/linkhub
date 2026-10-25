import { describe, expect, it } from 'vitest';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { rawSite } from './fixtures';
import { siteSchema, normalizeSite, publishSite } from '../src/lib/schema';
import { loadValidatedContent, readSettings } from '../scripts/content-validation';
import { generateMedia } from '../scripts/generate-media';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'link-hub-edit-'));
  for (const name of ['content', 'public']) cpSync(name, join(root, name), { recursive: true });
  return root;
}

describe('편집 입력과 정규화', () => {
  it('문구를 정리하고 공통 목적지와 기본값을 해석한다', () => {
    const input = structuredClone(rawSite); input.profile.name = '  이름  ';
    const site = normalizeSite(siteSchema.parse(input));
    expect(site.profile.name).toBe('이름');
    expect(site.links.items[0].url).toBe(input.destinations.instagram.url);
    expect(site.links.items[0].platform).toBe('instagram');
    expect(site.copy.shareCopy).toBe('주소 복사');
  });
  it('선택 프로필과 푸터를 생략할 수 있다', () => {
    const input = { ...rawSite, profile: { name: '테스트' }, footer: undefined };
    const site = normalizeSite(siteSchema.parse(input));
    expect(site.profile.avatar).toBeUndefined(); expect(site.profile.tags).toEqual([]); expect(site.footer).toBeUndefined();
  });
  it('너무 긴 이름·태그, 중복 태그와 표시되지 않는 compact 배지를 거부한다', () => {
    for (const profile of [{ ...rawSite.profile, name: 'A'.repeat(61) }, { ...rawSite.profile, tags: ['B'.repeat(25)] }, { ...rawSite.profile, tags: ['같은태그', '같은태그'] }]) {
      expect(siteSchema.safeParse({ ...rawSite, profile }).success).toBe(false);
    }
    const input = siteSchema.parse(rawSite); Object.assign(input.links.items[1], { label: '표시되지 않는 값' });
    expect(siteSchema.safeParse(input).success).toBe(false);
  });
  it('없는 목적지, 상품 ID 중복, 잘못된 검색 기준을 거부한다', () => {
    const input = siteSchema.parse(rawSite); input.links.items[0].destination = 'missing';
    expect(siteSchema.safeParse(input).success).toBe(false);
    input.links.items[0].destination = 'instagram'; input.products.items = [{ id: input.links.items[0].id, title: '상품', url: 'https://example.com/', keywords: [], enabled: true, sponsored: true, openInNewTab: true, imageFit: 'cover', imagePosition: 'center' }];
    expect(siteSchema.safeParse(input).success).toBe(false);
    input.products.items = []; input.products.search.minItems = 0;
    expect(siteSchema.safeParse(input).success).toBe(false);
  });
  it('숨긴 항목과 사용하지 않는 목적지 정의를 공개 데이터에서 제외한다', () => {
    const input = siteSchema.parse(rawSite); input.links.items[0].enabled = false; input.links.items[0].title = 'UNPUBLISHED-TEST';
    input.destinations.unused = { label: 'UNUSED-DESTINATION', platform: 'website', url: 'https://example.com/hidden' };
    const serialized = JSON.stringify(publishSite(normalizeSite(input)));
    expect(serialized).not.toContain('UNPUBLISHED-TEST'); expect(serialized).not.toContain('UNUSED-DESTINATION');
  });
});

describe('실제 이미지와 생성 설정', () => {
  it('이미지가 아닌 파일을 확장자만 바꿔 넣으면 실패한다', async () => {
    const root = fixture();
    try { writeFileSync(join(root, 'public/media/og-image.png'), 'not an image'); await expect(loadValidatedContent(root)).rejects.toThrow('이미지를 읽을 수 없습니다'); }
    finally { rmSync(root, { recursive: true }); }
  });
  it('확장자와 실제 형식이 다르면 실패한다', async () => {
    const root = fixture();
    try {
      await sharp({ create: { width: 10, height: 10, channels: 3, background: '#fff' } }).jpeg().toFile(join(root, 'public/media/og-image.png'));
      await expect(loadValidatedContent(root)).rejects.toThrow('확장자와 실제 이미지 형식이 다릅니다');
    } finally { rmSync(root, { recursive: true }); }
  });
  it('변경한 원본·출력 경로·크기·포맷으로 이미지를 생성한다', async () => {
    const root = fixture();
    try {
      const input = JSON.parse(readFileSync(join(root, 'content/site.json'), 'utf8'));
      const resources = { favicon: 'favicon.svg', ogGeneration: { source: 'media/avatar.svg', width: 800, height: 420, fit: 'contain', position: 'top' } };
      input.resources = resources;
      input.seo.image = 'media/custom-preview.webp';
      writeFileSync(join(root, 'content/site.json'), JSON.stringify(input));
      await generateMedia(root);
      expect(existsSync(join(root, 'public/media/custom-preview.webp'))).toBe(true);
      const info = await sharp(join(root, 'public/media/custom-preview.webp')).metadata();
      expect([info.width, info.height, info.format]).toEqual([800, 420, 'webp']);
      const content = await loadValidatedContent(root);
      expect(content.warnings.some(value => value.includes('1200×630'))).toBe(true);
    } finally { rmSync(root, { recursive: true }); }
  });
});


describe('영역별 독립 설정', () => {
  it('기본 링크 영역의 문구를 수정해도 상품 설정은 그대로 유지한다', () => {
    const root = fixture();
    try {
      const path = join(root, 'content/links.json');
      const links = JSON.parse(readFileSync(path, 'utf8')); links.title = '독립적으로 바꾼 제목';
      writeFileSync(path, JSON.stringify(links));
      const { site } = readSettings(root);
      expect(site.links.title).toBe('독립적으로 바꾼 제목');
      expect(site.products.title).toBe(rawSite.products.title);
    } finally { rmSync(root, { recursive: true }); }
  });
  it('잘못된 상품 설정의 파일과 필드 위치를 알려준다', () => {
    const root = fixture();
    try {
      const path = join(root, 'content/products.json');
      const products = JSON.parse(readFileSync(path, 'utf8')); products.search.minItems = 0;
      writeFileSync(path, JSON.stringify(products));
      expect(() => readSettings(root)).toThrow('content/products.json:search.minItems');
    } finally { rmSync(root, { recursive: true }); }
  });
  it('영역 파일이 없으면 해당 파일명을 알려준다', () => {
    const root = fixture();
    try {
      rmSync(join(root, 'content/profile.json'));
      expect(() => readSettings(root)).toThrow('content/profile.json');
    } finally { rmSync(root, { recursive: true }); }
  });
});
