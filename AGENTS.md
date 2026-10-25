# Link Hub 작업 지침

React + Vite + TypeScript 단일 정적 페이지. GitHub Pages 배포. 작업 전 README.md, docs/EDITING.md, docs/ARCHITECTURE.md, docs/STATUS.md를 읽고 사용자 변경을 보존한다. Node 24/npm과 package-lock.json을 사용한다. 현재 Git 초기화 전이며 사용자가 요청하기 전에는 .git을 만들지 않는다.

## 설정 파일은 다섯 개로 유지

| 파일 | 담당 |
|---|---|
| content/site.json | SEO·언어·테마·목적지·공유 UI·리소스 |
| content/profile.json | 상단 문구·프로필·태그·SNS |
| content/links.json | 기본 링크 제목·문구·목록 |
| content/products.json | 상품 제목·광고 표시·검색·목록 |
| content/footer.json | 푸터 |

섹션을 불필요하게 여러 파일로 쪼개거나 site.json에 모두 합치지 않는다. 별도 운영 예시 파일은 만들지 않는다. 상품 테스트 데이터는 tests/fixtures/products.json에서 관리하고 실제 검색 테스트에서 스키마로 검증한 뒤 사용한다. 실제 상품이 없으면 기본 상품 목록을 비워 둔다.

## 유지할 계약

- 기능이나 설정 구조를 변경하면 같은 작업에서 docs/EDITING.md도 반드시 갱신한다. 변경된 설정 파일·필드, 동작 조건, 편집 예시와 확인 방법을 실제 구현에 맞추고, 편집 가이드 갱신까지 작업 완료 조건에 포함한다.
- SNS·기본 링크·상품 id는 전체에서 유일하며 제목·순서 변경 시에도 유지한다.
- 배열 순서로 표시하고 enabled로 노출을 제어한다. 공통 URL은 site.json의 destinations를 참조한다.
- 상품 원본 목록이 비었거나 모두 숨김이면 영역 전체를 숨긴다.
- 검색창은 필터링 전 노출 상품 수가 minItems 이상일 때만 보인다. 결과 없음일 때도 검색창과 안내를 유지한다.
- 검색은 제목·브랜드·설명·키워드 대상의 로컬 검색이다. 검색어를 분석이나 네트워크로 보내지 않는다.
- 링크는 실제 a href이며 분석 실패가 이동을 막지 않는다. 광고 관계와 새 탭 속성을 유지한다.
- src/lib/schema.ts가 데이터 계약의 단일 정의다. 필드 설명·기본값·생략 동작·선택지를 편집기에서 확인할 수 있게 유지한다. 변경 시 npm run schema:generate, 관련 테스트 픽스처와 docs/EDITING.md를 함께 갱신한다.
- 공개 App은 virtual module의 검증·정규화된 데이터를 Page에 전달한다. 편집기 미리보기도 같은 Page를 사용하되 서버에서 검증한 초안을 전달한다. Zod/Sharp/파일 시스템 코드를 브라우저에 넣지 않는다.
- editor/ 진입점과 scripts/editor-plugin.ts·editor-store.ts는 로컬 편집 전용이다. 공개 진입점에서 편집 코드를 import하지 않는다. 편집 페이지/API는 loopback 개발 서버에만 제공하고 npm run preview와 정적 배포에서는 제외한다. 저장 대상은 기존 content 5개 파일로 제한한다.
- 초안 미리보기는 파일을 쓰지 않는다. 저장 전 기존 콘텐츠·이미지 검증을 재사용하고 revision 충돌·동시 저장·동일 출처·세션 토큰 검사를 유지한다. HMR이 다른 편집 탭의 초안을 날리지 않도록 한다.
- 리소스는 assetUrl을 사용한다. 이미지 상한·형식 검사와 루트/저장소 하위 경로를 유지한다.
- 숨긴 데이터·사용하지 않는 목적지·미사용 public 파일은 배포하지 않는다. 생성 원본이 꼭 공개될 필요는 없다.
- SEO/공유 메타데이터는 React 실행 후에만 설정하지 않는다.
- 새로운 UI에 긴 문구·한 단어 영문·작은 화면의 가로 넘침 방어를 유지한다.
- GA/Amplitude는 연결 지점만 있다. 요청 범위에서 연결하고 자동 수집과 수동 이벤트 중복을 확인한다. 비밀키를 VITE_*나 Git에 넣지 않는다.

## 변경 위치와 검증

UI는 src/components/, 스타일은 src/styles/global.css, 검색은 src/lib/products.ts, 로더/이미지 검사는 scripts/content-validation.ts, 빌드 통합은 vite.config.ts에 있다.

기본 검증은 npm run check, npm run build, npm run verify:build다. 경로·자산·메타데이터 변경은 루트와 /link-hub/를 각각 빌드·검증한다. 화면 변경은 모바일·데스크톱, 빈 목록, n-1/n 경계, 검색/지우기/결과 없음, 키보드, 긴 문구를 확인한다. 예시 데이터 검증은 프로젝트 밖 임시 사본에서 하고 실제 운영 목록에 남기지 않는다.

편집기 변경은 초안/폼/JSON 전환·저장·검증 오류·외부 변경 충돌·정적 preview 404·빌드 제외를 확인한다. 생성 JSON Schema를 재사용하고 기능·설정 구조 변경과 함께 docs/EDITING.md를 갱신한다.

필요한 회귀 테스트는 실제 실패 사례를 대상으로 추가한다. 변경 후 docs/STATUS.md와 운영 문서를 갱신한다. 실제 GitHub 실행/공개 주소를 확인하지 않았다면 로컬 검증과 공개 배포 성공을 구분해 보고한다. 별도의 설치형 스킬은 필요하지 않다.
