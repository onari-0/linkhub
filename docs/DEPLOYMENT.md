# GitHub Pages 배포

## 2026-10-25 첫 배포 실패 검토 기록

아래 원격 상태는 첫 배포 실패를 조사한 시점의 기록이다. 이후 콘텐츠 교체 작업에서는 공개 URL과 Pages 설정을 재조회하지 않았다. 최신 로컬 콘텐츠 검증은 [현재 상태](STATUS.md)와 [콘텐츠 검증 기록](verification/linktree-content-qa.json)을 참고한다.

대상 저장소는 [onari-0/linkhub](https://github.com/onari-0/linkhub), 실패한 실행은 [Deploy to GitHub Pages #1](https://github.com/onari-0/linkhub/actions/runs/40181686422/job/121133892697)이다. 커밋 `62122a9`의 build job에서 다음 결과를 확인했다.

| 단계 | 실제 결과 |
|---|---|
| checkout / Node 설정 / npm ci | 성공 |
| npm run check | 성공 |
| Read the actual Pages URL (configure-pages) | `Get Pages site failed … Not Found`, HTTP 404 |
| production 빌드 / 아티팩트 업로드 | 앞 단계 실패로 실행 안 됨 |
| deploy job | build 실패로 실행 안 됨 |

원인은 **저장소에 GitHub Pages 사이트가 아직 활성화되지 않은 것**이다. 공개 [저장소 API](https://api.github.com/repos/onari-0/linkhub)에서 `has_pages: false`, `private: false`, `default_branch: main`을 확인했고 Pages 조회 API도 404였다. 액션 SHA나 npm 의존성 때문에 실패한 실행이 아니다. 버전 태그 변경만으로 Pages 설정이 만들어지지는 않는다.

현재 브라우저 로그인 계정으로는 Settings에 `You don't have access to repository options`가 표시되고 Pages 설정 주소는 404다. 저장소 관리자 계정에서 아래 설정을 마쳐야 한다. 이번 검토에서는 원격 설정·커밋·push·재배포를 수행하지 않았다.

## 이 저장소에서 다음에 할 일

1. 저장소 관리 권한이 있는 계정으로 [Settings → Pages](https://github.com/onari-0/linkhub/settings/pages)를 연다. Pages 사이트를 활성화하고 Build and deployment → Source를 **GitHub Actions**로 선택한다. 별도의 Jekyll/정적 HTML 워크플로를 추가할 필요 없이 기존 deploy.yml을 사용한다.
2. 이번 `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` 변경을 main에 반영한다. main push는 자동 배포를 시작한다. 변경 없이 기존 실행만 재시도하려면 Pages 설정 후 Re-run all jobs를 사용할 수 있지만, 그 실행은 이전 커밋의 SHA 참조를 그대로 사용한다.
3. 이후 수동 실행은 [Deploy to GitHub Pages](https://github.com/onari-0/linkhub/actions/workflows/deploy.yml) → Run workflow → main으로 진행한다.
4. build와 deploy가 모두 성공하고 출력된 `page_url`을 확인한다. 기본 도메인 사용 시 예상 주소는 `https://onari-0.github.io/linkhub/`다. **현재 이 주소는 HTTP 404이며 아직 공유 가능한 상태가 아니다.** 커스텀 도메인이 설정되면 실제 `page_url`이 우선이다.
5. 아래 ‘첫 배포 후 확인’을 완료한 뒤 해당 주소를 외부에 공유한다.

공개 저장소이므로 Pages를 위해 유료 플랜이나 도메인을 추가로 구매할 필요는 없다. 별도 PAT·Secrets·GA/Amplitude 연결·백엔드도 기본 배포에 필요하지 않다. Pages 설정이 계속 보이지 않으면 저장소 소유자에게 관리자 권한으로 설정을 요청한다. Actions 정책과 github-pages 환경 보호 규칙은 현재 계정에서 확인하지 못했으므로 배포를 막는 경우에만 관리자에게 확인한다.

## Git 추적 파일 정리

현재 `node_modules` 9,415개 파일과 `dist` 7개 파일이 이미 커밋되어 있다. `.gitignore`에 두 경로가 있어도 기존 추적은 자동 해제되지 않는다. 이번 Pages 조회 실패의 원인은 아니지만, 의존성과 생성물을 저장소에 중복 보관하지 않도록 정리를 권장한다.

작업 내용을 확인한 뒤 아래 명령을 별도 정리 커밋으로 반영한다. `--cached`는 로컬 파일을 남기고 Git의 추적만 제거한다. 이번 검토에서 직접 실행하지는 않았다.

```sh
git rm -r --cached node_modules dist
git diff --cached --stat
git commit -m "Stop tracking dependencies and build output"
git push origin main
```

`package-lock.json`, 소스, 운영 JSON 다섯 파일, `content/site.json`의 `seo.image`가 지정한 출력 파일(현재 `public/media/onari-og.jpg`)는 유지한다. Actions는 `npm ci`로 의존성을 설치하고 `dist`를 새로 생성하므로 두 폴더의 Git 추적이 필요하지 않다. 공개 저장소에 커밋한 원본 JSON·이미지는 Pages 산출물의 노출 필터와 별개로 열람 가능하다.

## 최초 설정

아래는 새 저장소를 만들 때의 일반 절차다. 현재 프로젝트는 Git 초기화와 `origin` 연결·main push가 완료되어 있으므로 이 저장소에서는 위의 Pages 설정부터 진행한다. Node 24와 npm 환경을 사용하며 `.nvmrc`는 Node 24를 지정한다. 계정 사이트라면 저장소명은 `계정.github.io`, 일반 프로젝트 사이트라면 원하는 저장소명을 사용한다.

1. GitHub에 빈 저장소를 만든다.
2. Git 초기화 전인 새 프로젝트 폴더에서 저장소를 연결하고 main 브랜치를 올린다. 아래 URL의 YOUR-NAME과 저장소명은 실제 값으로 바꾼다.

```sh
git init -b main
git add .
git commit -m "Create React link hub"
git remote add origin https://github.com/YOUR-NAME/link-hub.git
git push -u origin main
```

이미 Git을 초기화했다면 `git init`을 다시 할 필요는 없다. `node_modules`, `dist`, `.env`는 올리지 않는다. `package-lock.json`과 `content/site.json`의 `seo.image`가 지정한 출력 파일(현재 `public/media/onari-og.jpg`)는 포함한다.

3. 저장소 Settings → Pages → Build and deployment → Source를 **GitHub Actions**로 설정한다.
4. Actions → Deploy to GitHub Pages → Run workflow에서 main을 선택해 실행한다. Pages를 켜기 전 첫 push의 배포가 실패했더라도, 설정을 마친 뒤 다시 실행하면 된다. 이후 main push는 자동 배포된다.
5. 배포 작업이 성공한 뒤 출력된 page_url에서 화면·이미지·링크를 확인한다.

기본 배포에 별도 PAT나 분석 키는 필요하지 않다. 워크플로는 자동 제공되는 GITHUB_TOKEN과 Pages 배포 권한을 사용한다. Pages 사용 가능 여부와 저장소 공개 범위는 GitHub 계정 플랜/조직 정책에 따른다.

## 첫 배포 전 확인

- GitHub Free에서는 공개 저장소를 사용한다. 비공개 저장소는 Pages를 지원하는 유료 플랜인지 확인한다.
- 기본 배포 브랜치는 main이다. 다른 브랜치를 쓰면 두 워크플로의 branches와 github-pages 환경의 배포 허용 브랜치를 함께 맞춘다.
- 저장소에서 Actions 실행과 actions/* 공식 액션 사용이 허용되어야 한다. 조직 정책으로 차단되어 있다면 해당 정책을 조정해야 한다.
- Pages의 Source는 GitHub Actions로 지정한다. dist 브랜치나 docs 폴더를 배포 소스로 선택하지 않는다.
- github-pages 환경에 승인 규칙이나 브랜치 제한을 추가한 경우 main 배포를 허용한다. 기본 구성에는 별도 수동 승인 단계가 없다.
- 프로필·SNS 주소·SEO 문구·브랜드 이미지를 실제 운영 값으로 확인한다. 상품 목록은 현재 비어 있어 상품 영역을 숨기는 상태다.
- 공유 이미지 생성 원본을 바꿨다면 `npm run media:generate`를 실행하고 출력 PNG도 커밋한다. 빌드는 공유 이미지를 자동 재생성하지 않는다.
- `npm run check`, `npm run build`, `npm run verify:build`를 통과시킨다. Node 24와 package-lock.json을 사용한다.

GitHub 사용자명·저장소명·SITE_URL·BASE_PATH를 소스에 미리 적을 필요는 없다. 배포 워크플로가 실제 Pages 설정에서 경로와 URL을 읽는다. 워크플로에 필요한 권한도 job별로 지정되어 있으므로 저장소 전체의 토큰 권한을 일괄 read/write로 넓힐 필요는 없다. GA/Amplitude를 연결하지 않아도 배포할 수 있다.

## 경로 자동 처리

`actions/configure-pages`가 반환하는 `base_url`과 `base_path`를 사용한다. 기본 github.io 주소에서 일반 저장소라면 `/저장소명/`, 계정 사이트라면 `/`가 된다. 커스텀 도메인에서도 하드코딩하지 않고 실제 반환 경로를 따른다. 실제 공개 URL이 HTML canonical과 OG 이미지 주소에도 사용된다. 커스텀 도메인이 필요하면 Pages 설정과 DNS를 구성하고 HTTPS 상태를 확인한 뒤 다시 배포한다. 기본 github.io 배포에는 도메인 구매나 DNS 설정이 필요하지 않다.

로컬에서 실제 배포 경로를 재현할 수 있다.

```sh
BASE_PATH=/ SITE_URL=https://example.com/ npm run build
BASE_PATH=/ SITE_URL=https://example.com/ npm run verify:build

BASE_PATH=/link-hub/ SITE_URL=https://example.github.io/link-hub/ npm run build
BASE_PATH=/link-hub/ SITE_URL=https://example.github.io/link-hub/ npm run verify:build
BASE_PATH=/link-hub/ npm run preview
```

마지막 빌드는 `http://127.0.0.1:4173/link-hub/`에서 확인한다. preview 명령에도 동일한 BASE_PATH를 전달한다. `.env.local`로 설정해도 되며 `.env.example`을 참고한다. SITE_URL과 BASE_PATH가 불일치하면 빌드가 실패한다. 공개 URL 없는 로컬 빌드는 canonical을 생략한다.

현재 저장소 이름은 하이픈 없는 `linkhub`다. 실제 배포 주소 재현은 다음처럼 한다.

```sh
BASE_PATH=/linkhub/ SITE_URL=https://onari-0.github.io/linkhub/ npm run build
BASE_PATH=/linkhub/ SITE_URL=https://onari-0.github.io/linkhub/ npm run verify:build
BASE_PATH=/linkhub/ npm run preview
```

## CI와 배포

- PR → 콘텐츠/타입/린트/테스트 + 루트·하위 경로 빌드. 공개 preview 배포는 하지 않는다.
- main push / workflow_dispatch → 검사 → 실제 Pages URL 확인 → 빌드/산출물 검증 → 아티팩트 업로드 → 별도 job에서 배포.
- Actions는 메이저 버전 태그를 사용한다. `checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`이며 2026-10-25에 공식 저장소 API에서 각 태그의 존재를 확인했다. 메이저 태그는 같은 메이저 내 수정 버전을 따라가며, 메이저 변경 시 공식 릴리스와 Node 요구사항을 확인한다.
- 배포 동시 실행은 직렬화한다. 실패한 검증 결과를 배포하지 않는다.
- 로컬 __editor/ 화면·API·편집기 CSS/JS는 dist에 포함하지 않는다. verify:build에서 편집기 코드의 혼입을 검사하며, npm run preview에서도 편집 경로는 404다. 콘텐츠 편집은 배포 전 npm run dev 또는 npm run editor에서 수행한다.

## 복구

문제가 된 변경을 `git revert <문제-커밋>`으로 되돌려 main에 반영하면 정상 버전이 재빌드·배포된다. 로컬에서 `dist`만 수정하는 방식으로 복구하지 않는다. Actions 실행 성공과 실제 공개 주소 확인을 모두 기록한다.

## 첫 배포 후 확인

Actions의 build와 deploy job이 모두 성공했는지 확인하고 출력된 page_url을 연다. 새로고침 후 프로필·이미지·SNS·기본 링크·공유 버튼을 확인하며, 브라우저 개발자 도구에서 JS/CSS/이미지 404와 콘솔 오류가 없는지 확인한다. 페이지 소스의 canonical과 og:image가 실제 공개 도메인·저장소 경로를 포함하는지도 확인한다. 실제 상품을 추가한 경우 빈 목록 숨김과 검색 기준 개수도 함께 확인한다.

로컬 검사는 GitHub 계정의 플랜·조직 정책·환경 보호 규칙과 실제 공개 URL을 대신 검증하지 않는다. 현재 로컬 점검 결과는 docs/verification/pages-readiness.json에 기록한다.

외부 공유 준비의 완료 기준은 다음과 같다.

- 시크릿 창이나 로그아웃한 브라우저에서도 실제 `page_url`이 열리고 새로고침이 정상이다.
- 프로필·기본 링크·SNS 목적지가 운영할 계정으로 연결되며, 초기 소개 문구·아바타·일러스트를 운영자가 확인했다. 현재 상품 목록은 비어 있어 상품 섹션이 숨겨지는 것이 정상이다.
- JS/CSS/아바타/카드/파비콘/공유 이미지가 모두 200이고 모바일과 데스크톱에서 정상이다.
- HTML 소스의 canonical·og:url은 실제 공개 URL이고 og:image는 그 URL 아래의 PNG 절대 주소다. 공유 버튼의 주소 복사 결과도 실제 공개 URL이다. 소셜 앱에서 미리보기 제목·설명·이미지도 확인한다.
- `/linkhub/__editor/`와 편집 API는 공개 화면·배포 산출물에 포함되지 않으며 방문자가 편집 기능을 사용할 수 없다. 로컬 preview의 정확한 404 차단과 실제 Pages 호스트의 응답은 별개로 확인한다.

## 문제 해결

- configure-pages의 `Get Pages site failed … Not Found`: 저장소 관리자 계정에서 Pages 활성화와 Source=GitHub Actions를 먼저 확인한다. 이 프로젝트에서는 공개 API의 `has_pages: false`도 확인했다. `enablement: true`로 자동 활성화하려면 별도 관리자 권한 토큰 등이 필요할 수 있어 기본 GITHUB_TOKEN의 권한을 넓히거나 PAT를 추가하는 방식은 사용하지 않는다. 기존 build의 pages:read, deploy의 pages:write/id-token:write를 유지한다.
- 하위 경로 이미지 404: public 경로를 하드코딩했는지, `assetUrl`을 썼는지 확인한다.
- 공유 미리보기 갱신 지연: 소셜 서비스의 캐시 영향을 확인한다. 메타데이터는 `dist/index.html`에 있어야 한다.
- 로컬 npm 명령을 찾지 못함: 이 Mac에는 Homebrew Node 24/npm을 설치했다. 새 터미널을 열거나 `source ~/.zshrc`를 실행한다. `LOCAL-DEVELOPMENT.md` 참고.

공식 참고: [Vite Pages 배포](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub Pages 커스텀 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [configure-pages 출력](https://github.com/actions/configure-pages/blob/main/action.yml).
