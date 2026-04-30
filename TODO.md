# TODO

## 검증 필요 (사용자 확인)

- [ ] dev 서버 띄워서 6개 페이지 수동 테스트
  - [ ] `/` — 5개 섹션 로딩 + 프로젝트 카드 편집 토스트
  - [ ] `/projects` — 사이드바/타임라인/기획문서 + 생성·편집·삭제·복원 + 토스트
  - [ ] `/goals` — 캘린더/슬라이더(drag)/모달(마지막작업·다음작업)
  - [ ] `/study` — Word 업로드 / Drive 선택 / AI 분석 / 저장 토스트
  - [ ] `/library` — 검색/태그/PDF/재생성/삭제 토스트
  - [ ] `/skills` — 목록/등록/삭제 토스트
- [ ] 페이지 이동 시 SWR 캐시 동작 확인 (Network 탭에서 동일 데이터 fetch가 안 일어나야 정상)

## 후속 개선 (사용자 결정 대기)

- [ ] 보안 R12 — 로컬 dev 인증 우회 정책 재검토 (현재는 유지)
- [ ] 보안 R13 — 업로드 파일 MIME 타입 검증 추가 여부 (현재는 유지)
- [ ] dead code R14 — `week_goals` API + `MAX_GOALS`/`migrateGoalDays`는 UI에서 안 쓰지만 사용자 요청으로 유지 (나중에 UI 추가 가능성)

## 알려진 제약

- `next lint`는 deprecated (Next.js 16 제거 예정). `tsc --noEmit`만 의존 중
- ESLint flat config 마이그레이션은 별도 작업 필요
