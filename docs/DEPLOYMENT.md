# GitHub Pages 배포

## 최초 설정

Node 24와 npm 환경에서 진행한다. `.nvmrc`는 Node 24를 지정한다. 계정 사이트라면 저장소명은 `계정.github.io`, 일반 프로젝트 사이트라면 원하는 저장소명을 사용한다.

1. GitHub에 빈 저장소를 만든다.
2. 프로젝트 폴더에서 저장소를 연결하고 main 브랜치를 올린다. 아래 URL의 YOUR-NAME과 저장소명은 실제 값으로 바꾼다. 현재 프로젝트에는 .git이 없으며, 이 명령은 배포할 때 직접 실행한다.

```sh
git init -b main
git add .
git commit -m "Create React link hub"
git remote add origin https://github.com/YOUR-NAME/link-hub.git
git push -u origin main
```

이미 Git을 초기화했다면 `git init`을 다시 할 필요는 없다. `node_modules`, `dist`, `.env`는 올리지 않는다. `package-lock.json`과 `public/media/og-image.png`는 포함한다.

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

## CI와 배포

- PR → 콘텐츠/타입/린트/테스트 + 루트·하위 경로 빌드. 공개 preview 배포는 하지 않는다.
- main push / workflow_dispatch → 검사 → 실제 Pages URL 확인 → 빌드/산출물 검증 → 아티팩트 업로드 → 별도 job에서 배포.
- Actions는 공식 문서에 나온 버전의 SHA로 고정했다. 버전 변경 시 공식 릴리스와 Node 요구사항을 확인한다.
- 배포 동시 실행은 직렬화한다. 실패한 검증 결과를 배포하지 않는다.
- 로컬 __editor/ 화면·API·편집기 CSS/JS는 dist에 포함하지 않는다. verify:build에서 편집기 코드의 혼입을 검사하며, npm run preview에서도 편집 경로는 404다. 콘텐츠 편집은 배포 전 npm run dev 또는 npm run editor에서 수행한다.

## 복구

문제가 된 변경을 `git revert <문제-커밋>`으로 되돌려 main에 반영하면 정상 버전이 재빌드·배포된다. 로컬에서 `dist`만 수정하는 방식으로 복구하지 않는다. Actions 실행 성공과 실제 공개 주소 확인을 모두 기록한다.

## 첫 배포 후 확인

Actions의 build와 deploy job이 모두 성공했는지 확인하고 출력된 page_url을 연다. 새로고침 후 프로필·이미지·SNS·기본 링크·공유 버튼을 확인하며, 브라우저 개발자 도구에서 JS/CSS/이미지 404와 콘솔 오류가 없는지 확인한다. 페이지 소스의 canonical과 og:image가 실제 공개 도메인·저장소 경로를 포함하는지도 확인한다. 실제 상품을 추가한 경우 빈 목록 숨김과 검색 기준 개수도 함께 확인한다.

로컬 검사는 GitHub 계정의 플랜·조직 정책·환경 보호 규칙과 실제 공개 URL을 대신 검증하지 않는다. 현재 로컬 점검 결과는 docs/verification/pages-readiness.json에 기록한다.

## 문제 해결

- configure-pages 실패: Settings → Pages의 Source와 저장소 정책을 확인한다.
- 하위 경로 이미지 404: public 경로를 하드코딩했는지, `assetUrl`을 썼는지 확인한다.
- 공유 미리보기 갱신 지연: 소셜 서비스의 캐시 영향을 확인한다. 메타데이터는 `dist/index.html`에 있어야 한다.
- 로컬 npm 명령을 찾지 못함: 이 Mac에는 Homebrew Node 24/npm을 설치했다. 새 터미널을 열거나 `source ~/.zshrc`를 실행한다. `LOCAL-DEVELOPMENT.md` 참고.

공식 참고: [Vite Pages 배포](https://vite.dev/guide/static-deploy.html#github-pages), [GitHub Pages 커스텀 워크플로](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages), [configure-pages 출력](https://github.com/actions/configure-pages/blob/main/action.yml).
