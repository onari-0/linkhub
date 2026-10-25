import type { CSSProperties } from 'react';
import type { Site, Theme } from './lib/schema';
import { assetUrl } from './lib/asset-url';
import { ProfileHeader } from './components/ProfileHeader';
import { SocialLinks } from './components/SocialLinks';
import { LinkCard } from './components/LinkCard';
import { ShareButton } from './components/ShareButton';
import { ProductSection } from './components/ProductSection';
import { Icon } from './components/Icon';

function themeVariables(theme: Theme) {
const variables: Record<string, string | number> = {
  ...Object.fromEntries(Object.entries(theme.colors).map(([key, value]) => [`--color-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`, value])),
  '--card-radius': `${theme.cardRadius}px`, '--content-width': `${theme.contentWidth}px`, '--featured-ratio': theme.featuredRatio,
  '--font-body': theme.font === 'rounded' ? 'ui-rounded, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif' : '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif'
};
for (const [key, value] of Object.entries(theme.typography)) variables[`--font-size-${key}`] = `${value}px`;
for (const [key, value] of Object.entries(theme.spacing)) variables[`--${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`] = `${value}px`;
for (const [key, value] of Object.entries(theme.platforms)) { variables[`--${key}-background`] = value.background; variables[`--${key}-foreground`] = value.foreground; }

return variables;
}

export function Page({ site, theme, assetBase }: { site: Site; theme: Theme; assetBase?: string }) {
  const variables = themeVariables(theme);
  const links = site.links.items.filter(link => link.enabled);
  const showFooter = site.footer?.enabled && (site.footer.message || site.footer.signature);
  return <div className={`page page--${theme.preset}`} style={variables as CSSProperties}>
    {site.resources.backgroundImage && <div className="page-background" aria-hidden="true" style={{ backgroundImage: `url("${assetUrl(site.resources.backgroundImage, assetBase)}")` }}/>}
    <a className="skip-link" href="#links">{site.copy.skipLinks}</a>
    <div className="page-content">
      <div className="topbar"><span className="brand-flower" aria-hidden="true">{site.resources.logo ? <img src={assetUrl(site.resources.logo, assetBase)} alt="" width="28" height="28"/> : <Icon name="flower"/>}</span>{site.profile.caption && <span className="topbar-caption">{site.profile.caption}</span>}<ShareButton copy={site.copy} title={site.seo.title}/></div>
      <main><ProfileHeader profile={site.profile} assetBase={assetBase}/><SocialLinks socials={site.socials} newTabSuffix={site.copy.newTabSuffix}/>
        <section id="links" className="links-section" aria-labelledby="links-title" tabIndex={-1}>
          <div className="section-heading"><h2 id="links-title">{site.links.title}</h2>{site.links.eyebrow && <span>{site.links.eyebrow}<span className="heading-dot" aria-hidden="true">✦</span></span>}</div>
          <div className="link-list">{links.map((link, index) => <LinkCard key={link.id} link={link} position={index + 1} newTabSuffix={site.copy.newTabSuffix} assetBase={assetBase}/>)}</div>
          {links.length === 0 && <p className="empty-state">{site.links.emptyMessage}</p>}
        </section>
        <ProductSection config={site.products} newTabSuffix={site.copy.newTabSuffix} assetBase={assetBase}/>
      </main>
      {showFooter && <footer className="footer"><Icon name="heart"/>{site.footer?.message && <p>{site.footer.message}</p>}{site.footer?.signature && <span>{site.footer.signature}</span>}</footer>}
    </div>
  </div>;
}
