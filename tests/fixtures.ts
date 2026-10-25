import common from '../content/site.json';
import profileSection from '../content/profile.json';
import links from '../content/links.json';
import products from '../content/products.json';
import footer from '../content/footer.json';
const { theme, ...settings } = common;
const { socials, ...profile } = profileSection;
export const rawTheme = theme;
export const rawSite = { ...settings, profile, socials, links, products, footer };
