import { useRef, useState } from 'react';
import type { Site } from '../lib/schema';
import { track } from '../lib/analytics';
import { Icon } from './Icon';
import { cleanShareUrl, sharePage } from '../lib/share-page';

export function ShareButton({ copy, title }: { copy: Site['copy']; title: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const nativeBusy = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const share = async (useNative: boolean) => {
    if (useNative && nativeBusy.current) return;
    if (useNative) nativeBusy.current = true;
    setStatus('');
    setManualUrl('');
    // Keep campaign parameters out of the address shared by visitors.
    const url = cleanShareUrl(window.location);
    try {
      const result = await sharePage({ title: title, url }, {
        share: useNative && navigator.share ? data => navigator.share(data) : undefined,
        copy: navigator.clipboard?.writeText ? text => navigator.clipboard.writeText(text) : undefined
      });
      if (result === 'cancelled') return;
      setOpen(false);
      trigger.current?.focus();
      if (result === 'native' || result === 'clipboard') {
        track('share_success', { method: result });
        setStatus(result === 'native' ? copy.shareDone : copy.shareCopied);
      } else {
        setManualUrl(url);
        setStatus(copy.shareManual);
      }
    } finally { if (useNative) nativeBusy.current = false; }
  };
  return <div className="share-control" onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); } }}>
    <button ref={trigger} className="share-button" type="button" aria-label={copy.shareButton} aria-expanded={open} aria-controls="share-panel" onClick={() => { setOpen(value => !value); setStatus(''); setManualUrl(''); }}><Icon name="share"/></button>
    {open && <div id="share-panel" className="share-panel" role="group" aria-label={copy.sharePanelTitle}><p>{copy.sharePanelTitle}</p><button type="button" onClick={() => { void share(false); }}>{copy.shareCopy}</button>{typeof navigator.share === 'function' && <button type="button" onClick={() => { void share(true); }}>{copy.shareNative}</button>}</div>}
    <div className="share-status" role="status" aria-live="polite">{status}</div>
    {manualUrl && <div className="share-fallback"><label htmlFor="share-url">{copy.shareUrlLabel}</label><input id="share-url" value={manualUrl} readOnly onFocus={event => event.currentTarget.select()}/><button type="button" onClick={() => { setManualUrl(''); setStatus(''); }}>{copy.close}</button></div>}
  </div>;
}
