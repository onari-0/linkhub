import { useId } from 'react';
import { seed, selectVariant, changeVariant, type Schema } from './model';

const labels: Record<string, string> = {
  name: '이름', caption: '상단 문구', eyebrow: '보조 문구', bio: '소개', avatar: '프로필 이미지', avatarAlt: '프로필 이미지 설명', tags: '관심사', tagsLabel: '관심사 안내',
  socials: 'SNS', items: '목록', title: '제목', label: '표시 이름', description: '설명', id: '고유 ID', url: '직접 주소', destination: '공통 목적지 참조', platform: '아이콘',
  enabled: '화면에 표시', openInNewTab: '새 탭에서 열기', image: '이미지 경로', imageAlt: '이미지 설명', imageFit: '이미지 맞춤', imagePosition: '이미지 위치', variant: '카드 형태',
  brand: '브랜드', keywords: '검색 키워드', sponsored: '광고·제휴', sponsoredLabel: '광고 배지 문구', disclosure: '광고 안내', search: '검색 설정', minItems: '검색창 표시 기준 개수',
  placeholder: '입력 안내', clearLabel: '지우기 버튼 안내', noResults: '결과 없음 안내', resultTemplate: '결과 개수 문구', emptyMessage: '빈 목록 안내', message: '메시지', signature: '서명',
  language: '문서 언어', seo: '검색·공유 정보', theme: '디자인', destinations: '공통 목적지', resources: '이미지·생성 설정', copy: '공유·접근성 문구',
  colors: '색상', platforms: '플랫폼 색상', typography: '글자 크기', spacing: '간격', background: '배경색', surface: '카드 배경', text: '본문 색', muted: '보조 글자 색', accent: '강조색', accentSoft: '연한 강조색', border: '테두리 색',
  badgeBackground: '배지 배경', badgeText: '배지 글자', shadow: '그림자 색', foreground: '아이콘 색', preset: '배경 스타일', font: '글꼴', contentWidth: '콘텐츠 최대 너비', cardRadius: '카드 둥글기', featuredRatio: '큰 이미지 비율',
  cardGap: '카드 간격', sectionGap: '섹션 간격', cardPadding: '카드 여백', body: '본문', small: '작은 글자', favicon: '파비콘', logo: '상단 로고', ogGeneration: '공유 이미지 생성', source: '생성 원본', width: '너비', height: '높이', fit: '맞춤', position: '위치'
};
const fieldLabel = (key: string) => labels[key] ? `${labels[key]} · ${key}` : key;
type Props = { schema: Schema; value: unknown; onChange(value: unknown): void; path: string; assets: string[]; depth?: number };

export function SchemaField({ schema, value, onChange, path, assets, depth = 0 }: Props) {
  const id = useId();
  const helpId = `${id}-help`;
  if (schema.oneOf) {
    const current = selectVariant(schema, value);
    return <div className="schema-union"><label htmlFor={id}>카드 형태<select id={id} value={schema.oneOf.indexOf(current)} onChange={event => onChange(changeVariant(schema.oneOf![Number(event.target.value)], value))}>{schema.oneOf.map((option, i) => <option key={i} value={i}>{option.properties?.variant?.const === 'featured' ? '큰 이미지 카드 · featured' : '기본 카드 · compact'}</option>)}</select></label><SchemaField schema={current} value={value} onChange={onChange} path={path} assets={assets} depth={depth}/></div>;
  }
  if (schema.type === 'object') {
    const object = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
    const properties = schema.properties ?? {};
    const dynamic = typeof schema.additionalProperties === 'object' ? schema.additionalProperties : undefined;
    const visible = dynamic ? Object.keys(object) : Object.keys(properties).filter(key => Object.hasOwn(object, key) || schema.required?.includes(key) || properties[key].default !== undefined);
    const missing = Object.keys(properties).filter(key => !visible.includes(key));
    const body = <div className="schema-object">
      {visible.map(key => {
        const child = properties[key] ?? dynamic;
        if (!child || child.const !== undefined) return null;
        const removable = !schema.required?.includes(key) && Object.hasOwn(object, key);
        return <div className="schema-field" key={key}>
          <div className="field-heading"><span>{fieldLabel(key)}{schema.required?.includes(key) && <span className="required-mark"> *</span>}{!Object.hasOwn(object, key) && <small>기본값</small>}</span>{removable && <button type="button" className="quiet-button" aria-label={`${path}.${key} 생략`} onClick={() => { const next = { ...object }; delete next[key]; onChange(next); }}>생략</button>}</div>
          <SchemaField schema={child} value={object[key] ?? child.default} onChange={next => onChange({ ...object, [key]: next })} path={`${path}.${key}`} assets={assets} depth={depth + 1}/>
        </div>;
      })}
      {missing.length > 0 && <label className="add-property">선택 항목 추가<select aria-label={`${path} 선택 항목 추가`} value="" onChange={event => { const key = event.target.value; if (key) onChange({ ...object, [key]: seed(properties[key], key) }); }}><option value="">추가할 설정 선택</option>{missing.map(key => <option key={key} value={key}>{fieldLabel(key)}</option>)}</select></label>}
      {dynamic && <form className="record-add" onSubmit={event => {
        event.preventDefault(); const form = event.currentTarget; const key = String(new FormData(form).get('key') ?? '').trim();
        if (!/^[a-z][a-z0-9-]*$/.test(key) || Object.hasOwn(object, key)) return;
        onChange({ ...object, [key]: seed(dynamic) }); form.reset();
      }}><label>목적지 ID<input name="key" required pattern="[a-z][a-z0-9-]*" placeholder="my-shop" aria-label={`${path} 새 목적지 ID`}/></label><button type="submit">목적지 추가</button></form>}
    </div>;
    return depth === 0 ? body : <details className="field-group" open={depth < 2}><summary>{schema.description ?? '설정 펼치기'}</summary>{body}</details>;
  }
  if (schema.type === 'array') {
    const values = Array.isArray(value) ? value : [];
    return <div className="schema-array"><p className="field-help">{schema.description}</p>{values.length === 0 && <p className="empty-list">목록이 비어 있습니다.</p>}{values.map((item, index) => {
      const object = item && typeof item === 'object' ? item as Record<string, unknown> : null;
      return <div className="array-item" key={index}>
        <div className="item-toolbar"><strong>{index + 1}. {object ? String(object.title ?? object.label ?? object.id ?? '새 항목') : '항목'}</strong><div><button type="button" disabled={index === 0} aria-label={`${path} ${index + 1}번 위로`} onClick={() => { const next = [...values]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; onChange(next); }}>↑</button><button type="button" disabled={index === values.length - 1} aria-label={`${path} ${index + 1}번 아래로`} onClick={() => { const next = [...values]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; onChange(next); }}>↓</button><button type="button" aria-label={`${path} ${index + 1}번 삭제`} onClick={() => onChange(values.filter((_, i) => i !== index))}>삭제</button></div></div>
        <SchemaField schema={schema.items ?? { type: 'string' }} value={item} onChange={next => onChange(values.map((old, i) => i === index ? next : old))} path={`${path}.${index}`} assets={assets} depth={depth + 1}/>
      </div>;
    })}<button type="button" className="add-item" disabled={schema.maxItems !== undefined && values.length >= schema.maxItems} onClick={() => onChange([...values, seed(schema.items ?? { type: 'string' })])}>＋ 항목 추가</button></div>;
  }
  const help = schema.description && <p className="field-help" id={helpId}>{schema.description}</p>;
  const a11y = { 'aria-label': path, 'aria-describedby': schema.description ? helpId : undefined };
  if (schema.type === 'boolean') return <label className="checkbox-field"><input {...a11y} type="checkbox" checked={value === true} onChange={event => onChange(event.target.checked)}/>{value === true ? '켜짐' : '꺼짐'}{help}</label>;
  if (schema.enum) return <><select {...a11y} value={String(value ?? '')} onChange={event => onChange(event.target.value)}>{schema.enum.map(option => <option key={option} value={option}>{option}</option>)}</select>{help}</>;
  if (schema.type === 'number' || schema.type === 'integer') return <><input {...a11y} type="number" min={schema.minimum} max={schema.maximum} step={schema.type === 'integer' ? 1 : 'any'} value={typeof value === 'number' ? value : ''} onChange={event => onChange(event.target.value === '' ? undefined : Number(event.target.value))}/>{help}</>;
  const string = typeof value === 'string' ? value : '';
  const image = /\.(avatar|image|logo|favicon|source)$/.test(path);
  const color = schema.pattern?.startsWith('^#');
  return <>{color && <input className="color-picker" type="color" aria-label={`${path} 색상 선택`} value={/^#[a-f\d]{6}$/i.test(string) ? string : '#000000'} onChange={event => onChange(event.target.value)}/>}{/\.(bio|description|message)$/.test(path) ? <textarea {...a11y} rows={3} maxLength={schema.maxLength} value={string} onChange={event => onChange(event.target.value)}/> : <input {...a11y} type="text" list={image ? id : undefined} maxLength={schema.maxLength} value={string} onChange={event => onChange(event.target.value)}/>} {image && <datalist id={id}>{assets.map(asset => <option key={asset} value={asset}/>)}</datalist>}{help}</>;
}
