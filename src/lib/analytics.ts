export type Events = {
  page_view: { page_path: string; utm_source?: string; utm_medium?: string; utm_campaign?: string };
  link_click: { link_id: string; placement: 'social' | 'card' | 'product'; position: number; variant: 'icon' | 'compact' | 'featured' | 'product'; destination_host: string };
  share_success: { method: 'native' | 'clipboard' };
};

export type AnalyticsAdapter = { track<E extends keyof Events>(event: E, properties: Events[E]): void | Promise<void> };
let adapter: AnalyticsAdapter = { track() { /* Intentionally disabled until an analytics provider is configured. */ } };
let didTrackPage = false;

export function configureAnalytics(next: AnalyticsAdapter): void { adapter = next; }

export function track<E extends keyof Events>(event: E, properties: Events[E]): void {
  try {
    void Promise.resolve(adapter.track(event, properties)).catch(() => { /* Navigation must work even if analytics fails. */ });
  } catch { /* Provider failures must not interrupt the visitor. */ }
}

export function trackInitialPage(location: Pick<Location, 'pathname' | 'search'>): void {
  if (didTrackPage) return;
  didTrackPage = true;
  const query = new URLSearchParams(location.search);
  const properties: Events['page_view'] = { page_path: location.pathname };
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign'] as const) {
    const value = query.get(key);
    if (value) properties[key] = value.slice(0, 120);
  }
  track('page_view', properties);
}
