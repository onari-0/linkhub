import { useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Product, Site } from '../lib/schema';
import { assetUrl } from '../lib/asset-url';
import { filterProducts } from '../lib/products';
import { track } from '../lib/analytics';
import { Icon } from './Icon';

function ProductCard({ product, position, sponsoredLabel, newTabSuffix, assetBase }: { product: Product; position: number; sponsoredLabel: string; newTabSuffix: string; assetBase?: string }) {
  const imageStyle = { objectFit: product.imageFit, objectPosition: product.imagePosition } as CSSProperties;
  const rel = [product.sponsored ? 'sponsored' : '', product.openInNewTab ? 'noopener noreferrer' : ''].filter(Boolean).join(' ');
  return <a className="product-card" href={product.url} target={product.openInNewTab ? '_blank' : undefined} rel={rel || undefined}
    aria-label={`${product.title}${product.openInNewTab ? ` (${newTabSuffix})` : ''}`}
    onClick={() => track('link_click', { link_id: product.id, placement: 'product', position, variant: 'product', destination_host: new URL(product.url).hostname })}>
    <div className="product-image">{product.image ? <img src={assetUrl(product.image, assetBase)} alt={product.imageAlt || ''} loading="lazy" width="400" height="400" style={imageStyle}/> : <span className="product-placeholder"><Icon name={product.platform}/></span>}
      {product.sponsored && <span className="product-badge">{sponsoredLabel}</span>}
    </div>
    <div className="product-copy">{product.brand && <span className="product-brand">{product.brand}</span>}<span className="product-title">{product.title}</span>{product.description && <span className="product-description">{product.description}</span>}<span className="product-arrow" aria-hidden="true"><Icon name="arrow"/></span></div>
  </a>;
}

export function ProductSection({ config, newTabSuffix, assetBase }: { config: Site['products']; newTabSuffix: string; assetBase?: string }) {
  const [query, setQuery] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const searchId = useId();
  const items = config.items.filter(item => item.enabled);
  if (!items.length) return null;
  const showSearch = items.length >= config.search.minItems;
  const results = filterProducts(items, showSearch ? query : '');
  return <section className="products-section" aria-labelledby="products-title" id="products">
    <div className="section-heading products-heading"><h2 id="products-title">{config.title}</h2>{config.eyebrow && <span>{config.eyebrow}<span className="heading-dot" aria-hidden="true">✦</span></span>}</div>
    {config.description && <p className="products-intro">{config.description}</p>}
    {config.disclosure && items.some(item => item.sponsored) && <p className="products-disclosure">{config.disclosure}</p>}
    {showSearch && <div className="product-search-block">
      <div className="product-search"><Icon name="search"/><label className="sr-only" htmlFor={searchId}>{config.search.label}</label><input ref={input} id={searchId} type="search" value={query} maxLength={120} placeholder={config.search.placeholder} aria-controls={`${searchId}-results`} onChange={event => setQuery(event.target.value)}/>{query && <button type="button" aria-label={config.search.clearLabel} onClick={() => { setQuery(''); input.current?.focus(); }}><Icon name="close"/></button>}</div>
      <p className="product-result-count" role="status" aria-live="polite" aria-atomic="true">{config.search.resultTemplate.replaceAll('{count}', String(results.length))}</p>
    </div>}
    <ul id={`${searchId}-results`} className="product-grid">{results.map((product, index) => <li key={product.id}><ProductCard product={product} position={index + 1} sponsoredLabel={config.sponsoredLabel} newTabSuffix={newTabSuffix} assetBase={assetBase}/></li>)}</ul>
    {!results.length && <p className="product-no-results">{config.search.noResults}</p>}
  </section>;
}
