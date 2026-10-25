import { loadValidatedContent } from './content-validation';

try {
  const { site, warnings } = await loadValidatedContent();
  warnings.forEach(warning => console.warn(`안내: ${warning}`));
  console.log(`콘텐츠·테마·이미지 검증 완료: 링크 ${site.links.items.length}개, SNS ${site.socials.items.length}개, 상품 ${site.products.items.length}개`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
