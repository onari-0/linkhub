import type { Site, Theme } from '../src/lib/schema';

export const sections = ['profile', 'links', 'products', 'site', 'footer'] as const;
export type Section = typeof sections[number];
export const sectionLabels: Record<Section, string> = { profile: '프로필', links: '기본 링크', products: '상품', site: '디자인·공통', footer: '푸터' };
export type Settings = Record<Section, unknown>;
export type Drafts = Record<Section, string>;
export type PreviewContent = { site: Site; theme: Theme; warnings: string[] };
export type Schema = {
  type?: string; properties?: Record<string, Schema>; required?: string[]; additionalProperties?: Schema | boolean;
  oneOf?: Schema[]; items?: Schema; enum?: string[]; const?: string; default?: unknown;
  description?: string; format?: string; pattern?: string; minimum?: number; maximum?: number; maxLength?: number; maxItems?: number;
};
export type Snapshot = { settings: Settings; revision: string; schemas: Record<Section, Schema>; assets: string[] };
export const formatSettings = (settings: Settings): Drafts => Object.fromEntries(sections.map(name => [name, JSON.stringify(settings[name], null, 2)])) as Drafts;
export function parseDrafts(drafts: Drafts): Settings {
  return Object.fromEntries(sections.map(name => {
    try { return [name, JSON.parse(drafts[name])]; }
    catch { throw new Error(`content/${name}.json: JSON 문법을 확인하세요.`); }
  })) as Settings;
}
export function seed(schema: Schema, key = ''): unknown {
  if (schema.default !== undefined) return structuredClone(schema.default);
  if (schema.oneOf) return seed(schema.oneOf[0], key);
  if (schema.const !== undefined) return schema.const;
  if (schema.enum) return schema.enum[0];
  if (schema.type === 'object') {
    const values = Object.fromEntries(Object.entries(schema.properties ?? {}).filter(([name, child]) => schema.required?.includes(name) || child.default !== undefined).map(([name, child]) => [name, seed(child, name)]));
    if (schema.properties?.url && !values.destination) values.url = '';
    return values;
  }
  if (schema.type === 'array') return [];
  if (schema.type === 'boolean') return false;
  if (schema.type === 'number' || schema.type === 'integer') return schema.minimum ?? 0;
  return key === 'id' ? `item-${crypto.randomUUID().slice(0, 8)}` : '';
}
export function selectVariant(schema: Schema, value: unknown): Schema {
  const object = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return schema.oneOf?.find(option => Object.entries(option.properties ?? {}).every(([key, child]) => child.const === undefined || child.const === object[key])) ?? schema.oneOf?.[0] ?? schema;
}
export function changeVariant(schema: Schema, value: unknown): Record<string, unknown> {
  const old = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const next = seed(schema) as Record<string, unknown>;
  for (const [key, child] of Object.entries(schema.properties ?? {})) if (Object.hasOwn(old, key) && child.const === undefined) next[key] = old[key];
  return next;
}
