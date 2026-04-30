# 작업 히스토리

## 2026-04-30 — 전체 코드 리팩토링 (모듈화 + SWR + 토스트)

### 🗂 기획 / 결정
- 5,500줄 코드 베이스를 3축(리팩토링/모듈화/상태관리)으로 점검
- 사용자 확정 스코프: 보안 제외, dead code 유지, SWR 도입(Option A), 모듈화 전체, alert→토스트
- 5단계 페이즈로 분리 진행 (lib → hooks → 공용 UI → 페이지 분해 → 토스트/검증)

### 🐛 문제 → 해결
> **문제 1**: 색상 팔레트·`relativeTime`·`pickColor`·로그 파서·`STATUS_CONFIG`·`Project` 타입 등이 페이지마다 별도로 선언되어 있어 변경 비용·버그 가능성 ↑
> **해결**: `lib/types.ts`, `lib/format.ts`, `lib/color.ts`, `lib/log-parser.ts`, `lib/dashboard-data.ts`로 단일 출처 구축

> **문제 2**: `app/page.tsx`(668줄), `projects`(844), `goals`(610), `study`(500) 등 단일 파일에 fetch/가공/UI/모달이 모두 섞여 있음
> **해결**: 도메인별 컴포넌트 폴더(`components/home/`, `projects/`, `goals/`, `library/`, `skills/`)로 분해. 각 페이지 파일은 200~300줄 수준으로 축소

> **문제 3**: 같은 데이터를 페이지마다 새로 fetch (페이지 이동 시 네트워크 낭비) + visibilitychange 자동 갱신 코드 5중 중복
> **해결**: SWR 도입. `hooks/` 디렉토리에 도메인별 데이터 훅(`useProjects`, `useProjectLogs`, `usePlanningDocs`, `useReports`, `useSkills`) 작성. `SwrProvider`로 전역 캐시·focus revalidate

> **문제 4**: `alert()` 6곳이 UX를 해침
> **해결**: `<ToastProvider>` + `useToast()` 훅 도입. 모든 alert 토스트로 전환 (success/error/info)

> **문제 5**: 모달 백드롭/카드/ESC 처리 4곳에 중복
> **해결**: 공용 `<Modal>` 컴포넌트로 통합. 페이지별 모달은 children만 전달

> **문제 6**: 낙관적 업데이트 후 정렬 깨짐 가능성, `setProjects([new, ...prev])` 패턴이 활동순 정렬을 무시
> **해결**: SWR mutation 후 자동 invalidate → `sortProjectsByActivity` 재실행 → 정렬 일관성 보장

### 📌 진행 상황
- 24개 파일 신규 생성 (lib 13 + hooks 7 + components 16)
- 7개 파일 갈아엎기 (page 6개 + layout 1개)
- `tsc --noEmit --noUnusedLocals --noUnusedParameters` 모두 통과
- API 라우트는 손대지 않음 → DB/응답 shape 호환성 100% 유지
- `swr ^2.4.1` 의존성 추가
- 다음: dev 서버 띄워서 6개 페이지 수동 검증 (TODO.md 참조)
