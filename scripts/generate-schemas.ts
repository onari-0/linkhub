import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { z } from 'zod';
import { contentSchemas } from '../src/lib/schema';

mkdirSync('schemas', { recursive: true });
for (const [name, schema] of Object.entries(contentSchemas)) {
  const path = `schemas/${name}.schema.json`;
  const serialized = `${JSON.stringify(z.toJSONSchema(schema, { target: 'draft-07', io: 'input' }), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    if (!existsSync(path) || readFileSync(path, 'utf8') !== serialized) throw new Error(`${path}가 스키마와 다릅니다. npm run schema:generate를 실행하세요.`);
  } else writeFileSync(path, serialized);
}
console.log(process.argv.includes('--check') ? 'JSON Schema 동기화 확인 완료' : '편집용 JSON Schema 생성 완료');
