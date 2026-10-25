import { z } from 'zod';

const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional();
const id = z.string().regex(/^[a-z][a-z0-9-]*$/, '소문자 영문, 숫자, 하이픈으로 ID를 작성하세요.').meta({ description: 'SNS·기본 링크·상품 전체에서 유일한 ID. 제목·주소·순서를 바꿔도 유지합니다.', examples: ['shop-cushion-01'] });
const platform = z.enum(['instagram', 'tiktok', 'youtube', 'website']).describe('링크에 표시할 아이콘 종류. 일반 웹사이트는 website를 사용합니다.');
const url = z.string().url().refine(value => {
  const parsed = new URL(value);
  return parsed.protocol === 'https:' && !parsed.username && !parsed.password;
}, '인증 정보가 없는 https:// 주소를 사용하세요.').meta({ description: '사용자 이름·비밀번호가 포함되지 않은 HTTPS 목적지 주소.', examples: ['https://example.com/product/cushion'] });
export const mediaPath = z.string().regex(/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(svg|png|jpe?g|webp|avif)$/, 'public 안의 이미지 경로를 작성하세요. 상위 경로(..)는 허용하지 않습니다.').meta({ description: 'public 기준 이미지 경로. 선행 / 없이 영문·숫자·하이픈·밑줄로 작성합니다. 실제 파일도 검증합니다.', examples: ['media/products/cushion.webp'] });
const fit = z.enum(['cover', 'contain']).default('cover').describe('cover는 영역을 채우며 일부를 자르고, contain은 원본 전체를 표시합니다.');
const position = z.enum(['center', 'top', 'bottom', 'left', 'right']).default('center').describe('이미지 배치·크롭 기준 위치. 중요한 피사체가 잘리면 조정하세요.');
const destinationFields = {
  destination: id.optional().describe('site.json의 destinations 키를 참조합니다. destination 또는 url 중 하나는 필요합니다.'),
  url: url.optional().describe('직접 지정한 HTTPS 주소. destination과 함께 쓰면 공통 주소를 덮어씁니다.'),
  platform: platform.optional().describe('개별 아이콘. 생략하면 공통 목적지의 platform을 쓰고, 직접 URL만 있으면 website를 씁니다.')
};
const destinationSchema = z.strictObject({ url, platform, label: text(60).describe('공통 목적지를 구분하는 이름. 화면 항목의 title·label은 각각 따로 정의합니다.') });
const linkBase = {
  id, ...destinationFields, title: text(80).describe('카드 제목. 최대 80자.'), description: optionalText(200).describe('선택적인 카드 설명. 생략하거나 빈 문자열이면 숨깁니다.'),
  enabled: z.boolean().default(true).describe('false면 화면과 공개 빌드 데이터에서 제외합니다.'), openInNewTab: z.boolean().default(false).describe('true면 새 탭으로 엽니다. 기본 링크는 기본값 false입니다.')
};
const linkSchema = z.discriminatedUnion('variant', [
  z.strictObject({ ...linkBase, variant: z.literal('compact').describe('작은 아이콘·썸네일과 문구를 표시하는 카드. label 배지는 지원하지 않습니다.'), image: mediaPath.optional().describe('선택적인 작은 썸네일. 생략하면 플랫폼 아이콘을 표시합니다.') }),
  z.strictObject({ ...linkBase, variant: z.literal('featured').describe('큰 이미지를 표시하는 카드. image와 imageAlt가 필요합니다.'), label: optionalText(24).describe('이미지 위 배지 문구. 최대 24자. 빈 값이면 숨깁니다.'), image: mediaPath, imageAlt: text(160).describe('큰 이미지의 내용을 설명하는 대체 텍스트. 최대 160자.'), imageFit: fit, imagePosition: position })
]);
const socialSchema = z.strictObject({ id, ...destinationFields, label: text(60).describe('아이콘 링크의 접근 가능한 이름과 툴팁.'), enabled: z.boolean().default(true).describe('false면 해당 SNS를 숨깁니다.'), openInNewTab: z.boolean().default(false).describe('true면 새 탭에서 엽니다.') });
const productSchema = z.strictObject({
  id, ...destinationFields, title: text(100).describe('화면과 검색에 사용하는 상품 이름. 최대 100자.'), brand: optionalText(60).describe('선택적인 브랜드 이름. 검색 대상에 포함합니다.'), description: optionalText(240).describe('선택적인 상품 설명. 최대 240자이며 검색 대상에 포함합니다.'),
  image: mediaPath.optional().describe('선택적인 상품 이미지. 생략하면 일반 아이콘을 표시합니다.'), imageAlt: optionalText(160).describe('상품 이미지 설명. 생략하면 장식 이미지로 처리합니다.'), imageFit: fit, imagePosition: position,
  keywords: z.array(text(32)).max(30).default([]).describe('화면에 표시하지 않는 추가 검색어. 최대 30개, 각 32자. 제목·브랜드·설명도 함께 검색합니다.'),
  enabled: z.boolean().default(true).describe('false면 상품과 공개 데이터에서 제외하며 검색창 표시 기준에도 포함하지 않습니다.'), sponsored: z.boolean().default(true).describe('광고·제휴 여부. true면 배지와 sponsored 링크 관계를 적용합니다.'),
  openInNewTab: z.boolean().default(true).describe('상품은 기본값 true로 새 탭에서 엽니다.')
});
export const productsSchema = z.strictObject({
  title: text(80).default('취향을 나누는 작은 상점').describe('상품 섹션 제목.'), eyebrow: optionalText(32).default('PICKS').describe('제목 옆의 짧은 보조 문구. 빈 값이면 숨깁니다.'),
  description: optionalText(240).default('눈여겨본 것들을 한곳에 모았어요.').describe('상품 섹션 소개. 빈 값이면 숨깁니다.'),
  disclosure: optionalText(240).default('광고·제휴 링크가 포함되어 있어요.').describe('노출 상품에 sponsored 항목이 있을 때 표시할 안내. 빈 값이면 숨깁니다.'), sponsoredLabel: text(24).default('광고·제휴').describe('광고·제휴 상품의 배지 문구.'),
  search: z.strictObject({
    minItems: z.number().int().min(1).max(1000).default(6).describe('숨김을 제외한 전체 노출 상품이 이 개수 이상이면 검색창을 표시합니다. 기본 6, 범위 1~1000. 검색 결과 수와는 무관합니다.'),
    label: text(60).default('상품 검색').describe('검색 입력란의 접근 가능한 이름.'), placeholder: text(100).default('상품명, 브랜드, 키워드로 찾아보세요').describe('검색 입력 전 표시할 안내 문구.'),
    clearLabel: text(60).default('검색어 지우기').describe('초기화 버튼의 접근 가능한 이름.'), noResults: text(160).default('일치하는 상품이 없어요. 다른 검색어로 찾아보세요.').describe('검색 결과가 0개일 때 표시할 문구. 섹션과 검색창은 유지됩니다.'),
    resultTemplate: text(100).regex(/\{count\}/, '{count}를 포함하세요.').default('{count}개의 상품').describe('검색 결과 개수 안내. {count}가 실제 결과 수로 바뀌므로 반드시 포함하세요.')
  }).prefault({}),
  items: z.array(productSchema).max(1000).default([]).describe('표시 순서대로 정의한 상품 목록. 비었거나 전부 숨김이면 섹션 전체를 숨깁니다.')
}).prefault({});
export const copySchema = z.strictObject({
  skipLinks: text(80).default('링크 목록으로 건너뛰기').describe('키보드 사용자가 기본 링크로 이동하는 건너뛰기 문구.'),
  shareButton: text(80).default('페이지 공유하기').describe('공유 버튼의 접근 가능한 이름.'), sharePanelTitle: text(80).default('이 작은 공간을 나눠요').describe('공유 방법 선택 패널의 제목.'),
  shareCopy: text(80).default('주소 복사').describe('주소 복사 동작 문구.'), shareNative: text(80).default('다른 앱으로 공유').describe('브라우저의 네이티브 공유 동작 문구.'),
  shareCopied: text(160).default('주소를 복사했어요!').describe('클립보드 복사 성공 안내.'), shareDone: text(160).default('공유했어요. 고마워요!').describe('네이티브 공유 성공 안내.'),
  shareManual: text(160).default('아래 주소를 선택해 복사해 주세요.').describe('공유·복사 API 사용이 어려울 때 수동 복사를 안내합니다.'), shareUrlLabel: text(80).default('페이지 주소').describe('수동 복사 입력란의 이름.'),
  close: text(40).default('닫기').describe('공통 닫기 동작 문구.'), newTabSuffix: text(80).default('새 탭에서 열기').describe('새 탭 링크의 접근 가능한 이름에 덧붙일 문구.'),
  noScript: text(160).default('이 페이지의 링크를 보려면 JavaScript를 켜 주세요.').describe('JavaScript가 꺼진 브라우저에 표시할 안내.')
}).prefault({});
export const siteMetaSchema = z.strictObject({
  language: z.enum(['ko', 'en']).describe('HTML 문서 언어. 화면 문구를 자동으로 번역하지는 않습니다.'),
  seo: z.strictObject({ title: text(120).describe('브라우저 제목과 공유 미리보기 제목. 최대 120자.'), description: text(300).describe('검색·공유 미리보기 설명. 최대 300자.'), image: mediaPath.refine(value => /\.(png|jpe?g|webp)$/.test(value), '공유 이미지는 PNG, JPG, WEBP를 사용하세요.').describe('공유 이미지 경로. PNG/JPG/WEBP, 권장 크기 1200×630. OG 생성 명령의 출력 경로이기도 합니다.'), imageAlt: optionalText(160).describe('공유 이미지 설명. 생략하면 description을 사용합니다.') }).describe('빌드 HTML에 반영할 검색·공유 메타데이터.')
});
export const profileSchema = z.strictObject({
  name: text(60).describe('프로필 이름. 최대 60자.'), caption: optionalText(80).default('a collection of little joys').describe('페이지 맨 위 문구. 빈 값이면 숨깁니다.'), eyebrow: optionalText(120).describe('프로필 이름 위 보조 문구. 생략하거나 빈 값이면 숨깁니다.'), bio: optionalText(240).describe('소개 문구. 줄바꿈을 지원하며 최대 240자. 생략하면 숨깁니다.'), avatar: mediaPath.optional().describe('선택적인 프로필 이미지. 생략하면 이미지 영역을 숨깁니다.'), avatarAlt: optionalText(160).describe('프로필 이미지 설명. 생략하면 이름을 사용한 기본 설명을 표시합니다.'),
  tagsLabel: text(80).default('관심사').describe('관심사 목록의 접근 가능한 이름.'),
  tags: z.array(text(24)).max(6).default([]).refine(tags => new Set(tags).size === tags.length, '중복 태그를 제거하세요.').describe('최대 6개, 각 24자의 관심사. 중복 없이 #을 제외한 문구를 작성하세요. 빈 배열이면 숨깁니다.')
});
export const resourcesSchema = z.strictObject({
  favicon: mediaPath.default('favicon.svg').describe('브라우저 탭 아이콘. public 기준 경로.'), logo: mediaPath.optional().describe('페이지 상단 로고. 생략하면 기본 꽃 아이콘을 표시합니다.'),
  backgroundImage: mediaPath.optional().describe('선택적인 페이지 배경 이미지. public 기준 경로이며 화면 전체를 중앙 기준 cover로 채웁니다. 스크롤해도 배경은 화면에 고정됩니다. 생략하면 기존 색상·프리셋 배경을 사용합니다.'),
  ogGeneration: z.strictObject({ source: mediaPath.describe('공유 이미지 생성 원본. seo.image 출력 경로와 달라야 합니다.'), width: z.number().int().min(200).max(2400).default(1200).describe('출력 너비(px).'), height: z.number().int().min(200).max(2400).default(630).describe('출력 높이(px).'), fit, position }).optional().describe('npm run media:generate에서 사용합니다. 생략하면 수동 공유 이미지를 사용하며 생성을 건너뜁니다.')
}).prefault({});
export const destinationsSchema = z.record(id, destinationSchema).default({}).describe('여러 SNS·카드·상품에서 재사용할 공통 목적지. 각 항목의 destination에 이 객체의 키를 작성합니다.');
export const socialsSchema = z.strictObject({ label: text(80).default('SNS 바로가기').describe('SNS 탐색 영역의 접근 가능한 이름.'), items: z.array(socialSchema).default([]).describe('표시 순서대로 정의한 SNS. 노출 항목이 없으면 탐색 영역을 숨깁니다.') });
export const linksSchema = z.strictObject({
  title: text(80).default('나의 작은 연결들').describe('기본 링크 영역 제목.'), eyebrow: optionalText(32).default('LINKS').describe('제목 옆의 보조 문구. 빈 값이면 숨깁니다.'),
  emptyMessage: text(160).default('새로운 소식을 준비하고 있어요. 곧 만나요!').describe('노출할 기본 링크가 없을 때 표시할 문구.'), items: z.array(linkSchema).default([]).describe('배열 순서대로 표시하는 기본 링크. compact와 featured를 섞을 수 있습니다.')
});
export const footerSchema = z.strictObject({ enabled: z.boolean().default(true).describe('false면 푸터 전체를 숨깁니다.'), message: optionalText(160).describe('푸터 메시지. 빈 값이면 해당 줄을 숨깁니다.'), signature: optionalText(120).describe('짧은 서명. 빈 값이면 해당 줄을 숨깁니다.') });
export const siteSchema = z.strictObject({
  ...siteMetaSchema.shape, profile: profileSchema, resources: resourcesSchema, copy: copySchema,
  destinations: destinationsSchema, socials: socialsSchema, links: linksSchema, products: productsSchema, footer: footerSchema.optional()
}).superRefine((site, ctx) => {
  const ids = new Set<string>();
  for (const [key, items] of [['socials.items', site.socials.items], ['links.items', site.links.items], ['products.items', site.products.items]] as const) {
    items.forEach((item, index) => {
      const path = [...key.split('.'), index];
      if (ids.has(item.id)) ctx.addIssue({ code: 'custom', message: '다른 항목과 중복된 ID입니다.', path: [...path, 'id'] });
      ids.add(item.id);
      if (item.destination && !site.destinations[item.destination]) ctx.addIssue({ code: 'custom', message: '존재하지 않는 목적지입니다.', path: [...path, 'destination'] });
      if (!item.destination && !item.url) ctx.addIssue({ code: 'custom', message: 'url 또는 destination을 지정하세요.', path: [...path, 'url'] });
    });
  }
  if (site.resources.ogGeneration?.source === site.seo.image) ctx.addIssue({ code: 'custom', message: '생성 원본과 출력 경로는 달라야 합니다.', path: ['resources', 'ogGeneration', 'source'] });
});

const color = z.string().regex(/^#[a-fA-F0-9]{6}$/, '#RRGGBB 색상을 사용하세요.').meta({ description: '6자리 HEX 색상(#RRGGBB). 글자 색은 배경과 충분한 대비를 유지하세요.', examples: ['#70549b'] });
const palette = z.strictObject({ background: color.describe('플랫폼 아이콘의 배경색.'), foreground: color.describe('플랫폼 아이콘 색상.') });
export const themeSchema = z.strictObject({
  preset: z.enum(['pastel', 'paper']).describe('pastel은 은은한 배경 효과, paper는 단색 배경을 사용합니다.'),
  colors: z.strictObject({
    background: color.describe('페이지 전체 배경색.'), surface: color.describe('카드·입력창 배경색.'), text: color.describe('주요 글자 색상.'), muted: color.describe('설명·보조 글자 색상.'), accent: color.describe('강조·포커스·장식 색상.'), accentSoft: color.describe('강조 요소의 부드러운 배경색.'), border: color.describe('카드·입력창·구분선 색상.'),
    badgeBackground: color.default('#fffdfb').describe('이미지·광고 배지의 배경색.'), badgeText: color.default('#514160').describe('배지 글자 색상.'), shadow: color.default('#493858').describe('그림자의 기준 색상. 투명도는 스타일에서 적용합니다.')
  }),
  platforms: z.strictObject({
    tiktok: palette.default({ background: '#edf2ed', foreground: '#48644f' }).describe('TikTok 아이콘의 색상 재정의.'),
    youtube: palette.default({ background: '#f9eae7', foreground: '#ac574d' }).describe('YouTube 아이콘의 색상 재정의.')
  }).prefault({}),
  typography: z.strictObject({
    name: z.number().min(24).max(48).default(32).describe('프로필 이름 크기(px).'), title: z.number().min(13).max(24).default(15).describe('카드·상품 제목 크기(px).'),
    body: z.number().min(12).max(20).default(14).describe('본문 크기(px).'), small: z.number().min(11).max(16).default(12).describe('보조 문구 크기(px).')
  }).prefault({}),
  spacing: z.strictObject({ cardGap: z.number().min(8).max(32).default(12).describe('카드 사이 간격(px).'), sectionGap: z.number().min(20).max(64).default(36).describe('기본 링크와 상품 섹션 사이 간격(px).'), cardPadding: z.number().min(12).max(28).default(20).describe('기본 카드 내부 좌우 여백(px).') }).prefault({}),
  featuredRatio: z.number().min(1).max(3).default(16 / 9).describe('이미지형 카드의 가로/세로 비율. 기본 16/9, 허용 범위 1~3.'),
  cardRadius: z.number().int().min(0).max(40).describe('카드 모서리 반경(px), 0~40.'), contentWidth: z.number().int().min(320).max(680).describe('중앙 콘텐츠의 최대 너비(px), 320~680. 모바일은 화면 너비에 맞춥니다.'), font: z.enum(['system', 'rounded']).describe('OS 기본 폰트 또는 둥근 폰트 계열. 실제 글꼴은 기기에 따라 달라집니다.')
});

export const globalSettingsSchema = z.strictObject({
  ...siteMetaSchema.shape, theme: themeSchema.describe('사이트 전체 디자인 토큰. SVG 이미지 내부의 색은 이미지에서 별도로 수정합니다.'), resources: resourcesSchema.describe('브랜드 이미지와 공유 이미지 생성 설정.'), copy: copySchema.describe('공유·복사·키보드 안내 등 공통 UI 문구.'), destinations: destinationsSchema
});
export const profileSectionSchema = profileSchema.extend({ socials: socialsSchema.describe('프로필 아래의 SNS 아이콘 목록과 안내 이름.') });
export const contentSchemas = {
  site: globalSettingsSchema, profile: profileSectionSchema, links: linksSchema, products: productsSchema, footer: footerSchema
} as const;
export type SiteInput = z.infer<typeof siteSchema>;
export type Theme = z.infer<typeof themeSchema>;
export type Platform = z.infer<typeof platform>;
type Resolved<T> = T extends unknown ? Omit<T, 'destination' | 'url' | 'platform'> & { url: string; platform: Platform } : never;
export type Link = Resolved<SiteInput['links']['items'][number]>;
export type Product = Resolved<SiteInput['products']['items'][number]>;
export type Site = Omit<SiteInput, 'destinations' | 'socials' | 'links' | 'products'> & {
  socials: Omit<SiteInput['socials'], 'items'> & { items: Resolved<SiteInput['socials']['items'][number]>[] };
  links: Omit<SiteInput['links'], 'items'> & { items: Link[] };
  products: Omit<SiteInput['products'], 'items'> & { items: Product[] }
};

export function normalizeSite(input: SiteInput): Site {
  const resolve = <T extends { destination?: string; url?: string; platform?: Platform }>(item: T): Resolved<T> => {
    const { destination, url: directUrl, platform: directPlatform, ...rest } = item;
    const target = destination ? input.destinations[destination] : undefined;
    return { ...rest, url: directUrl ?? target!.url, platform: directPlatform ?? target?.platform ?? 'website' } as Resolved<T>;
  };
  const { destinations: _destinations, socials, links, products, ...rest } = input;
  void _destinations;
  return { ...rest, socials: { ...socials, items: socials.items.map(resolve) }, links: { ...links, items: links.items.map(resolve) }, products: { ...products, items: products.items.map(resolve) } };
}

export function publishSite(site: Site): Site {
  return { ...site,
    socials: { ...site.socials, items: site.socials.items.filter(item => item.enabled) },
    links: { ...site.links, items: site.links.items.filter(item => item.enabled) },
    products: { ...site.products, items: site.products.items.filter(item => item.enabled) }
  };
}
