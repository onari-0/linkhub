import { join, dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';
import { readSettings } from './content-validation';

export async function generateMedia(root = process.cwd()): Promise<string | undefined> {
  const { site } = readSettings(root);
  const settings = site.resources.ogGeneration;
  if (!settings) return undefined;
  const output = join(root, 'public', site.seo.image);
  const extension = site.seo.image.split('.').at(-1);
  mkdirSync(dirname(output), { recursive: true });
  const image = sharp(join(root, 'public', settings.source), { limitInputPixels: 40_000_000 }).resize(settings.width, settings.height, { fit: settings.fit, position: settings.position });
  if (extension === 'webp') await image.webp().toFile(output);
  else if (extension === 'jpg' || extension === 'jpeg') await image.jpeg().toFile(output);
  else await image.png().toFile(output);
  return output;
}

if (process.argv[1]?.endsWith('generate-media.ts')) {
  const output = await generateMedia();
  console.log(output ? `공유 이미지 생성 완료: ${output}` : 'resources.ogGeneration이 없어 생성을 건너뛰었습니다.');
}
