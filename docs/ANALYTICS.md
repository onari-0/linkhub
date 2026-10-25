# 분석 연결

현재 SDK·추적 스크립트·쿠키는 추가하지 않았다. `src/lib/analytics.ts`의 기본 어댑터는 아무 데이터도 전송하지 않는다. 카드와 공유 코드에 연결 지점만 마련되어 있다.

## 이벤트 계약

| 이벤트 | 속성 |
|---|---|
| page_view | page_path, 선택적으로 utm_source/utm_medium/utm_campaign |
| link_click | link_id, placement(social/card/product), position(표시 순서 1부터), variant(icon/compact/featured/product), destination_host |
| share_success | method(native/clipboard) |

원본 전체 URL, fbclid, 이메일, 임의 쿼리 값은 공통 이벤트에 자동 포함하지 않는다. UTM 값은 허용한 세 필드만 최대 120자로 제한한다. link_id는 제목이 아니라 콘텐츠의 안정적인 ID를 쓴다. 숨김 항목은 position에 포함하지 않는다.

## 연결 순서

1. 사용할 공급자와 필요한 수집 범위를 결정한다.
2. 어댑터 파일을 만들고 SDK 초기화와 이벤트 변환을 구현한다.
3. `main.tsx`의 `trackInitialPage` 호출 전에 어댑터를 준비한다. 비동기 초기화면 어댑터 내부에서 대기 중 이벤트를 처리한다.
4. `configureAnalytics(adapter)`로 연결한다.
5. GA/Amplitude 자동 방문·클릭 수집과 수동 이벤트의 중복을 확인한다.
6. 실시간/디버그 도구로 방문 1회, 각 링크 클릭, 공유 성공, 공유 취소, SDK 차단 시 링크 이동을 확인한다.

`trackInitialPage`는 모듈 수명 동안 한 번만 호출하며 React effect와 분리했다. SPA 라우팅을 도입한다면 이 계약을 다시 설계한다. 클릭은 네트워크 전송 완료를 기다리지 않는다. 이동 시 수집 누락을 줄이는 전송 옵션은 공급자 연결 시 설정한다.

브라우저에 공개되어도 되는 측정 ID/브라우저용 프로젝트 키만 환경변수로 주입한다. 서버용 비밀키는 사용하지 않는다. 실제 공급자 연결 시 해당 서비스의 데이터 수집 설정과 사이트 운영에 필요한 안내를 함께 맞춘다.

이 페이지에서 알 수 있는 것은 외부 채널로 이동한 클릭이다. 외부 채널에서의 구매·팔로우 완료는 해당 채널의 별도 연동 없이는 확인할 수 없다.

상품 검색어는 전송하지 않는다. 상품 클릭은 placement와 variant에 product를 사용하며 position은 현재 보이는 검색 결과 안의 순서다. 숨긴 항목은 빌드 데이터에서도 제외한다.
