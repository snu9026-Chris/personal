-- ============================================================
-- 진행상황 점검 — projects 테이블에 progress 컬럼 추가
-- Supabase SQL Editor에서 1회 실행하세요
-- ============================================================

alter table projects
  add column if not exists progress int default 0;

-- 진행률 0~100 범위 검증 (실패해도 무시)
do $$
begin
  alter table projects
    add constraint projects_progress_range
    check (progress >= 0 and progress <= 100);
exception when duplicate_object then null;
end $$;

-- 기존 행 백필 (status 기준)
update projects
   set progress = case
     when status = 'completed' then 100
     when status = 'paused'    then coalesce(progress, 0)
     else coalesce(progress, 0)
   end
 where progress is null;
