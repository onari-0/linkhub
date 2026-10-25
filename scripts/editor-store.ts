import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, rmSync, lstatSync, realpathSync, readdirSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { loadValidatedContent, sectionNames, type ContentSettings } from './content-validation.ts';
import { mediaPath, publishSite } from '../src/lib/schema.ts';

export class EditorError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function createEditorStore(root: string) {
  let saving = false;
  const pathFor = (name: string) => join(root, 'content', `${name}.json`);
  const readBytes = () => {
    if (lstatSync(join(root, 'content')).isSymbolicLink()) throw new EditorError(400, 'content 폴더는 심볼릭 링크를 사용할 수 없습니다.');
    return sectionNames.map(name => {
      if (!lstatSync(pathFor(name)).isFile() || lstatSync(pathFor(name)).isSymbolicLink()) throw new EditorError(400, `${name}.json은 일반 파일이어야 합니다.`);
      return readFileSync(pathFor(name), 'utf8');
    });
  };
  const revisionOf = (bytes: string[]) => createHash('sha256').update(JSON.stringify(bytes)).digest('hex');
  const snapshot = () => {
    const bytes = readBytes();
    return { settings: Object.fromEntries(sectionNames.map((name, i) => [name, JSON.parse(bytes[i])])) as ContentSettings, revision: revisionOf(bytes) };
  };
  const validate = async (settings: unknown) => {
    if (settings === undefined) throw new EditorError(400, '다섯 영역의 설정을 전달하세요.');
    const content = await loadValidatedContent(root, settings);
    return { site: publishSite(content.site), theme: content.theme, warnings: content.warnings };
  };
  return {
    snapshot, validate,
    async save(settings: unknown, revision: unknown) {
      if (saving) throw new EditorError(409, '다른 저장이 진행 중입니다. 잠시 후 다시 시도하세요.');
      saving = true;
      try {
        const validated = await validate(settings);
        const before = readBytes();
        if (typeof revision !== 'string' || revision !== revisionOf(before)) throw new EditorError(409, '다른 창이나 편집기에서 파일이 바뀌었습니다. 초안 JSON을 복사한 뒤 파일을 다시 읽어 병합하세요.');
        const input = settings as ContentSettings;
        const changed = sectionNames.filter((name, i) => JSON.stringify(input[name]) !== JSON.stringify(JSON.parse(before[i])));
        const temporary = new Map<string, string>();
        const written: string[] = [];
        try {
          for (const name of changed) {
            const path = join(root, 'content', `.editor-${randomUUID()}.tmp`);
            temporary.set(name, path);
            writeFileSync(path, `${JSON.stringify(input[name], null, 2)}\n`, { flag: 'wx', mode: lstatSync(pathFor(name)).mode & 0o777 });
          }
          for (const name of changed) { renameSync(temporary.get(name)!, pathFor(name)); written.push(name); }
        } catch (error) {
          for (const name of written) writeFileSync(pathFor(name), before[sectionNames.indexOf(name as typeof sectionNames[number])]);
          throw error;
        } finally { for (const path of temporary.values()) rmSync(path, { force: true }); }
        return { ...snapshot(), ...validated, changed };
      } finally { saving = false; }
    }
  };
}

export function editorAssetPath(root: string, input: string): string {
  if (!mediaPath.safeParse(input).success) throw new EditorError(404, '이미지를 찾을 수 없습니다.');
  const publicRoot = realpathSync(join(root, 'public'));
  const path = join(publicRoot, input);
  let real: string;
  try { real = realpathSync(path); } catch { throw new EditorError(404, '이미지를 찾을 수 없습니다.'); }
  const rel = relative(publicRoot, real);
  if (rel === '..' || rel.startsWith(`..${sep}`) || !lstatSync(real).isFile() || lstatSync(real).size > 20 * 1024 * 1024) throw new EditorError(404, '이미지를 찾을 수 없습니다.');
  return real;
}

export function listEditorAssets(root: string): string[] {
  const output: string[] = [];
  const walk = (dir: string, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = `${prefix}${entry.name}`;
      if (entry.isDirectory()) walk(join(dir, entry.name), `${path}/`);
      else { try { editorAssetPath(root, path); output.push(path); } catch { /* Ignore unsupported or external files. */ } }
    }
  };
  walk(join(root, 'public'));
  return output.sort();
}
