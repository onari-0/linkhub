import { describe, expect, it, vi } from 'vitest';
import { cleanShareUrl, sharePage } from '../src/lib/share-page';

const data = { title: '공유', url: 'https://example.com/link-hub/' };

describe('방문자 공유 동작', () => {
  it('네이티브 공유가 성공하면 중복 복사하지 않는다', async () => {
    const copy = vi.fn();
    expect(await sharePage(data, { share: vi.fn().mockResolvedValue(undefined), copy })).toBe('native');
    expect(copy).not.toHaveBeenCalled();
  });
  it('공유 취소는 성공이나 복사로 처리하지 않는다', async () => {
    const cancelled = new Error('Cancelled');
    cancelled.name = 'AbortError';
    const copy = vi.fn();
    expect(await sharePage(data, { share: vi.fn().mockRejectedValue(cancelled), copy })).toBe('cancelled');
    expect(copy).not.toHaveBeenCalled();
  });
  it('공유 기능 오류 시 주소 복사로 전환한다', async () => {
    const copy = vi.fn().mockResolvedValue(undefined);
    expect(await sharePage(data, { share: vi.fn().mockRejectedValue(new Error('Not available')), copy })).toBe('clipboard');
    expect(copy).toHaveBeenCalledWith(data.url);
  });
  it('네이티브 공유 미지원 시 복사한다', async () => {
    expect(await sharePage(data, { copy: vi.fn().mockResolvedValue(undefined) })).toBe('clipboard');
  });
  it('권한 거부 또는 API 미지원 시 수동 복사를 안내한다', async () => {
    expect(await sharePage(data, { copy: vi.fn().mockRejectedValue(new Error('Denied')) })).toBe('manual');
    expect(await sharePage(data, {})).toBe('manual');
  });
  it('저장소 경로를 유지하면서 추적용 쿼리·해시를 공유하지 않는다', () => {
    expect(cleanShareUrl(new URL('https://example.com/link-hub/?utm_source=ig#links'))).toBe(data.url);
  });
});
