// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { rawSite } from './fixtures';
import productFixture from './fixtures/products.json';
import { siteSchema, normalizeSite, type Product } from '../src/lib/schema';
import { filterProducts } from '../src/lib/products';
import { ProductSection } from '../src/components/ProductSection';

afterEach(cleanup);
function config(count: number, minItems = 3) {
  return normalizeSite(siteSchema.parse({ ...rawSite, products: { ...rawSite.products, search: { minItems }, items: Array.from({ length: count }, (_, index) => ({
    id: `test-product-${index}`, title: index === 0 ? '구름 키링' : `상품 ${index}`, brand: index === 1 ? 'Green Studio' : '작은 상점',
    description: '작은 선물', keywords: index === 2 ? ['다이어리', 'ABC'] : [], url: `https://example.com/items/${index}`, enabled: true
  })) } })).products;
}
function show(value: ReturnType<typeof config>) { return render(<ProductSection config={value} newTabSuffix="새 탭에서 열기"/>); }

describe('상품 섹션과 표시 기준', () => {
  it('빈 목록이면 제목과 검색창을 포함한 영역 전체를 숨긴다', () => {
    const { container } = show(config(0));
    expect(container.innerHTML).toBe('');
  });
  it('숨김 항목만 있어도 영역 전체를 숨긴다', () => {
    const value = config(2); value.items.forEach(item => { item.enabled = false; });
    const { container } = show(value);
    expect(container.innerHTML).toBe('');
  });
  it('n 미만에서는 검색 없이 상품 링크를 표시한다', () => {
    show(config(2));
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
  it('정확히 n개부터 검색창을 표시한다', () => {
    show(config(3));
    expect(screen.getByRole('searchbox', { name: '상품 검색' })).toBeTruthy();
    expect(screen.getByRole('status').textContent).toBe('3개의 상품');
  });
  it('숨김 항목을 검색창 표시 기준과 결과에서 제외한다', () => {
    const value = config(3); value.items[2].enabled = false; show(value);
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
  it('광고 링크와 새 탭 속성을 적용한다', () => {
    show(config(1));
    const link = screen.getByRole('link', { name: '구름 키링 (새 탭에서 열기)' });
    expect(link.getAttribute('rel')).toBe('sponsored noopener noreferrer');
    expect(link.getAttribute('href')).toBe('https://example.com/items/0');
    expect(link.getAttribute('target')).toBe('_blank');
  });
});

describe('상품 검색', () => {
  it('상품 픽스처를 실제 스키마로 읽고 기본 검색 기준에서 검색·초기화한다', async () => {
    const value = normalizeSite(siteSchema.parse({ ...rawSite, products: { ...rawSite.products, search: { minItems: 6 }, items: productFixture } })).products;
    const user = userEvent.setup(); show(value);
    expect(screen.getAllByRole('link')).toHaveLength(8);
    await user.type(screen.getByRole('searchbox', { name: '상품 검색' }), '문구');
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByRole('link', { name: '하루 기록 노트 (새 탭에서 열기)' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '작은 꽃 책갈피 (새 탭에서 열기)' })).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(screen.getAllByRole('link')).toHaveLength(8);
  });
  it('제목·브랜드·키워드, 여러 검색어, 영문 대소문자와 전각 문자를 검색한다', () => {
    const items = config(3).items;
    expect(filterProducts(items, '구름 키링').map(item => item.id)).toEqual(['test-product-0']);
    expect(filterProducts(items, ' GREEN  studio ').map(item => item.id)).toEqual(['test-product-1']);
    expect(filterProducts(items, 'ＡＢＣ').map(item => item.id)).toEqual(['test-product-2']);
    expect(filterProducts(items, '다이어리 선물').map(item => item.id)).toEqual(['test-product-2']);
  });
  it('입력에 따라 필터링하고 결과 없음·지우기를 처리한다', async () => {
    const user = userEvent.setup(); show(config(3));
    const input = screen.getByRole('searchbox');
    await user.type(input, 'green');
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(screen.getByRole('status').textContent).toBe('1개의 상품');
    await user.clear(input); await user.type(input, '찾을수없는검색어');
    expect(screen.queryByRole('link')).toBeNull();
    expect(screen.getByText('일치하는 상품이 없어요. 다른 검색어로 찾아보세요.')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '검색어 지우기' }));
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(document.activeElement).toBe(input);
    expect((input as HTMLInputElement).value).toBe('');
  });
  it('목록이 n 미만이 되어 검색창이 사라지면 이전 검색어로 항목을 숨기지 않는다', async () => {
    const user = userEvent.setup(); const { rerender } = show(config(3));
    await user.type(screen.getByRole('searchbox'), '없는 검색어');
    expect(screen.queryByRole('link')).toBeNull();
    rerender(<ProductSection config={config(2)} newTabSuffix="새 탭에서 열기"/>);
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(2);
  });
  it('빈 검색어는 순서를 유지한다', () => {
    const items: Product[] = config(3).items;
    expect(filterProducts(items, '  ')).toBe(items);
  });
});
