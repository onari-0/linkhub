import type { Link } from '../lib/schema';
import { assetUrl } from '../lib/asset-url';
import { track } from '../lib/analytics';
import { Icon } from './Icon';

export function LinkCard({ link, position, newTabSuffix, assetBase }: { link: Link; position: number; newTabSuffix: string; assetBase?: string }) {
  return <a className={`link-card link-card--${link.variant}`} href={link.url}
    target={link.openInNewTab ? '_blank' : undefined} rel={link.openInNewTab ? 'noopener noreferrer' : undefined}
    aria-label={`${link.title}${link.openInNewTab ? ` (${newTabSuffix})` : ''}`}
    onClick={() => track('link_click', { link_id: link.id, placement: 'card', position, variant: link.variant, destination_host: new URL(link.url).hostname })}>
    {link.variant === 'featured' && <div className="featured-image"><img src={assetUrl(link.image, assetBase)} alt={link.imageAlt} width="960" height="540" loading="lazy" decoding="async" style={{ objectFit: link.imageFit, objectPosition: link.imagePosition }}/>{link.label && <span className="featured-label"><span aria-hidden="true">✦</span> {link.label}</span>}</div>}
    <div className="card-body">
      <span className={`platform-mark platform-mark--${link.platform}`}>{link.variant === 'compact' && link.image ? <img src={assetUrl(link.image, assetBase)} width="26" height="26" alt="" loading="lazy"/> : <Icon name={link.platform}/>}</span>
      <div className="card-copy"><span className="card-title">{link.title}</span>{link.description && <span className="card-description">{link.description}</span>}</div>
      <span className="card-arrow"><Icon name="arrow"/></span>
    </div>
  </a>;
}
