export const editorBase = `${import.meta.env.BASE_URL}__editor`;
export async function request<T>(path: string, method = 'GET', data?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${editorBase}/api/${path}`, {
    method, signal, cache: 'no-store',
    headers: { 'X-Link-Hub-Editor': document.querySelector<HTMLMetaElement>('meta[name="editor-token"]')?.content ?? '', ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : JSON.stringify(data)
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? '편집기 요청에 실패했습니다.');
  return result as T;
}
