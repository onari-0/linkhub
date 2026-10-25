# 로컬 개발 환경

2026-10-25에 이 Mac에 설치한 명령:

| 명령 | 버전 | 설치 |
|---|---|---|
| node | 24.18.0 | Homebrew node@24 |
| npm | 11.16.0 | Node와 함께 설치 |
| npx | 11.16.0 | npm과 함께 설치 |

Node 경로는 `/opt/homebrew/opt/node@24/bin`이다. 이 경로가 zsh에서 사용되도록 `~/.zprofile`과 `~/.zshrc`의 `Node.js 24 (Homebrew)` 주석 블록에 설정했다. 기존 내용은 유지했다.

## 바로 실행

새 터미널에서:

```sh
cd /Users/bright/Desktop/link-hub
npm run dev
```

접속: `http://127.0.0.1:5173/`

콘텐츠 편집기는 `npm run editor`로 실행하고 `http://127.0.0.1:5173/__editor/`에서 사용한다. npm run dev로 실행한 서버에도 같은 편집 화면이 있다. 이미 열려 있는 서버는 그대로 사용하면 된다. 새 서버를 별도로 실행하려면 `npm run dev -- --port 5174`를 사용할 수 있으며 편집 주소의 포트도 맞춘다. 두 명령 모두 로컬 loopback에서만 실행할 수 있다.

이미 열려 있던 터미널은 먼저 `source ~/.zshrc`를 실행한다. 종료는 Ctrl+C다. 5173 포트를 이미 사용하는 프로세스가 있으면 개발 서버는 충돌을 알려주며 종료한다.

## 설치·검증·미리보기

현재 프로젝트의 의존성은 설치되어 있다. 새로 체크아웃하거나 잠금 파일이 변경되면 `npm ci`로 다시 설치한다. Vite와 TypeScript는 프로젝트 의존성으로 관리하므로 전역 설치할 필요가 없다.

```sh
npm ci
npm run check
npm run build
npm run verify:build
npm run preview
```

완성된 빌드 미리보기: `http://127.0.0.1:4173/`. 빌드에 하위 경로를 지정했다면 preview에도 같은 BASE_PATH를 전달한다. 자세한 배포 경로 설정은 `DEPLOYMENT.md`를 참고한다.

npm run preview는 정적 배포물 확인용이므로 편집 화면/API가 없다. 편집은 개발 서버에서 하고, 저장·충돌 처리·이미지 후보·초안 유지 방식은 [편집 가이드](EDITING.md)를 따른다.

## 이 Mac의 HTTPS 인증서

새 Node에서 npm 저장소를 다운로드할 때 `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`가 발생했다. zsh 설정 블록에 `NODE_USE_SYSTEM_CA=1`을 추가해 macOS가 신뢰하는 인증서를 사용하도록 했고, npm HTTPS 접속을 검증했다. TLS 인증서 검증은 켜 둔 상태다. `strict-ssl=false` 또는 `NODE_TLS_REJECT_UNAUTHORIZED=0`은 설정하지 않았다.

이 환경변수는 로컬 셸 설정이며 저장소에 비밀키나 인증서를 저장하지 않는다. [Node의 시스템 인증서 안내](https://nodejs.org/learn/http/enterprise-network-configuration)

이전 작업에서 사용한 Codex 내장 Node는 그대로 남아 있다. 기본 개발은 Homebrew Node/npm으로 진행하면 된다.
