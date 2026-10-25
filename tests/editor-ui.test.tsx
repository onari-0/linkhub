// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Editor } from '../editor/Editor';
import { SchemaField } from '../editor/SchemaField';
import { request } from '../editor/api';
import { type Snapshot, type Schema, type Settings, type PreviewContent } from '../editor/model';
import { normalizeSite, siteSchema, themeSchema } from '../src/lib/schema';
import common from '../content/site.json';
import profile from '../content/profile.json';
import links from '../content/links.json';
import products from '../content/products.json';
import footer from '../content/footer.json';
import siteSchemaJson from '../schemas/site.schema.json';
import profileSchemaJson from '../schemas/profile.schema.json';
import linksSchemaJson from '../schemas/links.schema.json';
import productsSchemaJson from '../schemas/products.schema.json';
import footerSchemaJson from '../schemas/footer.schema.json';

vi.mock('../editor/api', () => ({ editorBase: '/__editor', request: vi.fn() }));
const original: Snapshot = { settings: { site: common, profile, links, products, footer }, revision: 'initial', schemas: { site: siteSchemaJson, profile: profileSchemaJson, links: linksSchemaJson, products: productsSchemaJson, footer: footerSchemaJson } as unknown as Snapshot['schemas'], assets: ['media/avatar.svg'] };
function validate(settings: Settings): PreviewContent {
  const { theme, ...site } = settings.site as typeof common;
  const { socials, ...profile } = settings.profile as typeof original.settings.profile & typeof import('../content/profile.json');
  return { site: normalizeSite(siteSchema.parse({ ...site, profile, socials, links: settings.links, products: settings.products, footer: settings.footer })), theme: themeSchema.parse(theme), warnings: [] };
}
beforeEach(() => {
  vi.mocked(request).mockImplementation(async (_path, method, data) => {
    if (!method) return structuredClone(original) as never;
    const input = data as { settings: Settings };
    if (method === 'POST') return validate(input.settings) as never;
    return { ...validate(input.settings), settings: input.settings, revision: 'saved', changed: ['profile'] } as never;
  });
});
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('편집 화면의 초안·검증·저장', () => {
  it('파일과 폼/JSON을 오가도 초안을 유지하고 저장 버튼만 쓰기를 요청한다', async () => {
    const user = userEvent.setup(); render(<Editor/>);
    const name = await screen.findByRole('textbox', { name: 'profile.name' });
    await user.clear(name); await user.type(name, '브라우저 초안');
    await screen.findByText('검증 완료 · 저장 전 초안');
    expect(vi.mocked(request).mock.calls.some(call => call[1] === 'PUT')).toBe(false);
    await user.click(screen.getByRole('button', { name: 'JSON' }));
    expect((screen.getByLabelText('profile.json 전체 내용') as HTMLTextAreaElement).value).toContain('브라우저 초안');
    await user.click(screen.getByRole('button', { name: '푸터' }));
    await user.click(screen.getByRole('button', { name: /프로필.*미저장/ }));
    expect((screen.getByLabelText('profile.json 전체 내용') as HTMLTextAreaElement).value).toContain('브라우저 초안');
    await user.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await screen.findByText('profile.json 저장 완료');
    expect(vi.mocked(request).mock.calls.filter(call => call[1] === 'PUT')).toHaveLength(1);
    expect((screen.getByRole('button', { name: '변경 사항 저장' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('잘못된 JSON은 저장하지 않고 오류가 수정되면 검증을 다시 수행한다', async () => {
    const user = userEvent.setup(); render(<Editor/>);
    await screen.findByRole('textbox', { name: 'profile.name' });
    await user.click(screen.getByRole('button', { name: 'JSON' }));
    const json = screen.getByLabelText('profile.json 전체 내용');
    await user.clear(json); await user.type(json, 'broken');
    await screen.findByText('content/profile.json: JSON 문법을 확인하세요.');
    expect((screen.getByRole('button', { name: '변경 사항 저장' }) as HTMLButtonElement).disabled).toBe(true);
    expect(vi.mocked(request).mock.calls.some(call => call[1] === 'PUT')).toBe(false);
    await user.clear(json); await user.click(json); await user.paste(JSON.stringify(original.settings.profile, null, 2));
    await screen.findByText('검증 완료 · 저장된 내용');
  });
  it('저장 충돌 시 편집 초안과 오류를 유지한다', async () => {
    const user = userEvent.setup(); render(<Editor/>);
    const name = await screen.findByRole('textbox', { name: 'profile.name' });
    await user.clear(name); await user.type(name, '충돌해도 남는 초안');
    await screen.findByText('검증 완료 · 저장 전 초안');
    const implementation = vi.mocked(request).getMockImplementation()!;
    vi.mocked(request).mockImplementation(async (...args) => { if (args[1] === 'PUT') throw new Error('다른 창에서 파일이 바뀌었습니다.'); return implementation(...args); });
    await user.click(screen.getByRole('button', { name: '변경 사항 저장' }));
    await screen.findByText('다른 창에서 파일이 바뀌었습니다.');
    expect((screen.getByRole('textbox', { name: 'profile.name' }) as HTMLInputElement).value).toBe('충돌해도 남는 초안');
  });
});

it('목록 순서와 카드 형태를 바꿀 때 ID를 보존하고 맞지 않는 필드를 제거한다', async () => {
  const user = userEvent.setup();
  let items: unknown = links.items;
  const schema = linksSchemaJson.properties.items as unknown as Schema;
  const { rerender } = render(<SchemaField schema={schema} value={items} path="links.items" assets={[]} onChange={next => { items = next; }}/>);
  await user.click(screen.getByRole('button', { name: 'links.items 1번 아래로' }));
  expect((items as { id: string }[]).map(item => item.id)).toEqual([links.items[1].id, links.items[0].id, links.items[2].id]);
  rerender(<SchemaField schema={schema} value={items} path="links.items" assets={[]} onChange={next => { items = next; }}/>);
  const selectors = screen.getAllByLabelText('카드 형태');
  await user.selectOptions(selectors[1], '0');
  const changed = (items as Record<string, unknown>[])[1];
  expect(changed.id).toBe(links.items[0].id); expect(changed.variant).toBe('compact'); expect(changed.label).toBeUndefined();
  await waitFor(() => expect(changed.imageAlt).toBeUndefined());
});
