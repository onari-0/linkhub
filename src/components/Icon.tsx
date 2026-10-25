import type { Platform } from '../lib/schema';

export function Icon({ name, className }: { name: Platform | 'arrow' | 'share' | 'flower' | 'heart' | 'check' | 'search' | 'close'; className?: string }) {
  const common = { className, width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': true as const, focusable: false as const };
  if (name === 'search') return <svg {...common} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>;
  if (name === 'close') return <svg {...common} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>;
  if (name === 'instagram') return <svg {...common} stroke="currentColor" strokeWidth="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
  if (name === 'youtube') return <svg {...common}><path fill="currentColor" d="M21.6 7.1a3 3 0 0 0-2.1-2.2C17.7 4.4 12 4.4 12 4.4s-5.7 0-7.5.5a3 3 0 0 0-2.1 2.2A31 31 0 0 0 2 12a31 31 0 0 0 .4 4.9 3 3 0 0 0 2.1 2.2c1.8.5 7.5.5 7.5.5s5.7 0 7.5-.5a3 3 0 0 0 2.1-2.2A31 31 0 0 0 22 12a31 31 0 0 0-.4-4.9Z"/><path fill="var(--color-surface)" d="m10 8.5 6 3.5-6 3.5z"/></svg>;
  if (name === 'tiktok') return <svg {...common}><path fill="currentColor" d="M14 2h3c.3 2.4 1.6 3.9 4 4.2v3a9 9 0 0 1-4-1.4v8a6 6 0 1 1-6-6v3.1a2.9 2.9 0 1 0 3 2.9V2Z"/></svg>;
  if (name === 'arrow') return <svg {...common} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;
  if (name === 'share') return <svg {...common} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15V3m-4 4 4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>;
  if (name === 'check') return <svg {...common} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="m5 12 4 4L19 6"/></svg>;
  if (name === 'heart') return <svg {...common} stroke="currentColor" strokeWidth="1.5"><path d="M20 5.6a5 5 0 0 0-7.1 0l-.9.9-.9-.9A5 5 0 0 0 4 12.7l8 8 8-8a5 5 0 0 0 0-7.1Z"/></svg>;
  if (name === 'flower') return <svg {...common} fill="currentColor"><path d="M12 2c3-1 5 3 3 5 4-1 7 3 4 6 3 3 0 7-4 5-1 5-6 5-7 0-4 2-7-2-4-5-3-3 0-7 4-6-2-2 1-6 4-5Z"/><circle cx="11.5" cy="11.5" r="2.7" fill="var(--color-surface)"/></svg>;
  return <svg {...common} stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c5 6 5 12 0 18-5-6-5-12 0-18Z"/></svg>;
}
