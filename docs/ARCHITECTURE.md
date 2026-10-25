# 구조와 설계 결정

설정 파일은 공통·프로필/SNS·기본 링크·상품·푸터의 다섯 파일이다. 제목·문구·목록을 섹션별로 함께 관리하며 테마·SEO·공통 목적지·리소스·공유 UI는 공통 파일에 둔다.

```text
content/{site,profile,links,products,footer}.json
       ↓ 파일별 Zod 검증 + 교차 파일 참조/ID 검사
       ↓ 목적지 해석·기본값·문구 정리 + 실제 이미지 검사
       ├─ HTML 메타데이터
       ├─ virtual:link-hub-content → React
       └─ 사용 중인 파일만 정적 자산으로 내보냄
                     ↓
                  dist/ → GitHub Pages
```

공개 페이지와 HTML 메타데이터는 같은 검증·정규화 결과를 사용한다. Zod와 Sharp는 개발/빌드에서만 사용한다. 공개 페이지에는 런타임 fetch, 서버, 데이터베이스, 라우터, 전역 상태 라이브러리가 없다. 로컬 편집기만 개발 서버의 API를 사용한다. 데이터의 안정적인 ID와 표시 순서는 별개다.

## 설정과 자산

`src/lib/schema.ts`에서 파일별 편집 스키마와 통합 데이터 계약을 정의한다. `scripts/content-validation.ts`가 다섯 파일을 읽고 오류의 파일/필드를 알려준다. JSON Schema는 필드 설명·기본값·선택지를 담아 같은 Zod 정의에서 생성하고 CI에서 동기화를 확인한다. 설정 예시 파일을 복제하지 않으며 사용 조합은 편집 가이드에 둔다. 상품 테스트 픽스처(tests/fixtures/products.json)는 실제 스키마로 파싱해 검색 UI 테스트에서 사용한다.

공통 목적지는 SNS와 카드에서 재사용하되 URL/플랫폼을 개별적으로 덮어쓸 수 있다. profile, socials, links, products는 렌더링에 적합한 형태로 정규화된다. 컴포넌트에서 원본 JSON을 타입 단언해 읽지 않는다.

Vite publicDir 자동 복사를 사용하지 않는다. plugin의 generateBundle에서 노출 항목이 참조하는 자산만 emit한다. 개발 서버도 허용된 자산만 제공한다. 숨긴 항목과 목적지 레지스트리는 공개 데이터에서 제외하며, 미사용 파일은 배포하지 않는다. 숨긴 항목의 이미지도 배포 전 검사 대상에서 제외하므로 더 이상 쓰지 않는 파일을 제거할 수 있다.

이미지는 Sharp로 메타데이터·실제 해석·형식 일치를 검사한다. 40MP/20MB 상한을 적용하고 큰 용량/OG 크기/테마 대비는 경고로 제공한다. 생성 원본은 검증하지만 다른 화면에서 쓰지 않으면 공개하지 않는다. 공유 이미지 생성은 resources.ogGeneration을 읽고 seo.image의 경로·포맷으로 출력한다.

## 화면과 검색

App은 virtual module의 site/theme를 Page에 전달한다. Page는 테마 CSS 변수를 적용하고 ProfileHeader, SocialLinks, LinkCard, ProductSection, ShareButton을 조합한다. 하위 컴포넌트도 props로 데이터를 받아 로컬 편집기의 검증된 초안을 같은 UI로 렌더링할 수 있다. 기본 링크 아래의 상품 섹션은 노출 항목이 없으면 null을 반환한다. 결과 없음은 검색 결과의 상태이며 빈 원본 목록과 구분한다.

검색창의 표시 기준은 필터링 전 노출 상품 수 >= search.minItems다. 숨김 상품은 기준에 포함하지 않는다. 결과 수가 적어져도 검색창을 유지한다. 기준 미만으로 목록이 바뀌면 이전 검색어를 무시해 숨은 검색 상태가 항목을 가리지 않게 한다.

검색은 NFKC 정규화, 대소문자/공백 정리 후 제목·브랜드·설명·키워드의 모든 토큰 포함 여부를 계산한다. 검색어는 전송하거나 저장하지 않는다. 실제 검색창, label, 지우기, 결과 상태 안내, 키보드 포커스를 지원한다.

링크는 실제 앵커이며 광고 상품에는 sponsored 관계와 표시를 적용한다. 분석은 공통 track 함수로 호출하고 이동을 기다리게 하지 않는다. 상품 클릭은 placement/variant=product와 안정적인 link_id를 사용한다.

## 개발과 배포

개발 서버는 파일 변경을 300ms 간격으로 확인하고 200ms 동안 변경 이벤트를 모은다. content 루트의 섹션 JSON이나 public 자산 변경 시 다시 검증하고 virtual module을 무효화한 뒤 일반 페이지를 새로 로드한다. 편집기에는 이 전체 새로고침을 보내지 않아 다른 탭의 초안을 유지한다. 잘못된 외부 파일 입력은 Vite 오류 화면으로 알려준다.

title/description/OG/Twitter/canonical/파비콘은 빌드 HTML에 들어간다. 실제 Pages base_url/base_path로 배포하며 공개 URL 없는 로컬 빌드는 canonical을 생략한다. 본문은 클라이언트 렌더링이다.

PR은 check와 루트·하위 경로 빌드, main은 검사 후 Pages 배포를 수행한다. check에는 이미지·콘텐츠·JSON Schema 동기화·타입·린트·회귀 테스트가 포함된다. 동작을 가진 검색 UI는 DOM 테스트로 검증한다.

## 로컬 편집기

editor/는 공개 페이지의 진입점에서 참조하지 않는 별도 개발 진입점이다. scripts/editor-plugin.ts는 Vite의 apply:serve와 configureServer로 __editor/ HTML·API를 제공한다. configurePreviewServer는 같은 경로와 편집 소스 경로를 404로 차단한다. 정적 빌드 입력은 기존 index.html 하나이며 verify:build가 산출물에서 편집 경로·통신 식별자·파일의 부재도 검사한다.

같은 개발 전용 plugin의 transformIndexHtml이 일반 페이지 상단에 ‘페이지 편집’ 링크를 삽입한다. 링크에는 실제 base 경로를 적용하며 편집기/iframe에는 삽입하지 않는다. 공개 React 진입점·공통 CSS에는 이 버튼을 넣지 않고, 정적 빌드에서 개발 도구 표시가 포함되지 않았는지도 검증한다. 프로필 이름은 입력값 그대로 렌더링하며 자동 문장부호를 덧붙이지 않는다.

입력 폼은 기존에 생성한 5개 JSON Schema에서 필드·설명·선택지·기본값을 읽는다. 검증 계약을 별도로 복제하지 않으며, 편집 UI에는 Zod·Sharp를 번들하지 않는다. JSON 모드는 모든 원본 필드를 그대로 편집한다. API는 parseSettings와 loadValidatedContent로 저장 전 초안을 검증하고 공개용 정규화 데이터만 iframe에 전달한다. iframe은 동일 출처의 부모 창 메시지만 받고 별도의 이미지 base를 사용해 미사용 public 이미지도 미리볼 수 있다.

scripts/editor-store.ts는 고정한 다섯 content 파일만 읽고 쓴다. 전체 파일 바이트의 SHA-256 revision으로 외부 수정·여러 탭의 덮어쓰기를 방지하고, 한 번에 하나의 저장만 처리한다. 검증 후 변경 파일만 같은 폴더의 임시 파일에서 rename한다. 일반 예외 시 변경한 파일을 복구하며 프로세스 강제 종료·전원 손실에 대한 여러 파일 전체의 원자성은 보장하지 않는다. JSON 기본값을 강제로 저장하지 않는다.

개발 서버는 loopback 호스트로 제한한다. API는 실제 접속 주소·Host·Origin·Sec-Fetch-Site와 서버 메모리의 세션 토큰을 검사하며, 요청 크기는 4MB로 제한한다. 토큰은 로컬 HTML에서만 제공하고 저장하지 않는다. 이미지 경로도 public의 실제 경로와 크기를 검사한다. 이 도구는 GitHub 인증·push·배포·이미지 업로드·분석 전송을 수행하지 않는다.
