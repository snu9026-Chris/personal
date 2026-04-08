-- ============================================================
-- skills 테이블에 prompt 컬럼 + name unique 제약 추가
-- Supabase SQL Editor에서 1회 실행
-- ============================================================

-- 1) prompt 컬럼 추가 (logic.summary 같은 스킬의 system prompt 본문 저장용)
alter table skills
  add column if not exists prompt text;

-- 2) updated_at 추가 (sync 시점 추적용)
alter table skills
  add column if not exists updated_at timestamptz default now();

-- 3) name에 unique 제약 — sync 스크립트가 upsert하기 위해 필요
--    중복 name이 이미 있으면 이 단계에서 에러가 남. 그 경우 먼저 중복 정리할 것.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'skills_name_unique'
  ) then
    alter table skills add constraint skills_name_unique unique (name);
  end if;
end $$;

-- 4) 인덱스 (조회 성능)
create index if not exists idx_skills_name on skills(name);
