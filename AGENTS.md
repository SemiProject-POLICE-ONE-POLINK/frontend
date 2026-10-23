# POLINK React 클라이언트 — 에이전트 작업 지침 초안

POLINK Spring Boot REST API에 연결하는 React 클라이언트다.
시민의 사건 신고·분실물 업무와 경찰·관리자의 사건·수사·반환 관리 화면을 제공한다.

> **초안 상태**
>
> 백엔드 구현(`POLICE_ONE-POLINK`)과 `POLINK 사이트맵과 브랜치 계획`을 2026-10-22 기준으로 확인해 작성했다.
> 사이트맵 원본은 30개 화면을 기준으로 작성되었다고 설명하지만, 제공된 Markdown에는 개별 화면명과 실제 URL 표가 포함되어 있지 않다.
> 백엔드 OpenAPI 스냅샷과 POLINK 디자인 토큰 v1은 확인했다.
> 프론트엔드 저장소와 package.json은 아직 확인하지 못했으므로 실제 스크립트와 파일 배치는 저장소 생성 후 확정한다.
> OpenAPI 스냅샷은 경로·요청·응답 스키마 확인에 사용하되, 성공·오류 상태 코드와 역할 권한은 Controller, SecurityConfig와 예외 처리 코드를 함께 확인한다.
> 아래의 **제안 기본값**은 팀 합의 후 확정하고, 실제 저장소의 확정 설정과 충돌하면 실제 설정을 우선한다.

이 지침은 두 층으로 나눈다. 화면 기술이나 디자인이 바뀌면 1층을, 백엔드 계약이 바뀌면 2층을 갱신한다.

| 층 | 범위 | 기준 |
| --- | --- | --- |
| **1. 프론트엔드 공통 규칙** | AI 작업 제한, 기술 스택, 폴더, 라우팅, 상태, UI, 검증 | 프론트 저장소와 팀 합의 |
| **2. POLINK 서버 연동 규칙** | API, 인증, 역할, 페이징, 파일, 오류, 상태값 | 백엔드 Controller·DTO·테스트 |

---

# 0. AI 작업 제한과 담당 도메인 보호

## 0.1. 작업 시작 전 확인

1. 프로젝트 탐색 전에 저장소 루트의 `AGENTS.md`와 도구별 지침 파일이 있으면 먼저 읽는다.
2. 프론트 화면도 API와 업무 소유권에 따라 같은 담당 구분을 적용한다.

| 담당자 | 프론트엔드 담당 범위 |
| --- | --- |
| A | 회원 가입 및 로그인, 사건 목록 · 검색, 사건 상세(본인 · 관리자), 사건 접수, AI 유사 사건 찾기, 사용자 권한 |
| B | 경찰 · 관리자 대시보드, 수사 보드, 수사 기록 · 증거물 · 목격자 · 진술 등록 및 조회, 수사 종결, AI 가설 생성·채택 |
| C | 시민 마이페이지, 분실물 · 습득물 등록 및 조회 (목록 / 상세 조회), 반환 신청 · 처리, 물품 통계, AI 분실물 매칭 챗봇 |

공통 라우터, 인증 스토어, API 클라이언트, 레이아웃, 디자인 토큰은 여러 담당자에게 영향을 주는 공통 영역이다. 변경 전에 영향받는 담당자와 협의한다.

## 0.2. AI 작업 허용 범위

다음 정책을 적용한다.

```text
- AI는 요청받은 담당 도메인의 프론트엔드 코드와 테스트를 직접 구현하고 검증할 수 있다.
- 기존 파일의 삭제·이동과 공통 파일·타 도메인 변경은 영향 범위를 알리고 사용자 확인 후 수행한다.
- 기존 사용자 변경이나 다른 담당자의 작업을 덮어쓰지 않는다.
- DB, 백엔드 API 계약, 배포 환경은 직접 변경하지 않고 담당자용 변경안만 제공한다.
- Git 이력 변경과 PR 작업은 직접 수행하지 않고, 브랜치명, Git 명령어, 커밋 메시지와 PR 내용은 채팅으로만 제안한다.
- 실행하지 않은 검증이나 확인하지 않은 동작을 완료했다고 보고하지 않는다.
- 타 도메인의 화면이나 API 계약 변경이 필요한 경우 응답 맨 앞에 담당 도메인 변경 경고를 표시하고, 소유 담당자와 협의할 수 있는 구체적인 변경안을 제공한다.
```

---

# 1층. 프론트엔드 공통 규칙

## 1. 프로젝트 원칙

```text
- 이 프로젝트는 실제 경찰 업무 시스템이 아니라 가상 데이터를 사용하는 프로토타입이다.
- 핵심 사용자 흐름을 우선하고, 합의하지 않은 기능 확장이나 대규모 구조 변경을 하지 않는다.
- AI 분석 결과는 참고 정보로 표시한다. AI가 사건 종결, 가설 채택, 반환 승인을 자동 확정한 것처럼 표현하지 않는다.
- 화면에서 버튼을 숨기는 것은 사용성 보조일 뿐 보안 수단이 아니다. 최종 권한 판단은 서버 응답을 따른다.
```

## 사용 라이브러리

```
- 앱이 쓰는 라이브러리는 react, react-dom, react-router, axios, zustand 만 쓴다.
- UI 라이브러리와 CSS 프레임워크는 도입하지 않는다.
- TypeScript 문법을 쓰지 않는다.
```

목록에 없는 것은 도입하지 않는다. `fetch`는 브라우저 내장 기능이라 이 목록과 무관하다.

## 1.1. 역할별 진입 화면과 통합 흐름

로그인 성공 후 `role`에 따라 첫 화면, 사이드바 메뉴, 접근 가능한 기능을 다르게 구성한다. 화면을 숨기는 것만으로 권한 처리가 끝났다고 판단하지 않고 각 API의 401·403 응답도 확인한다.

### 시민 계정 — `CITIZEN`

```text
- 로그인 후 시민 마이페이지로 이동한다. 시민 마이페이지는 C가 담당한다.
- 마이페이지에는 A의 사건 요약과 C의 물품 정보를 조합해 표시한다.
- 주요 메뉴는 마이페이지, 사건 목록, 사건 접수, 분실물·습득물이다.
- 빠른 실행은 사건 접수(A), 분실물 등록(C), 습득물 등록(C), AI 유사 사건 찾기(A), AI 분실물 매칭(C)으로 구성한다.
- 내 반환 신청은 시민 마이페이지 응답에 포함되지 않으므로 필요한 화면에서 C의 반환 신청 API를 별도로 호출한다.
```

### 경찰 계정 — `POLICE`

```text
- 로그인 후 경찰 대시보드로 이동한다. 경찰 대시보드는 B가 담당한다.
- 대시보드는 내 배정 사건(A), 수사 보드 진입(B), 반환 신청 대기(C), 보관 중 습득물(C)을 함께 보여준다.
- 주요 메뉴는 대시보드, 사건 목록, 수사 보드, 분실물·습득물, 반환 신청 처리, 분실물 통계다.
- 내 배정 사건을 선택하면 사건 상세(A)와 수사 보드(B)가 같은 caseId를 사용해야 한다.
- 반환 신청 처리와 물품 통계는 C의 API·상태값을 사용한다.
```

### 관리자 계정 — `ADMIN`

```text
- 로그인 후 관리자 대시보드로 이동한다. 관리자 대시보드 화면은 B가 담당한다.
- 관리자 대시보드는 GET /api/v1/users/me/admin-dashboard 응답을 사용해 사건 상태별 현황, 유형별 현황과 담당 경찰 미배정 사건을 표시한다.
- 주요 메뉴는 대시보드, 사건 목록, 분실물·습득물, 물품 통계, 사용자 권한으로 구성한다.
- 사건 목록·상세, 담당 경찰 배정, 사건 종결과 사용자 권한 관리는 A가 담당한다.
- 분실물·습득물 목록과 물품 통계는 C가 담당한다.
- 대시보드 안에 담당 경찰 배정 버튼이 있는 경우 B는 버튼 배치와 배정 후 대시보드 갱신을 담당하고, 실제 배정 요청과 사건 상태 처리는 A의 사건 API 함수를 사용한다.
- 관리자 대시보드 API는 현재 구현되어 있지만 사용자 권한 관리 API는 확인되지 않았으므로, 사용자 권한 화면을 mock 데이터만으로 연동 완료 처리하지 않는다.
```

### 담당자 간 통합 경계

```text
- A ↔ B: 사건 접수·담당 경찰 배정(A) → 경찰 대시보드(B) → 사건 상세(A)·수사 보드(B) → 수사 종결(B) → 관리자 사건 종결(A)
- A ↔ C: 로그인·역할 정보(A) → 시민 마이페이지(C) → 내 사건 요약(A)과 내 물품·반환 정보(C) → 각 상세 화면 이동
- B ↔ C: 경찰·관리자 대시보드(B) → 반환 신청 처리·물품 상세·통계(C)
- A ↔ B ↔ C: 로그인 role → 역할별 첫 화면 → 역할별 사이드바와 허용 라우트 구성
- C 내부 역할 연계: 시민 반환 신청 → 경찰 승인 또는 반려 → 승인 건 인계 완료
```

### 통합 검증 기준

```text
- 사건 진행 UI의 접수·담당 배정·수사 중·종결 단계는 별도 프론트 enum을 만들지 않고 CaseStatus와 담당 경찰 존재 여부로 표현한다.
- 사건 상태는 WAITING, INVESTIGATING, CLOSED, CANCELED 원문을 사용한다.
- 물품 상태는 LOST, STORED, HANDOVER_PENDING, RETURNED 원문을 사용한다.
- 반환 신청 상태는 PENDING, APPROVED, REJECTED, COMPLETED 원문을 사용한다.
- 시민 마이페이지는 /api/v1/users/me/mypage, 경찰 대시보드는 /api/v1/users/me/police-dashboard, 관리자 대시보드는 /api/v1/users/me/admin-dashboard 응답을 기준으로 한다.
- caseId는 서버의 `SMPA-연도-일련번호` 원문을 라우트와 API 요청에 사용한다. 화면에서 축약 표시가 필요하면 모든 역할이 같은 포맷터를 사용하고 원본 ID는 보존한다.
- 사용자 이름·아이디·연락처·계급·부서 등 프로필 정보는 실제 응답에 있는 필드만 표시하며 mock 값을 로그인 사용자 정보처럼 남기지 않는다.
- 관리자 대시보드는 GET /api/v1/users/me/admin-dashboard 응답을 사용한다.
- 사용자 권한 관리 API는 현재 확인되지 않았으므로 계약 확정 전까지 연동 완료로 표시하지 않는다.
- 한 담당자의 mock 데이터만으로 통합 완료를 판단하지 않는다. 경계의 ID, role, enum, 상태 전이, 401·403·404·409 응답을 실제 백엔드로 확인한다.
```

## 2. 폴더 구조

```text
design-tokens/
    polink.tokens.json  디자인 토큰 원본 — 공통 파일 (편집 기준)

src/
    api/                axios 인스턴스와 도메인별 요청 함수
    assets/             번들에 포함되는 이미지·아이콘
    components/
        common/         공통 UI — feat/common-foundation에서 A가 최초 구성
        chatbot/        챗봇 UI — C 담당
    config/
        nav.js          역할별 사이드바 메뉴
    constants/
        codes.js        역할·상태·유형의 서버 원문과 화면 라벨
    hooks/              둘 이상의 화면에서 재사용하는 커스텀 훅
    layout/             공통 헤더·사이드바·역할별 레이아웃 — feat/common-foundation에서 A가 최초 구성
    pages/
        auth/           로그인·회원가입 — A
        case/           사건·유사 사건 검색 — A
        admin/          관리자 사건 배정·종결·사용자 권한 — A
        my/             시민 마이페이지 — C
        dashboard/      경찰·관리자 대시보드 — B
        board/          수사 보드와 수사 업무 — B
        items/          분실물·습득물 — C
        returns/        반환 신청·처리 — C
        stats/          물품 통계 — C
    routes/             도메인별 라우트와 인증·역할 가드
    store/              인증 등 여러 화면이 공유하는 클라이언트 상태
    styles/
        tokens.css      디자인 토큰에서 생성된 CSS 변수와 타입 스타일 (생성 결과)
        global.css      reset, 전역 글꼴과 공통 전역 스타일
    utils/              날짜·오류·파일 URL 등 순수 함수
```

```text
- URL에 직접 대응하면 pages, 아니면 components에 둔다.
- API 파일은 auth, users, cases, investigations, items, returnRequests처럼 도메인별로 나눈다.
- 컴포넌트는 axios를 직접 호출하지 않고 api/의 함수만 호출한다.
- 모든 라우트를 App.jsx에 직접 나열하지 않는다. caseRoutes.jsx, boardRoutes.jsx, itemRoutes.jsx처럼 도메인별 파일로 나눈다.
- App.jsx의 라우트 조합은 A가 관리한다. 다른 담당자는 자신의 routes 파일을 수정하고 App.jsx 변경이 필요하면 A에게 공유한다.
- config/nav.js는 역할별 메뉴의 단일 기준이다. 기능에 필요한 메뉴 추가는 해당 기능 PR에 포함할 수 있다.
- components/common, api/client.js, layout은 feat/common-foundation에서 최초 구성한다.
- 여러 도메인에 영향을 주는 공통 구조 변경은 목적별 feat/common-* 브랜치로 분리하고 영향받는 담당자와 협의한다.
- 백엔드 DTO 필드명을 화면 모델에서 임의로 바꾸지 않는다. 변환이 필요하면 api/ 경계에서 명시적으로 변환한다.
- 하나의 파일이 여러 역할과 도메인의 정책을 동시에 처리하도록 키우지 않는다.
```

## 3. 라우팅과 역할

제공된 사이트맵 Markdown에는 실제 URL 목록이 없으므로 아래 규칙만 확정한다. 화면 정의서 원본을 받기 전에는 `/citizen/...`, `/police/...` 같은 경로를 추측해 대량 생성하지 않는다.

역할 상수는 백엔드의 원문 값을 그대로 사용한다.

```js
export const USER_ROLE = {
    CITIZEN: 'CITIZEN',
    POLICE: 'POLICE',
    ADMIN: 'ADMIN',
};
```

```text
- 로그인하지 않은 사용자는 로그인·회원가입 화면만 접근하게 한다.
- CITIZEN, POLICE, ADMIN별 진입 화면과 메뉴를 분리한다.
- 역할 가드는 잘못된 메뉴 접근을 막고 안내 화면으로 보낸다.
- 403을 라우터가 성공으로 바꾸거나 삼키지 않는다. 서버 메시지를 보여주고 허용 화면으로 이동할 선택지를 준다.
- 상세 화면의 caseId, itemId, requestId 등 식별자는 URL path parameter에 둔다.
- 검색어, 필터, 정렬, 페이지 번호는 URL query string에 둬 새로고침과 링크 공유가 가능하게 한다.
- UI의 페이지 번호는 1부터 표시해도 서버 요청 직전에 0부터 시작하는 값으로 변환한다.
```

라우트 파일 소유권:

| 라우트 모듈 예시 | 담당 | 포함 범위 |
| --- | --- | --- |
| `authRoutes.jsx`, `caseRoutes.jsx`, `adminRoutes.jsx` | A | 인증, 사건 상세·배정·종결, 사용자 권한 |
| `dashboardRoutes.jsx`, `boardRoutes.jsx` | B | 경찰·관리자 대시보드, 수사 보드 |
| `myRoutes.jsx`, `itemRoutes.jsx`, `returnRoutes.jsx`, `statsRoutes.jsx` | C | 시민 마이페이지, 물품, 반환, 통계 |

파일명은 제안값이다. 실제 저장소에서 한 번 확정한 뒤 같은 의미의 이름을 중복 생성하지 않는다.

## 4. 상태 관리

```text
- 입력값, 모달 열림 여부 등 화면 하나에서만 쓰는 값은 useState에 둔다.
- 로그인 사용자와 accessToken처럼 여러 화면이 공유하는 클라이언트 값만 Zustand에 둔다.
- API로 받은 사건·물품·수사 목록 전체를 전역 스토어에 복제하지 않는다. 요청한 화면이 소유한다.
- 검색 조건과 페이지는 Zustand가 아니라 URL query string에 둔다.
- 상태를 직접 변경하지 않고 새 배열·객체로 갱신한다.
- axios 인터셉터처럼 React 컴포넌트 밖에서 스토어를 읽을 때는 useAuthStore.getState()를 사용한다.
- 로딩, 빈 결과, 오류, 성공 상태를 구분한다. 오류 발생 시 기존 성공 데이터를 무조건 빈 목록으로 덮어쓰지 않는다.
```

백엔드에는 refresh token API가 없다. 초안 기본값은 access token과 최소 사용자 정보를 `sessionStorage`에 유지하는 것이다. `localStorage`, 쿠키, 메모리 전용 저장으로 바꾸려면 팀에서 로그인 유지 범위와 보안 영향을 먼저 합의한다.

## 5. 컴포넌트와 스타일

```text
- 함수 컴포넌트만 사용한다.
- 페이지는 데이터 요청과 화면 조합을 담당하고, 반복되는 표시·입력 UI는 컴포넌트로 분리한다.
- 목록 key에는 배열 index가 아니라 caseId, itemId, evidenceId, requestId 같은 고유 값을 사용한다.
- 색·글자·간격·모서리는 디자인 토큰을 사용한다. 합의 없이 색상 값을 화면마다 직접 적지 않는다.
- 컴포넌트 스타일은 *.module.css에 둔다. reset, 글꼴, 토큰만 전역 CSS에 둔다.
- 상태 enum은 서버 값과 사용자 표시 문구를 분리한다. 요청에는 서버 enum을 보내고 화면에는 한글 라벨을 표시한다.
- 날짜와 시간은 한국어 화면에서 읽기 좋게 표시하되, API 요청 형식은 서버 계약을 유지한다.
```

### 디자인 토큰

```text
- 디자인 토큰의 단일 원본은 design-tokens/polink.tokens.json이다.
- src/styles/tokens.css는 디자인 토큰 원본에서 생성되는 파일이므로 직접 수정하지 않는다.
- 색상, 간격, 모서리, 그림자, 레이아웃, z-index, 움직임 값은 대응하는 CSS 변수가 있으면 하드코딩하지 않는다.
- 페이지 제목, KPI 숫자, 카드 제목, 본문, 라벨, 캡션과 번호 표시는 tokens.css의 타입 스타일을 우선 사용한다.
- 사건번호, 물품번호, 증거물번호, 날짜와 KPI 숫자에는 mono 계열의 num 또는 number 스타일을 사용한다.
- 반응형 기준은 max-width 1450px, 1300px, 1100px, 860px, 640px를 사용한다.
- CSS 미디어 쿼리에서는 CSS 변수를 사용할 수 없으므로 확정된 breakpoint 숫자를 직접 작성한다.
- 라이트·다크 테마는 tokens.css의 변수 재정의를 사용하며 개별 컴포넌트가 별도의 다크 색상값을 만들지 않는다.
- prefers-reduced-motion 환경에서는 애니메이션 시간을 제거하거나 최소화한다.
- package.json에 토큰 생성 스크립트가 정의된 경우에만 해당 스크립트를 사용한다. 스크립트가 없으면 npm run tokens가 실행 가능하다고 가정하지 않는다.

접근성 기준:

```text
- 클릭 동작에는 div 대신 button 또는 a를 사용한다.
- 모든 입력은 label과 연결하고 검증 오류를 입력 가까이에 표시한다.
- 키보드만으로 메뉴, 모달, 폼을 사용할 수 있어야 한다.
- 아이콘 단독 버튼에는 aria-label을 제공한다.
- 색상만으로 상태를 구분하지 않는다.
- 비동기 처리 중에는 중복 제출을 막고 진행 상태를 텍스트로 알린다.
```

## 6. 코드 규약

```text
- 들여쓰기는 스페이스 4칸을 사용한다.
- 컴포넌트는 PascalCase, 함수·변수는 camelCase, 상수는 UPPER_SNAKE_CASE를 사용한다.
- 주석은 한글로 쓰되 코드가 무엇을 하는지 반복하지 말고 업무 규칙과 이유를 설명한다.
- console.log, 임시 데이터, 주석 처리된 코드를 완료본에 남기지 않는다.
- 사용자에게 보이는 메시지는 공통 상수 또는 오류 처리 함수로 관리한다.
- 이해하기 어려운 중첩 삼항식과 한 컴포넌트에 몰린 역할 분기를 피한다.
```

## 7. 완료 확인

프론트 저장소에 실제로 정의된 스크립트를 먼저 확인한다. 제안 기본 명령은 다음과 같다.

```bash
npm run lint
npm run build
```

테스트 도구가 설정되어 있으면 변경 범위의 테스트도 실행한다. 빌드와 린트만으로 실제 화면 동작을 확인했다고 보지 않는다.

역할별로 다음을 브라우저에서 직접 확인한다.

```text
- 새로고침 후 로그인 상태와 보호 라우트가 예상대로 동작하는가
- CITIZEN, POLICE, ADMIN 메뉴와 접근 제한이 구분되는가
- 400, 401, 403, 404, 409, 413 오류가 사용자에게 이해 가능한 형태로 보이는가
- 목록의 검색·필터·0 기반 페이지 변환이 올바른가
- multipart 등록과 파일 없는 등록이 모두 동작하는가
- 로딩 중 중복 제출이 차단되고 빈 결과와 오류가 구분되는가
- 모바일 너비와 키보드 탐색에서 핵심 흐름을 완료할 수 있는가
```

UI 변경이 있는 PR에는 역할별 주요 화면 스크린샷을 첨부한다.

---

# 2층. POLINK 서버 연동 규칙

## 8. 계약의 기준과 서버 주소

백엔드는 Springdoc 기반 OpenAPI와 Swagger UI를 제공한다. 실행 중인 서버의 /v3/api-docs와 /swagger-ui/index.html에서 API를 확인할 수 있다. 세부 권한과 상태 전이는 다음 순서로 대조한다.

1. OpenAPI 또는 Swagger UI
2. 백엔드 Controller의 HTTP method, path, consumes, status
3. request/response DTO와 enum
4. Service의 권한·상태 전이 규칙
5. HTTP 예제와 백엔드 테스트

### OpenAPI 사용 기준

```text
- 백엔드 OpenAPI 스냅샷은 docs/api/api-docs.json에 둔다.
- 파일명에 다운로드 번호를 포함하지 않고 api-docs.json으로 통일한다.
- 실행 중인 백엔드의 /v3/api-docs를 저장된 스냅샷보다 우선한다.
- OpenAPI의 path, parameter, requestBody, schema, enum을 프론트 API 함수와 폼 구현의 기준으로 사용한다.
- 저장된 OpenAPI 스냅샷은 생성 결과이므로 실제 API 계약을 바꾸기 위해 직접 수정하지 않는다.
- OpenAPI에는 전역 bearerAuth가 설정되어 있으며 회원가입과 로그인만 인증 예외로 표시된다.
- HTTP 상태 코드, 오류 응답, 역할별 접근 권한은 OpenAPI만으로 판단하지 않고 Controller, 예외 처리기, SecurityConfig를 함께 확인한다.
- OpenAPI 스키마를 복사하여 별도의 프론트 상수로 중복 관리하지 않는다.
- 문서와 실제 백엔드 코드가 다르면 임의로 맞추지 말고 API 소유 담당자에게 확인한다.
```

### 서버 주소와 환경변수

```text
- 로컬 서버 기본값은 http://localhost:8080이다.
- 프론트에서는 VITE_API_BASE_URL 환경변수로 주입한다.
- 실제 주소는 src/api/client.js의 axios 인스턴스 한 곳에서만 읽는다.
- API 함수와 컴포넌트에 localhost나 서버 주소를 반복해서 적지 않는다.
- .env에는 공개되어도 되는 프론트 설정만 둔다. VITE_* 값은 브라우저 번들에 노출된다.
- DB 비밀번호, JWT 서명 키, 외부 AI API 키를 프론트에 두지 않는다.
```

백엔드에는 CORS 설정이 확인되지 않았다. 개발 서버 포트나 프록시를 임의로 정한 뒤 연동 완료로 판단하지 않는다. 팀에서 다음 중 하나를 확정한다.

- 백엔드에 허용 origin을 명시한다.
- Vite 개발 프록시를 사용한다.

## 9. axios와 응답 처리

```text
- 일반 JSON과 multipart 요청은 axios를 사용한다.
- 현재 AI API도 완성된 JSON 한 덩어리로 응답하며 스트리밍 계약은 없다.
- 요청 함수 위에는 대응하는 Controller 메서드와 method/path를 주석으로 적는다.
- 정상 응답에는 공통 result 래퍼가 없다. response.data 자체가 각 DTO 또는 배열이다.
- api/ 함수가 axios Response 전체를 컴포넌트로 넘기지 말고 response.data를 반환한다.
- 201 응답도 성공으로 처리한다. Location 헤더가 있으면 필요한 흐름에서만 사용한다.
```

현재 대표 정상 응답은 다음처럼 DTO가 바로 온다.

```json
{
    "userId": 1,
    "userName": "citizen01",
    "name": "홍길동",
    "role": "CITIZEN",
    "accessToken": "..."
}
```

## 10. 인증과 세션

```text
- 로그인은 POST /api/v1/auth/login에 userName과 password를 JSON으로 보낸다.
- 로그인 성공 응답의 accessToken, userId, userName, name, role을 인증 스토어에 저장한다.
- 토큰은 요청 인터셉터 한 곳에서 Authorization: Bearer {accessToken}으로 붙인다.
- API 함수와 컴포넌트가 Authorization 헤더를 직접 만들지 않는다.
- 요청 URL이나 본문에 로그인 사용자 ID를 임의로 넣지 않는다. 서버는 JWT의 sub를 사용한다.
- refresh token API는 없다. 401이면 인증 상태를 비우고 로그인 화면으로 보낸다.
- 403은 로그인은 유지하되 권한 부족 메시지를 보여준다.
- 토큰을 디코딩한 role은 UI 구성에만 참고한다. 서버 권한 판단을 대체하지 않는다.
```

현재 Spring Security는 API별로 CITIZEN, POLICE, ADMIN 권한을 검사하고, 등록되지 않은 요청은 denyAll 처리한다. 프론트 역할 가드는 사용성 보조이며 최종 접근 권한은 서버의 401·403 응답을 기준으로 한다.

역할 원문:

```text
CITIZEN
POLICE
ADMIN
```

## 11. API 경로와 역할 요약

아래 표는 프론트 구현을 위한 요약이며 세부 필드는 실제 DTO를 확인한다.

| 영역 | 경로 | 주요 역할·주의 |
| --- | --- | --- |
| 인증 | `POST /api/v1/auth/signup`, `/login` | 비로그인. 회원가입 계정은 시민으로 생성됨 |
| 내 화면 | `GET /api/v1/users/me/mypage` | 시민 전용 |
| 경찰 대시보드 | `GET /api/v1/users/me/police-dashboard` | 경찰 전용 |
| 관리자 대시보드 | `GET /api/v1/users/me/admin-dashboard` | 관리자 전용. 사건 상태·유형별 건수와 미배정 사건 제공 |
| 사건 | `/api/v1/cases/**` | 시민 접수, 시민·경찰·관리자 조회, 관리자 배정·종결 |
| 유사 사건 AI | `POST /api/v1/cases/ai-search` | 로그인 필요. 분석 결과는 참고 정보 |
| 수사 보드·가설·기록 | `/api/v1/cases/{caseId}/...` | 담당 경찰 중심. 생성 후보와 채택 저장을 구분 |
| 증거물 | `/api/v1/cases/{caseId}/evidences` | JSON 또는 multipart 등록 |
| 목격자·진술 | `/api/v1/cases/{caseId}/witnesses/**` |  |
| 물품 | `/api/v1/items/**` | 목록·상세는 로그인, 등록·내 물품·AI 매칭은 시민, 통계는 경찰·관리자 |
| AI 물품 매칭 | `POST /api/v1/ai/item-matches` | 시민 전용 |
| 반환 신청 | `/api/v1/return-requests/**` | 시민은 등록 ·내역, 경찰은 전체 조회·승인·반려·완료 |


## 12. 페이지, 검색, 날짜

```text
- 서버의 page는 0부터 시작한다. 첫 요청은 page=0이다.
- 물품 목록과 반환 신청 목록은 page=0, size=10을 기본값으로 사용한다.
- 사건 목록은 Spring Pageable 설정을 따르므로 프론트가 page와 size를 명시적으로 전달한다.
- 물품 검색 날짜는 yyyy-MM-dd 형식의 startDate, endDate다.
- LocalDateTime 요청은 타임존 표기가 없는 ISO_LOCAL_DATE_TIME 형식으로 보낸다.
- 빈 검색 조건은 빈 문자열로 보내지 말고 query parameter에서 생략한다.
- enum 필터는 한글 라벨이 아니라 서버 enum 원문을 보낸다.
```

목록 응답 모양은 아직 통일되어 있지 않다.

| API 종류 | 현재 응답 특징 |
| --- | --- |
| 물품 목록·내 물품 | `items`, `page`, `size`, `totalElements`, `totalPages`, `first`, `last` |
| 사건 목록·내 사건 | `items`, `totalElements`만 제공 |
| 시민 내 반환 신청 | 전체 페이지 메타데이터 제공 |
| 경찰 반환 신청 | 현재 `items`만 제공 |
| 증거물·목격자·수사 기록·가설 | DTO 배열을 직접 반환 |

```text
- 목록 API마다 응답 구조가 다르므로 실제 응답 필드를 확인한다.
- 모든 목록에 page, totalPages, first, last가 있다고 가정하지 않는다.
- 응답 구조 차이는 각 도메인의 api 파일에서 처리한다.
- 페이지 정보가 없는 API에서는 프론트가 totalPages를 임의로 계산하지 않는다. 
- 페이지 이동 UI가 필요하지만 메타데이터가 없으면 백엔드 담당자와 응답 계약을 먼저 협의한다.
```

## 13. 파일 업로드와 파일 경로

### 물품

```text
- POST /api/v1/items는 multipart/form-data다.
- ItemCreateRequest 필드는 FormData의 일반 필드로 보내고 이미지는 image 이름으로 최대 1개 보낸다.
- PATCH /api/v1/items/{itemId}는 application/json이다.
- POST /api/v1/items/{itemId}/image는 image 필드가 정확히 1개인 multipart 요청이다.
- Content-Type을 직접 지정하지 않는다. 브라우저와 axios가 boundary를 붙이게 한다.
- 이미지는 2MB 이하만 허용되며 초과 시 413 응답이 올 수 있다.
```

### 증거물

```text
- 파일이 없으면 POST /api/v1/cases/{caseId}/evidences에 JSON을 보낸다.
- 파일이 있으면 같은 경로에 multipart/form-data를 보낸다.
- request 파트에는 EvidenceCreateRequest JSON Blob을, file 파트에는 파일 1개를 넣는다.
- multipart Content-Type의 boundary를 직접 작성하지 않는다.
```

현재 응답의 `imagePath`와 `filePath`는 서버 로컬 파일 시스템 경로일 수 있고, 백엔드에 이를 공개 URL로 제공하는 리소스 핸들러가 확인되지 않았다. 이 값을 그대로 `<img src>`나 다운로드 링크에 넣지 않는다. 이미지·증거 파일 표시 전에 백엔드 담당자와 다음 계약을 확정한다.

- 공개 또는 인증된 다운로드 endpoint
- 응답이 절대 URL인지 상대 URL인지
- 파일 접근 권한과 404 처리

## 14. 오류 처리

회원·사건·물품 도메인의 대표 오류는 다음 형식이다.

```json
{
    "status": 403,
    "message": "접근 권한이 없습니다."
}
```

수사 도메인의 일부 `IllegalArgumentException` 응답은 현재 다음처럼 `status`가 없다.

```json
{
    "message": "입력값을 확인해주세요."
}
```

```text
- 인터셉터는 HTTP status를 우선 사용하고 메시지는 response.data.message를 우선 사용한다.
- message가 없으면 HTTP status별 공통 사용자 메시지를 사용한다.
- 정규화한 Error에는 status, message, data를 둔다.
- 컴포넌트는 err.message를 표시하고 분기가 필요할 때 err.status를 본다.
- 400은 입력 또는 업무 규칙 오류, 401은 인증 필요·만료, 403은 권한 부족, 404는 리소스 없음, 409는 상태 충돌, 413은 파일 용량 초과로 처리한다.
- 서버 메시지를 무시하고 모든 오류를 '요청 실패' 하나로 바꾸지 않는다.
- 서버 stack trace나 내부 경로가 응답에 포함되어도 사용자 화면에 그대로 노출하지 않는다.
```

오류 응답 형식이 도메인마다 다르므로 `status` 필드의 존재를 HTTP 상태 판정 조건으로 사용하지 않는다.

## 15. 서버 enum과 화면 상태

요청과 조건 분기에는 아래 원문을 사용한다. 화면 표시는 별도 라벨 맵으로 관리한다.

```text
UserRole: CITIZEN, POLICE, ADMIN
CaseType: THEFT, FRAUD, MISSING, CYBER, ETC
CaseStatus: WAITING, INVESTIGATING, CLOSED, CANCELED
EvidenceType: PHOTO, VIDEO, DOCUMENT, SEIZED, ETC
StatementType: INITIAL, ADDITIONAL, CORRECTION, REVERSAL
ItemType: LOST, FOUND
ItemStatus: LOST, STORED, HANDOVER_PENDING, RETURNED
ReturnRequestStatus: PENDING, APPROVED, REJECTED, COMPLETED
```

서버가 모르는 한글 값이나 프론트 전용 약어를 요청에 보내지 않는다. 새 상태나 상태 전이를 프론트에서 먼저 만들지 않는다. 사이트맵의 충돌 방지 예시에 나온 `HANDOVER_WAIT`는 백엔드 enum이 아니므로 사용하지 않고, 실제 값인 `HANDOVER_PENDING`을 `constants/codes.js`의 단일 기준으로 둔다.

### 상태 배지 토큰 매핑

```text
- 상태 배지는 서버 enum 원문을 기준으로 라벨과 디자인 토큰을 매핑한다.
- WAITING, LOST, PENDING은 status-wait 토큰을 사용한다.
- INVESTIGATING, STORED, HANDOVER_PENDING, APPROVED는 status-run 토큰을 사용한다.
- CLOSED, RETURNED, COMPLETED는 status-done 토큰을 사용한다.
- CANCELED는 status-cancel 토큰을 사용한다.
- REJECTED는 status-crit 토큰을 사용한다.
- AI 가설의 채택은 done, 기각이나 반려는 crit 의미를 사용하되 서버에 없는 enum을 새로 만들지 않는다.
- 상태를 색상만으로 구분하지 않고 한글 라벨을 항상 함께 표시한다.

## 16. 주요 업무 규칙

```text
- 사건 접수는 시민만 가능하다.
- 사건 담당 경찰 배정과 사건 종결은 관리자만 가능하다.
- 시민의 내 사건은 본인이 신고한 사건, 경찰의 내 사건은 본인이 배정된 사건이다.
- 수사 기능은 경찰 중심이며 사건 접근 권한까지 서버가 검사한다.
- AI 수사 가설 generate 응답은 DB에 저장되지 않는다. 사용자가 선택해 POST한 가설만 채택·저장된다.
- 시민은 분실물·습득물을 등록하고 자신의 분실물·습득물 이미지를 추가할 수 있다.
- 물품 수정 범위는 역할과 물품 유형·상태에 따라 다르다. 시민은 본인의 LOST 분실물, 경찰은 STORED 습득물만 수정한다.
- 반환 신청은 시민이 만들고, 경찰이 PENDING → APPROVED 또는 REJECTED, APPROVED → COMPLETED 순서로 처리한다.
- AI 매칭과 유사 사건 검색 결과는 추천이며 최종 사실이나 처리 결과로 표시하지 않는다.
```

화면에서 허용되지 않는 전이를 비활성화하되, 서버가 409를 반환하면 최신 상세 정보를 다시 조회할 수 있게 안내한다.

---

# 3. 협업 규칙

## 17. 브랜치 구조 — 사람이 수행

프론트는 사이트맵의 브랜치 계획에 따라 `develop` 통합 방식을 사용한다.

```text
main     시연 가능한 안정 버전
develop  프론트 통합·검증 브랜치
feat  기능 단위 작업 브랜치
```

```text
- main과 develop에 직접 push하지 않는다.
- 모든 기능 브랜치는 최신 develop에서 만든다.
- 작업 시작 전에 develop의 최신 변경을 반영한다.
- 기능 브랜치는 develop을 대상으로 PR을 만든다.
- 발표 전 통합 검증을 마친 develop만 main으로 머지한다. 시연은 main을 사용한다.
```

```text
브랜치명

feat/도메인-기능
fix/도메인-내용
docs/문서-내용

feat/case-create
feat/board-ai
feat/items-return
fix/item-pagination
docs/frontend-agents
```

```text
A
├─ feat/auth-role-entry
├─ feat/case-flow
└─ feat/admin-management

B
├─ feat/role-dashboards
├─ feat/investigation-workspace
└─ feat/investigation-ai-close

C
├─ feat/citizen-items
├─ feat/return-operations
└─ feat/item-statistics
```

## 18. 커밋과 PR — 사람이 수행

커밋은 백엔드와 같은 `타입: 한글 작업 내용` 형식을 사용한다. 허용 타입은 `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`다.

```text
feat: 시민 사건 접수 화면 구현
fix: 물품 목록 페이지 번호 변환 수정
docs: 프론트 API 연동 규칙 추가
```

```text
- 하나의 PR에는 가급적 하나의 화면 흐름 또는 기능 단위만 포함한다.
- PR 대상은 develop이다. main 대상 PR은 발표 전 통합 승격 때만 만든다.
- 팀원 최소 1명의 승인 후 머지한다. AI 검토만으로 팀원 리뷰를 대체하지 않는다.
- PR에는 목적, 주요 변경, 영향받는 역할·라우트·API, 검증 방법과 결과를 적는다.
- UI 변경에는 주요 역할별 스크린샷을 첨부한다.
- 테스트하지 못한 항목은 숨기지 말고 이유와 남은 확인 사항을 적는다.
```

리뷰어는 이어지는 흐름의 담당자를 우선한다.

| 변경 경계 | 우선 리뷰 관계 | 확인할 내용 |
| --- | --- | --- |
| 사건 ↔ 수사 | A ↔ B | 사건 ID, 배정 상태, 경찰 접근, 종결 흐름 |
| 인증·마이페이지 ↔ 물품 | A ↔ C | 사용자 정보, 내 물품·반환 요약, 상세 이동 |
| 경찰 메뉴 ↔ 물품 관리 | B ↔ C | 역할 메뉴, 반환 처리, 통계 진입 |

## 19. 공통 파일 충돌 방지

```text
- App.jsx: A가 라우트 조합을 관리한다. 도메인별 라우트 구현은 routes/*.jsx로 분리한다.
- config/nav.js: 기능에 필요한 메뉴 추가는 해당 기능 PR에 포함하고 관련 화면 담당자에게 리뷰를 요청한다.
- constants/codes.js: 서버 enum 원문과 라벨을 feat/common-foundation에서 먼저 확정한다.
- api/client.js: 인증·오류 처리 구조 변경은 별도 feat/common-* PR로 진행한다.
- components/common과 layout: 작은 확장은 기능 PR에 포함할 수 있고, 여러 도메인에 영향을 주는 구조 변경만 별도 feat/common-* PR로 분리한다.
- design-tokens/polink.tokens.json과 src/styles/tokens.css는 모든 화면에 영향을 주는 공통 파일이다.
- 토큰 원본 변경은 영향받는 화면과 테마를 설명하고 팀 리뷰를 받은 뒤 반영한다.
- tokens.css만 직접 고쳐 원본 JSON과 불일치하게 만들지 않는다.
- 기능 화면에 필요한 기존 토큰 사용은 별도 승인이 필요 없지만, 새 토큰 추가·삭제·이름 변경은 공통 변경으로 처리한다.
```

복사해서 만든 유사 공통 컴포넌트를 각 도메인에 방치하지 않는다. 다만 공통화 때문에 기능 브랜치를 오래 막지 말고, 필요한 props와 사용처를 정리해 별도 PR로 협의한다.

## 20. develop 병합과 통합 확인 순서

```text
1. 공통 기반
   - Vite 기본 구조, API 클라이언트, 인증 상태, 라우터, 공통 레이아웃과 역할별 메뉴의 최소 구조를 먼저 develop에 병합한다.

2. 기능별 병합
   - A는 인증·사건·관리자 기능, B는 대시보드·수사 기능, C는 시민 마이페이지·물품·반환·통계·챗봇 기능을 구현한다.
   - 담당 도메인 전체를 한 번에 병합하지 않고, 독립적으로 확인 가능한 기능 단위로 PR을 생성해 develop에 병합한다.

3. 담당자 간 통합 확인
   - 서로 연결되는 기능이 develop에 병합되면 화면 이동, ID, 역할, 상태값, API 응답과 오류 처리를 바로 확인한다.
   - 모든 기능이 끝날 때까지 통합 확인을 미루지 않는다.

4. 최종 안정화
   - 주요 기능이 병합되면 시민·경찰·관리자 역할별 흐름과 오류·빈 화면·반응형·접근성을 점검한다.
   - 최종 검증이 끝난 develop만 main에 병합한다.

미완료 기능을 마지막 대형 통합 PR에서 한꺼번에 구현하거나 수정하지 않는다.
```

## 21. 민감정보

```text
- 외부 AI API 키와 JWT 서명 키는 백엔드에서만 관리한다.
- 실제 access token, 계정, 비밀번호, 개인정보를 소스·테스트·문서·스크린샷에 넣지 않는다.
- 커밋하는 .env.example에는 변수 이름과 공개 가능한 예시 값 또는 자리표시자만 둔다.
- 실제값이 들어가는 .env는 .gitignore에 등록한다.
- 테스트 데이터는 가상 데이터를 사용한다.
- Push 전 staging, 추적 파일, 미전송 커밋에 민감정보가 없는지 확인한다.
```

## 22. 팀 합의가 필요한 변경

다음은 담당자 한 명이 독단적으로 바꾸지 않는다.

```text
- 프론트 기술 스택과 주요 의존성
- 인증 저장 방식과 공통 axios 인터셉터
- 공통 라우터, 역할 가드, 레이아웃, 디자인 토큰
- 백엔드 API 경로·DTO·오류·권한 계약에 영향을 주는 변경
- 담당 도메인 경계와 공통 컴포넌트 소유권
- 디자인 토큰 이름·값·생성 방식과 라이트·다크 테마 정책
- 전역 글꼴, 반응형 breakpoint, 레이아웃 크기와 z-index 체계
```

변경 제안에는 목적, 수정 대상, 영향을 받는 역할·화면·API, 마이그레이션 방법, 검증 방법을 포함한다.
