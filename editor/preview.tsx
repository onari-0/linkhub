import { createRoot } from 'react-dom/client';
import { Page } from '../src/Page';
import type { PreviewContent } from './model';
import '../src/styles/global.css';

const root = createRoot(document.getElementById('root')!);
root.render(<p style={{ padding: 24, textAlign: 'center', color: '#72667c' }}>검증된 초안을 기다리고 있습니다.</p>);
window.addEventListener('message', event => {
  if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'link-hub-editor-preview') return;
  const content = event.data.content as PreviewContent;
  document.title = content.site.seo.title;
  document.documentElement.lang = content.site.language;
  document.documentElement.style.background = content.theme.colors.background;
  root.render(<Page site={content.site} theme={content.theme} assetBase={`${import.meta.env.BASE_URL}__editor/assets/`}/>);
});
document.addEventListener('click', event => {
  if (event.target instanceof Element && event.target.closest('a')?.getAttribute('href')?.startsWith('https:')) event.preventDefault();
}, true);
