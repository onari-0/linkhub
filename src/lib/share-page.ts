type ShareCapabilities = {
  share?: (data: { title: string; url: string }) => Promise<void>;
  copy?: (text: string) => Promise<void>;
};

export function cleanShareUrl(location: Pick<Location, 'pathname' | 'origin'>): string {
  return new URL(location.pathname, location.origin).href;
}

export async function sharePage(data: { title: string; url: string }, capabilities: ShareCapabilities): Promise<'native' | 'clipboard' | 'manual' | 'cancelled'> {
  if (capabilities.share) {
    try { await capabilities.share(data); return 'native'; }
    catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return 'cancelled';
    }
  }
  if (capabilities.copy) {
    try { await capabilities.copy(data.url); return 'clipboard'; }
    catch { /* Let visitors copy manually when permission is denied. */ }
  }
  return 'manual';
}
