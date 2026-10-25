# 콘텐츠와 이미지 출처

2026-10-25에 사용자 요청으로 [오나리 Linktree](https://linktr.ee/Orina0)의 공개 프로필을 확인해 현재 운영 설정에 반영했다.

- 이름: 오나리
- 소개: 가난한 오타쿠૮₍´˘`ʃƪ₎ა와 다음 줄의 #치이카와  #인형뽑기  #말랑이
- 링크 순서: Instagram → TikTok → YouTube. 목적지와 기존 ID를 유지하며 원본처럼 새 탭에서 연다.
- 원본에 없는 소개 보조 문구·카드 설명·배지·샘플 푸터는 제거했다. Linktree 자체 가입 배너·서비스 푸터는 가져오지 않는다. 화면은 현재 프로젝트의 컴포넌트를 사용하며 기존 테마 설정으로 분홍색 계열을 맞췄다.

## 원본 이미지

원본 페이지의 실제 img 주소에서 JPEG 바이트를 내려받아 그대로 저장했다. 브라우저는 로컬 자산만 사용하고 Linktree CDN에 이미지 요청을 보내지 않는다.

| 로컬 파일 | 용도 | 크기 | 원본 |
|---|---|---|---|
| public/media/onari-avatar.jpg | 프로필 | 400×400 | [원본 프로필](https://ugc.production.linktr.ee/c1ce9acd-6439-4c20-98b1-196125593707_850371935-18109708451222312-1335077912528068728-n.jpeg?io=true&size=avatar-v3_0) |
| public/media/onari-instagram.jpg | Instagram 큰 카드 | 733×412 | [원본 Instagram 이미지](https://ugc.production.linktr.ee/dfddc324-7510-4f7a-9f39-56cbd69a6a69_850371935-18109708451222312-1335077912528068728-n.jpeg?io=true&size=thumbnail-feature-v1_0) |
| public/media/onari-tiktok.jpg | TikTok 썸네일 | 100×100 | [원본 TikTok 이미지](https://ugc.production.linktr.ee/2850f7d7-9ce1-4ec5-be15-464988549ce6_9ba9a1dcc40dbc45ee4acaf454077123-tplv-tiktokx-cropcenter-1080-1080.jpeg?io=true&size=thumbnail-stack_v1_0) |
| public/media/onari-youtube.jpg | YouTube 썸네일 | 100×100 | [원본 YouTube 이미지](https://ugc.production.linktr.ee/83b8b63a-5309-4579-a99e-f4b7e2115f91_goZNrfZwdkKtrmtPDYYB3Qm3fFAMPqf5kwKUG8PymbzziCGNzA2lgewC50fXOm2wj5rehSnpzA-s900-c-k-c0x00ffffff-no-r.jpeg?io=true&size=thumbnail-stack_v1_0) |

`public/media/onari-og.jpg`는 위 Instagram 이미지에서 기존 생성 명령으로 만든 1200×630 JPEG 공유 이미지다. 원본 Linktree의 600×600 공유 미리보기를 그대로 복사하지 않고 현재 페이지의 공유 크기에 맞춘다. 파비콘은 기존 자체 제작 `public/favicon.svg`를 유지한다.

## 테스트용 샘플

`avatar.svg`와 `featured.svg`는 초기 화면용으로 자체 작성한 벡터 샘플이다. 이전 `og-image.png`도 기존 샘플에서 생성한 파일로 현재 배포에서는 제외한다. 현재 운영 설정에서는 참조하지 않으므로 배포되지 않는다. 기존 이미지 편집·상품 테스트가 참조하므로 파일은 유지한다. SNS 아이콘은 외부 폰트/스크립트 없이 인라인 SVG로 표시한다.

`tests/fixtures/products.json`의 상품명·브랜드·주소는 검색/화면 검증용이며 실제 광고 상품이 아니다. 운영 상품 목록은 비어 있고 픽스처를 자동으로 연결하지 않는다.

## 사용자 배경 이미지

`public/media/onari-backgroung.jpeg`는 사용자가 직접 추가한 밝은 체크 배경 파일이다. 별도 원본 URL은 제공되지 않았다. `resources.backgroundImage`로 참조하며, 해당 설정을 생략하면 배포에서 제외한다. 파일명은 사용자가 지정한 그대로 유지했다.
