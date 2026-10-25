# 오나리 Link Hub

React + Vite + TypeScript로 만든 정적 링크 페이지입니다. 콘텐츠와 테마를 JSON으로 수정하고 GitHub Pages에 자동 배포할 수 있습니다.

## 실행

Node 24와 npm을 설치한 환경에서:

```sh
npm ci
npm run dev
```

로컬 주소: `http://127.0.0.1:5173/`

브라우저에서 콘텐츠를 편집하려면 `npm run editor`를 실행합니다. 로컬 편집 주소는 `http://127.0.0.1:5173/__editor/`이며, `npm run dev`로 실행한 서버에서도 접근할 수 있습니다. 기존 서버가 실행 중이면 일반 페이지 상단의 ‘페이지 편집’ 버튼을 누르거나 편집 주소를 여세요. 5개 JSON의 입력 폼·JSON 편집·저장 전 미리보기·로컬 저장을 지원합니다. 이동 버튼·편집 화면·저장 API는 정적 배포물에 포함되지 않습니다.

넓은 편집 화면은 폼과 미리보기를 독립적으로 스크롤하며, 켜짐/꺼짐은 입력 폼/JSON과 같은 선택 버튼으로 조작합니다. 배경 이미지는 디자인·공통 → 이미지·생성 설정에서 추가할 수 있습니다. 사용 방법과 추천 테마는 [편집 가이드](docs/EDITING.md)를 참고하세요.

이 Mac에는 Homebrew의 Node.js 24.18.0, npm/npx 11.16.0을 설치했습니다. 새 터미널에서는 위 명령을 바로 사용할 수 있습니다. 이미 열린 터미널은 `source ~/.zshrc`로 PATH와 인증서 설정을 반영하세요. 자세한 환경 정보는 [로컬 개발 환경](docs/LOCAL-DEVELOPMENT.md)을 참고하세요. `sh scripts/dev-local.sh`도 계속 사용할 수 있습니다.

```sh
npm run check         # 콘텐츠/타입/린트/회귀 테스트
npm run build         # dist 생성
npm run verify:build  # 배포 파일/경로/메타데이터 검사
npm run preview       # 완성된 빌드 미리보기 (4173)
```

## 수정

운영 설정은 공통 설정과 화면 섹션별 **5개 파일**로 관리합니다.

| 작업 | 파일 |
|---|---|
| 언어·SEO·테마·공통 목적지·리소스·공유 문구 | `content/site.json` |
| 프로필·상단 문구·SNS | `content/profile.json` |
| 기본 링크 제목·문구·목록 | `content/links.json` |
| 상품 제목·광고 표시·검색 기준·목록 | `content/products.json` |
| 푸터 | `content/footer.json` |

상품은 기본 링크 아래에 표시됩니다. 목록이 없거나 전부 숨김이면 영역을 표시하지 않습니다. 노출 상품이 `search.minItems` 이상이면 검색창을 표시하며 기본값은 6입니다. 상품명·브랜드·설명·키워드로 검색할 수 있습니다.

기본 상품 목록은 비어 있습니다. 필드 설명·기본값·선택지는 편집기의 JSON Schema 안내를, 설정 조합은 [편집 가이드](docs/EDITING.md)를 참고하세요. 상품 검색 검증용 데이터는 `tests/fixtures/products.json`에서 관리합니다.

이미지는 `public/`에 넣고 설정에서 참조합니다. 실제 이미지 해석과 용량을 검사하며 사용 중인 리소스만 배포합니다. 공통 파일의 `resources.ogGeneration`에 맞춰 `npm run media:generate`로 공유 이미지를 생성할 수 있습니다. 스키마를 변경했다면 `npm run schema:generate`로 편집기 자동완성을 갱신합니다.

## 운영 문서

- [콘텐츠·디자인 편집](docs/EDITING.md)
- [로컬 개발 환경과 실행 명령](docs/LOCAL-DEVELOPMENT.md)
- [구조와 설계 결정](docs/ARCHITECTURE.md)
- [GitHub Pages 배포 및 복구](docs/DEPLOYMENT.md)
- [분석 도구 연결](docs/ANALYTICS.md)
- [이미지와 초기 콘텐츠 출처](docs/ASSETS.md)
- [검증 결과와 다음 작업](docs/STATUS.md)
- [에이전트 작업 지침](AGENTS.md)

프로필·소개 문구·SNS 주소·프로필/카드 이미지 4개는 [참고 페이지](https://linktr.ee/Orina0)에서 확인한 값입니다. 이미지는 `public/media/onari-*.jpg`에 저장해 로컬 리소스로 제공합니다. 기존 카드 설명과 상·하단 샘플 문구는 제거했고, 현재 컴포넌트와 설정을 사용해 분홍색 테마로 표시합니다. 이미지별 출처는 [리소스 문서](docs/ASSETS.md)에 기록했습니다.

분석 도구는 연결하지 않은 상태입니다. GitHub 원격은 `onari-0/linkhub`로 연결되어 있습니다. Pages의 Source는 **GitHub Actions**를 사용합니다. 첫 Actions 실행의 Pages 조회 404 원인과 설정 절차는 [배포 가이드](docs/DEPLOYMENT.md)에 기록했습니다. 이번 콘텐츠 변경은 로컬에 반영한 상태이며 main 반영 후 실제 공개 주소에서 확인해야 합니다.
