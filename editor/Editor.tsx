import { useEffect, useRef, useState } from 'react';
import { editorBase, request } from './api';
import { SchemaField } from './SchemaField';
import { SegmentedControl } from './SegmentedControl';
import { sections, sectionLabels, formatSettings, parseDrafts, type Section, type Snapshot, type Drafts, type PreviewContent, type Settings } from './model';

type Validation = { signature: string; content?: PreviewContent; error?: string };
const message = (error: unknown) => error instanceof Error ? error.message : String(error);
const editorModes = [{ value: 'form', label: '입력 폼' }, { value: 'json', label: 'JSON' }] as const;
const previewModes = [{ value: 'mobile', label: '모바일' }, { value: 'wide', label: '넓게' }] as const;

export function Editor() {
  const [snapshot, setSnapshot] = useState<Snapshot>();
  const [drafts, setDrafts] = useState<Drafts>();
  const [section, setSection] = useState<Section>('profile');
  const [mode, setMode] = useState<'form' | 'json'>('form');
  const [validation, setValidation] = useState<Validation>();
  const [lastPreview, setLastPreview] = useState<PreviewContent>();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [frameReady, setFrameReady] = useState(false);
  const [wide, setWide] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const baseline = snapshot ? formatSettings(snapshot.settings) : undefined;
  const changed = drafts && baseline ? sections.filter(name => drafts[name] !== baseline[name]) : [];
  const dirty = changed.length > 0;
  const signature = drafts ? JSON.stringify(drafts) : '';
  const valid = validation?.signature === signature && !!validation.content;
  const validating = !!drafts && validation?.signature !== signature;

  const load = async () => {
    setBusy(true); setError('');
    try {
      const next = await request<Snapshot>('settings');
      setSnapshot(next); setDrafts(formatSettings(next.settings)); setNotice('로컬 파일을 읽었습니다.');
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    let cancelled = false;
    void request<Snapshot>('settings').then(next => { if (!cancelled) { setSnapshot(next); setDrafts(formatSettings(next.settings)); } }).catch(error => { if (!cancelled) setError(message(error)); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!drafts) return;
    const controller = new AbortController();
    const timer = setTimeout(() => { void (async () => {
      try {
        const settings = parseDrafts(JSON.parse(signature) as Drafts);
        const content = await request<PreviewContent>('validate', 'POST', { settings }, controller.signal);
        if (!controller.signal.aborted) { setValidation({ signature, content }); setLastPreview(content); }
      } catch (error) { if (!controller.signal.aborted) setValidation({ signature, error: message(error) }); }
    })(); }, 450);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [signature, drafts]);
  useEffect(() => {
    if (frameReady && lastPreview) frame.current?.contentWindow?.postMessage({ type: 'link-hub-editor-preview', content: lastPreview }, window.location.origin);
  }, [frameReady, lastPreview]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const save = async () => {
    if (!drafts || !snapshot || !valid || busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await request<{ settings: Settings; revision: string; changed: string[] } & PreviewContent>('settings', 'PUT', { settings: parseDrafts(drafts), revision: snapshot.revision });
      setSnapshot({ ...snapshot, settings: result.settings, revision: result.revision });
      setDrafts(formatSettings(result.settings));
      setNotice(result.changed.length ? `${result.changed.map(name => `${name}.json`).join(' · ')} 저장 완료` : '저장할 변경 사항이 없습니다.');
    } catch (error) { setError(message(error)); }
    finally { setBusy(false); }
  };
  let value: unknown; let syntaxError = '';
  try { value = drafts ? JSON.parse(drafts[section]) : undefined; } catch { syntaxError = 'JSON 문법이 올바르지 않습니다. JSON 편집에서 수정하세요.'; }
  const update = (text: string) => { setNotice(''); setError(''); setDrafts(old => old ? { ...old, [section]: text } : old); };

  return <div className="editor-shell">
    <header className="editor-header"><div className="editor-brand"><span className="editor-mark" aria-hidden="true">✳</span><div><span className="editor-kicker">LINK HUB · LOCAL STUDIO</span><h1>나의 페이지 편집</h1></div></div><div className="header-actions"><span className={`save-state ${dirty ? 'is-dirty' : ''}`}>{dirty ? `${changed.length}개 파일 변경` : '저장된 상태'}</span><button disabled={busy || !snapshot} onClick={() => { if (!dirty || window.confirm('저장하지 않은 초안을 버리고 로컬 파일을 다시 읽을까요?')) void load(); }}>파일 다시 읽기</button><button className="primary-button" disabled={!dirty || !valid || busy} onClick={() => { void save(); }}>{busy ? '처리 중…' : '변경 사항 저장'}</button></div></header>
    <div className="editor-intro"><p>취향을 담고, 연결을 정리하세요.</p><span>미리보기는 자동으로 갱신됩니다. 저장하면 로컬 content 파일에 반영됩니다.</span></div>
    {error && <div className="editor-alert" role="alert">{error}</div>}{notice && <p className="editor-notice" role="status">{notice}</p>}
    {!snapshot || !drafts ? <div className="loading-panel">{error ? <button onClick={() => { void load(); }}>다시 연결</button> : '로컬 설정을 읽고 있습니다…'}</div> : <div className="editor-layout">
      <section className="edit-panel" aria-label="콘텐츠 편집"><nav className="section-tabs" aria-label="편집 영역">{sections.map(name => <button key={name} aria-current={section === name ? 'page' : undefined} onClick={() => setSection(name)}>{sectionLabels[name]}{changed.includes(name) && <span className="tab-dot" aria-label="미저장">•</span>}</button>)}</nav>
        <div className="panel-heading"><div><h2>{sectionLabels[section]}</h2><code>content/{section}.json</code></div><SegmentedControl label="편집 방식" value={mode} options={editorModes} onChange={setMode}/></div>
        <fieldset className="editor-fields" disabled={busy}>{mode === 'json' ? <><label className="json-label" htmlFor="section-json">{section}.json 전체 내용</label><textarea id="section-json" className="json-editor" spellCheck={false} value={drafts[section]} onChange={event => update(event.target.value)}/><button type="button" disabled={!!syntaxError} onClick={() => update(JSON.stringify(value, null, 2))}>JSON 정리</button></> : syntaxError || !value || typeof value !== 'object' || Array.isArray(value) ? <div className="editor-alert">{syntaxError || '영역 설정은 JSON 객체로 작성하세요.'}<button onClick={() => setMode('json')}>JSON 편집 열기</button></div> : <SchemaField schema={snapshot.schemas[section]} value={value} onChange={next => update(JSON.stringify(next, null, 2))} path={section} assets={snapshot.assets}/>}</fieldset>
        <div className="editing-footnote">이미지는 public/에 넣고 경로를 선택하거나 입력하세요. 별표(*)는 필수 항목입니다.</div>
      </section>
      <aside className="preview-panel" aria-label="페이지 미리보기"><div className="preview-heading"><div><span className="editor-kicker">LIVE PREVIEW</span><h2>방문자에게 보이는 모습</h2></div><SegmentedControl label="미리보기 너비" value={wide ? 'wide' : 'mobile'} options={previewModes} onChange={value => setWide(value === 'wide')}/></div>
        <p className={`validation-state ${validation?.error && !validating ? 'has-error' : ''}`} role="status">{validating ? '초안을 검증하고 있습니다…' : valid ? dirty ? '검증 완료 · 저장 전 초안' : '검증 완료 · 저장된 내용' : '입력 오류 · 최근 정상 미리보기 유지'}</p>
        {validation?.signature === signature && validation.error && <pre className="validation-error" role="alert">{validation.error}</pre>}
        {valid && validation.content!.warnings.length > 0 && <details className="validation-warnings"><summary>확인할 안내 {validation.content!.warnings.length}개</summary><ul>{validation.content!.warnings.map(text => <li key={text}>{text}</li>)}</ul></details>}
        <div className={`preview-stage ${wide ? 'is-wide' : ''}`}><iframe ref={frame} src={`${editorBase}/preview`} title="저장 전 페이지 미리보기" sandbox="allow-scripts allow-same-origin" onLoad={() => { setFrameReady(true); if (lastPreview) frame.current?.contentWindow?.postMessage({ type: 'link-hub-editor-preview', content: lastPreview }, window.location.origin); }}/></div><p className="preview-note">미리보기 안에서는 외부 링크로 이동하지 않습니다.</p>
      </aside>
    </div>}
  </div>;
}
