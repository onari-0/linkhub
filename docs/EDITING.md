# 섹션별 콘텐츠 편집

수정하는 설정 파일은 다섯 개다. 각 화면 섹션의 제목·문구·목록·노출 옵션은 같은 파일에서 관리하며, 공통 설정은 site.json에 모았다. 형식·필드 설명·기본값·선택지는 스키마로 안내하고, 설정 조합은 이 문서에서 설명한다. 별도 예시 설정 파일은 유지하지 않는다.

| 파일 | 담당 내용 |
|---|---|
| content/site.json | 언어·SEO·테마·공통 목적지·리소스 생성·공유 UI 문구 |
| content/profile.json | 상단 문구·이름·소개·아바타·관심사·SNS |
| content/links.json | 기본 링크 영역 제목·문구·카드 목록 |
| content/products.json | 상품 영역 제목·소개·광고 표시·검색 설정·상품 목록 |
| content/footer.json | 푸터 표시 여부·메시지·서명 |

각 파일에 영역 이름으로 한 번 더 감싸는 키를 넣지 않는다. 예를 들어 products.json에는 바로 `title`, `search`, `items`를 작성한다.

## 현재 반영한 콘텐츠

2026-10-25에 [오나리 Linktree](https://linktr.ee/Orina0)의 문구·이미지·목적지를 확인해 반영했다. 페이지 구성은 기존 컴포넌트를 사용하며 Linktree의 가입 배너·서비스 푸터는 가져오지 않는다.

- `profile.json`: 이름은 오나리, `bio`에는 원본의 이모티콘·줄바꿈·해시태그를 그대로 넣었다. 해시태그가 중복되지 않도록 `tags: []`, 상단 샘플 문구는 `caption: ""`, `eyebrow`는 생략했다. `avatar`는 `media/onari-avatar.jpg`다.
- `links.json`: 기존 ID와 Instagram → TikTok → YouTube 순서를 유지한다. 원본에 없는 카드 설명·배지를 제거하고 Instagram의 큰 이미지와 TikTok/YouTube 썸네일을 지정했다. 섹션 탐색 제목은 `SNS`, 보조 문구는 빈 값이다. SNS와 카드의 `openInNewTab`은 원본처럼 true다.
- `site.json`: `seo.description`을 원본 소개에 맞추고 `resources.ogGeneration.source`를 `media/onari-instagram.jpg`로 변경했다. 기존 `theme` 필드로 분홍색 배경·카드 색상과 글자 크기를 조정했다. `seo.image`는 `media/onari-og.jpg`이며 `npm run media:generate`로 1200×630 JPEG 공유 이미지를 만든다.
- `footer.json`: 원본에 없는 샘플 서명을 없애고 `enabled: false`로 숨긴다. `products.json`의 빈 운영 목록은 유지한다.

프로필·카드 이미지의 파일명과 원본 URL은 [리소스 문서](ASSETS.md)에 기록했다. 외부 이미지를 런타임에 불러오지 않으며, 샘플 SVG는 테스트 픽스처에서 계속 사용하되 운영 배포에는 포함하지 않는다. `npm run check`와 빌드 검사를 마친 뒤 모바일·데스크톱에서 이미지 4개, 소개 줄바꿈, SNS/카드의 실제 주소와 새 탭 동작을 확인한다.

## 로컬 편집 화면

프로젝트 폴더에서 실행한다. 이미 npm run dev 서버가 켜져 있으면 같은 서버의 편집 주소를 열면 된다.

```sh
cd /Users/bright/Desktop/work/linkhub
npm run editor
```

기본 주소는 `http://127.0.0.1:5173/__editor/`다. 일반 페이지는 같은 서버의 `/`에서 확인하며, 상단의 ‘페이지 편집’ 버튼으로 편집 화면에 이동할 수 있다. 이 버튼은 npm run dev/editor의 일반 페이지에만 표시하고 편집기 안의 방문자 미리보기에는 표시하지 않는다. 정적 빌드·npm run preview·GitHub Pages에서는 버튼과 편집기 모두 제외한다. 서버 종료는 터미널의 Ctrl+C다. LAN 공개 호스트(0.0.0.0 등)로 개발 서버를 실행하지 못하도록 제한한다.

화면 너비가 761px 이상이면 왼쪽 편집 항목과 오른쪽 방문자 미리보기를 각각 독립적으로 스크롤한다. 저장 버튼·영역 탭·폼/JSON 전환과 미리보기 도구는 화면에 남고, 각 내용 영역만 움직인다. 마우스나 트랙패드를 스크롤할 영역 위에 놓고 사용한다. 긴 검증 오류·안내 목록도 해당 상자 안에서 스크롤할 수 있다. 760px 이하에서는 편집과 미리보기를 위아래로 배치하고 페이지 전체를 스크롤하며, 미리보기 안의 내용은 별도로 스크롤한다.

두 열 화면에서는 상단 소개를 숨기고 도구의 여백을 줄여 미리보기 높이를 확보한다. 모바일/넓게 전환은 너비만 바꾸며 높이는 남은 화면을 사용한다. 켜짐·꺼짐 항목은 입력 폼/JSON과 같은 공통 선택 버튼을 사용하고 선택된 쪽을 색으로 표시한다. Tab으로 버튼에 이동하고 Space 또는 Enter로 선택할 수 있다. 저장 값은 기존 true/false이며, 생략된 기본값에서 이미 선택된 버튼을 다시 눌러도 새 값을 쓰지 않는다.

레이아웃을 확인하려면 긴 디자인/공통 폼이나 JSON을 연 뒤 왼쪽을 스크롤하고, 오른쪽 미리보기 위치가 유지되는지 확인한다. 이어서 미리보기를 스크롤해 왼쪽 위치가 유지되는지 확인한다. 작은 화면에서는 마지막 편집 항목과 아래 미리보기까지 이동할 수 있는지 확인한다.

1. 프로필·기본 링크·상품·디자인/공통·푸터 중 편집 영역을 선택한다.
2. 입력 폼으로 문구·이미지 경로·노출 여부 등을 수정한다. 목록에는 추가·삭제·위/아래 순서 변경 버튼이 있다. 카드 형태를 변경해도 ID와 공통 필드를 유지하며, 새 형태에서 지원하지 않는 필드는 제거한다.
3. 생략한 선택 필드는 ‘선택 항목 추가’로 넣는다. ‘생략’은 JSON에서 필드를 제거하므로 기본값이 적용될 수 있다. 예를 들어 caption을 숨기려면 생략 대신 빈 문자열로 지정한다. ‘기본값’ 표시는 파일에 없는 값을 화면에서 안내하는 것이며, 저장할 때 모든 기본값을 강제로 추가하지 않는다.
4. JSON 모드에서는 선택한 파일 전체를 편집할 수 있다. 폼/JSON·영역 전환은 초안을 유지한다. 스키마 설명은 폼에서도 함께 보여주며, 공통 목적지 ID 추가와 중첩 설정도 지원한다.
5. 약 0.45초 후 전체 초안을 서버에서 검증하고 오른쪽 미리보기를 갱신한다. 미리보기에는 운영 페이지와 같은 Page 컴포넌트를 사용한다. 모바일/넓게 전환과 상품 검색을 시험할 수 있으며 외부 링크 이동은 차단한다.
6. ‘변경 사항 저장’을 누르면 전체 초안을 다시 검증하고 실제로 변경한 content/*.json만 저장한다. 저장 전에는 파일을 바꾸지 않는다. 별도 예시 설정이나 편집기용 콘텐츠 파일을 만들지 않는다.

검증은 JSON 문법·5개 영역 스키마·교차 파일 목적지/ID·노출 이미지 존재/실제 형식·용량을 포함한다. 오류가 있으면 위치를 표시하고 저장 버튼을 비활성화하며 최근 정상 미리보기를 유지한다. 안내 경고는 저장을 막지 않는다. 원래 비어 있는 상품 목록은 미리보기에서도 영역 전체를 숨긴다.

다른 창이나 외부 편집기에서 파일을 바꾸면 저장 시 충돌 오류가 나온다. 현재 초안을 JSON 모드에서 복사해 둔 뒤 ‘파일 다시 읽기’로 최신 파일을 가져와 병합한다. 서버는 읽을 때의 파일 revision이 맞는 경우에만 저장하고, 변경 파일은 임시 파일에서 교체한다. 일반적인 쓰기 실패 시 이미 쓴 파일은 원래 내용으로 복구한다. Git 커밋이나 장기 백업을 자동 생성하지는 않는다.

초안은 현재 탭의 메모리에만 보관한다. 미저장 변경이 있는 탭을 닫거나 새로고침하면 브라우저가 경고한다. ‘파일 다시 읽기’는 확인 후 초안을 버린다. 서버 재시작 뒤 연결 오류가 나오면 필요한 초안을 복사하고 편집 화면을 새로고침한다.

이미지 업로드 기능은 제공하지 않는다. 파일을 public/에 넣은 후 ‘파일 다시 읽기’로 이미지 경로 후보를 갱신하거나 직접 경로를 입력한다. 후보에는 현재 페이지에서 사용하지 않는 이미지도 포함한다. 이미지 파일 자체나 OG 생성 결과는 저장 버튼으로 생성·수정하지 않으며, 생성 원본을 바꿨다면 기존 `npm run media:generate` 명령도 실행한다.

BASE_PATH를 설정했다면 편집 주소에도 같은 접두사를 붙인다. 예: `BASE_PATH=/link-hub/ npm run dev` → `/link-hub/__editor/`. npm run editor의 자동 열기는 기본 루트 주소용이므로 하위 경로에서는 해당 주소를 직접 연다. 저장 후 Git 커밋·push·배포는 기존 절차대로 진행한다.

## 스키마 안내와 기본값

JSON Schema가 연결된 편집기에서는 필드 자동완성, 설명, 선택지, 필수 여부, 길이·범위, 기본값을 확인할 수 있다. 생성 파일인 schemas/*.schema.json을 직접 수정하지 말고 src/lib/schema.ts를 바꾼 뒤 `npm run schema:generate`를 실행한다. `npm run check`는 생성 파일의 동기화도 확인한다.

기본값은 필드를 생략했을 때 적용한다. 빈 문자열은 그 필드가 허용하는 경우에만 사용한다. 예를 들어 caption을 생략하면 기본 문구가 나오고, 빈 문자열로 지정하면 숨긴다. ID 중복·존재하지 않는 목적지 참조·이미지 파일의 실제 해석은 `npm run validate`에서 함께 검사한다.

| 바꾸려는 동작 | 수정 방법 |
|---|---|
| 프로필 소개·아바타 숨김 | bio·avatar 생략 |
| 상단 기본 문구 숨김 | caption을 빈 문자열로 설정 |
| SNS 숨김 | socials.items를 빈 배열로 설정 |
| 기본 링크가 없을 때 안내 | links.json의 emptyMessage 수정 |
| 상품 영역 숨김 | products.json의 items를 빈 배열로 설정 |
| 푸터 문구를 유지하면서 숨김 | footer.json의 enabled만 false로 설정 |

프로필 정보를 최소화하려면 profile.json을 다음처럼 작성할 수 있다. 공유 버튼과 상단 아이콘은 공통 UI로 유지된다.

```json
{
  "name": "나의 이름",
  "caption": "",
  "socials": { "items": [] }
}
```

## 상품 추가와 검색

`content/products.json`의 `items` 배열에 항목을 추가한다. 실제 목적지 주소와 운영할 상품으로 바꿔 사용한다.

```json
{
  "id": "ad-cushion-01",
  "title": "포근한 쿠션",
  "brand": "브랜드 이름",
  "description": "짧은 상품 소개",
  "url": "https://example.com/product/cushion",
  "image": "media/products/cushion.webp",
  "imageAlt": "크림색 쿠션",
  "imageFit": "cover",
  "imagePosition": "center",
  "keywords": ["쿠션", "선물", "인테리어"],
  "enabled": true,
  "sponsored": true,
  "openInNewTab": true
}
```

- 상품이 없거나 전부 `enabled: false`이면 영역 전체를 표시하지 않는다.
- `search.minItems` 이상의 **노출 상품**이 있을 때 검색창을 표시한다. 기본값은 6이며 1~1000 사이의 정수다.
- 검색 결과 수가 줄어도 검색창은 유지된다. 검색 결과가 없으면 안내를 표시하고 지우기 버튼으로 전체 목록에 돌아갈 수 있다.
- 제목·브랜드·설명·keywords를 검색한다. 공백으로 나눈 여러 단어는 모두 포함되어야 한다. 영문 대소문자와 전각 문자를 정규화한다. 초성·오타 보정 검색은 포함하지 않는다.
- 검색어는 브라우저 메모리에서만 사용한다. 서버 전송·분석 이벤트 전송·저장을 하지 않는다.
- 광고·제휴 항목은 `sponsored: true`로 정의한다. 기본값은 true이며 배지와 링크의 sponsored 관계를 적용한다. 설명 문구와 배지는 같은 파일의 `disclosure`, `sponsoredLabel`로 바꾼다.
- 배열 순서가 표시 순서다. 기존 id는 제목·순서가 바뀌어도 유지한다.
- 이미지를 생략해도 상품 링크는 표시되며 일반 아이콘을 사용한다.

상품 검색 테스트용 항목 8개는 `tests/fixtures/products.json`에서 관리한다. 테스트가 실제 스키마로 파싱해 검색·초기화 동작을 검증한다. 운영 상품은 `content/products.json`에서 별도로 관리하며 기본 목록은 비어 있다.

## 기본 링크와 공통 목적지

`content/links.json`의 `items`에 compact 또는 featured 카드를 추가한다.

```json
{
  "id": "my-website",
  "title": "나의 홈페이지",
  "description": "더 많은 이야기",
  "url": "https://example.com/",
  "variant": "compact"
}
```

이미지형 카드를 추가하려면 links.json의 items에 다음 항목을 넣는다. imageAlt는 필수이며, imageFit/imagePosition으로 크롭을 조정한다.

```json
{
  "id": "featured-news",
  "title": "새로운 소식",
  "url": "https://example.com/news",
  "variant": "featured",
  "image": "media/featured.svg",
  "imageAlt": "새 소식을 소개하는 일러스트",
  "imageFit": "contain",
  "imagePosition": "top"
}
```

링크의 enabled는 기본 true, openInNewTab은 기본 false다. featured는 image와 imageAlt가 필수이며 label, imageFit, imagePosition을 추가할 수 있다. compact에 label을 넣으면 보이지 않는 설정을 방지하기 위해 검증에서 거부한다. compact의 작은 이미지는 선택 사항이다.

여러 곳에서 같은 주소를 쓰면 `content/site.json`의 `destinations`에 한 번 정의한다.

```json
"instagram": {
  "platform": "instagram",
  "label": "Instagram",
  "url": "https://www.instagram.com/onari.0"
}
```

프로필의 SNS와 기본 카드에서 `"destination": "instagram"`으로 참조한다. 개별 항목에 url을 넣으면 위치별 주소를 덮어쓸 수 있다. platform을 생략하면 공통 목적지의 아이콘을 사용하고, 직접 URL만 정의하면 website를 사용한다. 지원 플랫폼은 instagram, tiktok, youtube, website다.

SNS·기본 링크·상품의 id는 전체에서 유일해야 한다. URL은 인증 정보가 없는 HTTPS 주소를 사용한다.

## 프로필과 푸터

profile.json에는 이름과 선택적인 caption, eyebrow, bio, avatar, avatarAlt, tags, tagsLabel, socials를 정의한다. 소개·보조 문구·아바타를 생략하면 해당 요소를 숨긴다. 태그는 최대 6개, 각 24자이며 중복을 허용하지 않는다. 이름은 최대 60자이며 입력한 이름 그대로 표시한다. 이름 뒤에 마침표를 자동 추가하지 않으므로 원하는 문장부호는 name 값에 직접 넣는다. socials는 같은 파일의 `socials.items` 배열에서 관리한다.

footer.json의 enabled를 false로 설정하면 푸터를 숨긴다. message와 signature는 각각 생략하거나 빈 문자열로 둘 수 있다.

## 이미지와 브랜드 리소스

이미지는 `public/` 아래에 넣고 `media/products/cushion.webp`처럼 선행 `/` 없이 작성한다. 영문·숫자·하이픈·밑줄로 하위 폴더를 사용할 수 있다. SVG, PNG, JPG/JPEG, WEBP, AVIF를 지원한다. 외부 URL·상위 경로(..)·public 밖을 가리키는 심볼릭 링크는 허용하지 않는다.

site.json의 `resources.favicon`과 선택적인 `resources.logo`로 파비콘과 상단 로고를 지정한다. 카드는 cover/contain과 center/top/bottom/left/right를 지원한다. 공유 이미지는 site.json의 seo.image에 정의하고 PNG/JPG/WEBP를 사용한다. 별도의 seo.imageAlt도 지정할 수 있다.

페이지 배경 이미지는 같은 `site.json`의 선택 필드 `resources.backgroundImage`로 지정한다. 기본값은 없으며 생략하면 기존 색상·프리셋 배경을 사용한다. 이미지 형식과 경로 제약·용량 검사는 다른 이미지와 같고 사용한 배경 파일만 배포한다.

1. 파일을 `public/media/background.webp` 같은 위치에 넣는다.
2. 편집기의 디자인·공통 → 이미지·생성 설정에서 ‘선택 항목 추가’로 ‘배경 이미지 · backgroundImage’를 추가한다.
3. 이미지 경로를 선택하거나 `media/background.webp`를 입력한다. JSON에서는 `resources` 안에 `"backgroundImage": "media/background.webp"`를 추가한다.
4. 배경은 화면 전체를 중앙 기준 cover로 채우고 스크롤할 때 고정된다. 미리보기에서 글자·카드가 잘 보이는지 확인한 뒤 저장한다. 배경 이미지를 없애려면 ‘생략’으로 필드를 제거한다.

배경은 공유 이미지(seo.image)와 별개이며, 배경을 바꿔도 공유 이미지를 자동 합성하거나 교체하지 않는다. 새 필드가 보이지 않는 기존 편집 탭은 필요한 미저장 내용을 저장한 뒤 새로고침해 최신 스키마를 읽는다.

`npm run validate`는 파일 존재·실제 이미지 해석·형식 일치·픽셀 상한·20MB 용량 상한을 검사한다. 500KB를 넘는 파일과 권장 공유 크기(1200×630) 불일치는 경고로 안내한다.

## 공유 이미지 생성

site.json의 `resources.ogGeneration`에 원본·크기·fit·position을 정의한다. 출력 경로와 포맷은 seo.image를 따른다.

```sh
npm run media:generate
```

생성한 이미지도 변경 파일에 포함한다. 수동 공유 이미지를 쓰려면 ogGeneration을 생략한다. 원본과 출력 경로는 같을 수 없다.

## 테마와 편집 도구

테마는 site.json의 theme 안에서 관리한다. 기본 색상, 플랫폼별 색상, 배지, 그림자, 글자 크기, 간격, 카드 비율·둥글기·최대 너비를 수정할 수 있다. 색은 #RRGGBB다. 낮은 글자 대비는 경고로 안내한다. SVG 일러스트 내부의 색은 이미지 자체의 일부여서 테마와 별도로 수정한다.

### 밝은 체크 배경에 맞춘 추천 팔레트

사용자가 추가한 `media/onari-backgroung.jpeg`는 흰색에 가까운 연분홍·하늘색 체크다. 현재 자주색 카드보다 흰 카드와 푸른 회색 글자가 배경·프로필 이미지의 하늘색에 자연스럽게 연결된다. 아래 값은 검토용 추천이며 운영 설정에 자동 적용하지 않았다. 편집 위치는 디자인·공통 → 디자인 → 색상이다.

| theme.colors 필드 | 추천 값 | 용도 |
|---|---|---|
| background | #F7FAFC | 배경 이미지가 없을 때의 바탕색 |
| surface | #FFFFFF | 카드·공유 패널·입력창 |
| text | #33424D | 제목·본문 |
| muted | #61717C | 설명·보조 문구 |
| accent | #527A93 | 강조·포커스·아이콘 |
| accentSoft | #EAF2F7 | 아이콘의 연한 바탕 |
| border | #DCE6EC | 카드 경계 |
| badgeBackground | #F6EAF0 | 배지 바탕 |
| badgeText | #875C72 | 배지 글자 |
| shadow | #8197A6 | 옅은 그림자 기준색 |

TikTok/YouTube 아이콘은 디자인 → 플랫폼 색상에서도 별도로 바꾼다. `theme.platforms.tiktok`은 background=#F6EAF0 / foreground=#875C72, `theme.platforms.youtube`는 background=#EAF2F7 / foreground=#527A93을 권장한다. 이 값을 바꾸지 않으면 기존 플랫폼별 자주색 바탕이 남는다.

배경 스타일은 현재 `paper`를 유지한다. 카드 둥글기는 24, 카드 간격은 14로 조금 정돈하고, 최대 너비 540과 현재 글자 크기는 유지하는 조합으로 검토했다. 흰 카드 위의 기본 글자 대비는 약 10.36:1, 보조 글자는 약 5.05:1이다. 이미지 배경의 픽셀별 대비를 보장하는 수치는 아니므로 실제 모바일·데스크톱 화면도 함께 확인한다.

VS Code 계열 편집기에서는 다섯 파일에 연결한 JSON Schema로 자동완성과 오류 표시를 제공한다. 스키마 코드를 변경한 경우 `npm run schema:generate`로 생성 파일을 갱신한다. CLI는 교차 파일 목적지 참조와 ID 중복도 검사한다. 오류 메시지는 해당 파일과 필드를 표시한다.

## 테스트 데이터 관리

운영 설정을 복제한 예시 파일을 늘리지 않는다. 검색처럼 여러 항목이 필요한 동작은 `tests/fixtures/products.json`의 가상 데이터로 검증한다. 이 데이터는 tests/products.test.tsx에서 실제 스키마를 통과한 후 사용하며 애플리케이션에서 읽지 않는다.

```sh
npm test -- tests/products.test.tsx
```

상품 구조를 변경하면 해당 픽스처와 테스트를 함께 갱신한다. 상품 테스트 데이터의 주소와 문구는 동작 검증용이며, 운영 항목을 추가할 때는 실제 상품 정보를 작성한다. 빈 목록·검색 기준 미만·정확히 기준 개수·숨김 상품은 별도 경계 테스트가 담당한다.

## 배포 범위

노출 항목만 브라우저 데이터에 포함하고 사용 중인 이미지·파비콘·공유 이미지만 빌드에 내보낸다. 미사용 public 파일은 안내에 표시하며 배포하지 않는다. 생성 원본은 화면에서도 쓰는 경우에만 내보낸다. 원본 JSON이나 Git 저장소를 공개하는 일은 빌드 결과 배포와 별개다.

수정 후 `npm run check`, `npm run build`, `npm run verify:build`를 실행한다. GitHub Pages는 빌드와 배포가 완료되어야 공개 페이지에 반영된다. language는 문서 언어이며 UI를 자동 번역하지 않는다.

최초 배포의 저장소 연결·Pages 설정·공개 주소 확인은 [배포 가이드](DEPLOYMENT.md)의 체크리스트를 따른다. 프로필·SNS·SEO·이미지의 운영 값을 확인하고, 공유 이미지 원본을 바꾼 경우 생성한 출력 파일도 함께 커밋한다. 상품 목록이 비어 있으면 배포 후에도 상품 영역은 표시하지 않는다.

현재 저장소는 `onari-0/linkhub`이며 기본 Pages 주소는 `https://onari-0.github.io/linkhub/`다. 저장소 경로는 `/linkhub/`이므로 `/link-hub/` 예시와 구분한다. `content/site.json`에 공개 주소 필드를 추가할 필요는 없으며, 배포 시 Pages가 반환하는 URL과 경로를 사용한다. 로컬 확인 예시는 다음과 같다.

```sh
BASE_PATH=/linkhub/ SITE_URL=https://onari-0.github.io/linkhub/ npm run build
BASE_PATH=/linkhub/ SITE_URL=https://onari-0.github.io/linkhub/ npm run verify:build
BASE_PATH=/linkhub/ npm run preview
```

`Read the actual Pages URL`에서 `Get Pages site failed`와 `Not Found`가 발생하면 저장소 관리자가 Settings → Pages → Source를 **GitHub Actions**로 설정한 뒤 배포를 다시 실행한다. JSON 편집이나 액션의 SHA를 버전 태그로 바꾸는 것만으로 Pages가 활성화되지는 않는다. 배포 성공 후 출력된 `page_url`에서 화면·이미지·공유 주소를 확인한 다음 외부에 공유한다.
