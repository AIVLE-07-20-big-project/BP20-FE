
# BP20-FE

BP20의 점주·관리자용 웹 프론트엔드입니다.

## 디렉토리 구조

```text
src/
├─ app/          # 앱 진입점, 라우터, Provider, 역할별 Layout
├─ pages/        # URL 단위 화면(auth, store-owner, admin, iam, error)
├─ features/     # 사용자 행동 단위 기능 로직
├─ entities/     # 사용자·매장·추천 등 도메인 타입
├─ shared/       # 여러 기능에서 재사용하는 UI와 전역 스타일
└─ mocks/        # 개발용 도메인별 목 데이터
```

새 기능은 역할이 아니라 업무 도메인을 기준으로 `features`와 `entities`에 배치하고,
URL에 직접 연결되는 화면만 `pages`에 둡니다.

## 실행 환경

- Node.js 20 이상
- npm 10 이상

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm run typecheck
npm run build
```

프로덕션 빌드를 로컬에서 확인하려면 다음 명령을 실행합니다.

```bash
npm run preview
```
