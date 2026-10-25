import type { Site } from '../lib/schema';
import { track } from '../lib/analytics';
import { Icon } from './Icon';

export function SocialLinks({ socials: config, newTabSuffix }: { socials: Site['socials']; newTabSuffix: string }) {
  const socials = config.items.filter(item => item.enabled);
  if (!socials.length) return null;
  return <nav className="social-links" aria-label={config.label}>{socials.map((item, index) =>
    <a key={item.id} href={item.url} aria-label={`${item.label}${item.openInNewTab ? ` (${newTabSuffix})` : ''}`} title={item.label} target={item.openInNewTab ? '_blank' : undefined} rel={item.openInNewTab ? 'noopener noreferrer' : undefined} onClick={() => track('link_click', { link_id: item.id, placement: 'social', position: index + 1, variant: 'icon', destination_host: new URL(item.url).hostname })}><Icon name={item.platform}/></a>
  )}</nav>;
}
