-- ============================================================
-- Personal Management - Supabase 설정 (단순화 버전)
-- ============================================================
-- 아래 내용 전체를 복사해서 SQL Editor에 붙여넣고 Run 클릭!

create table if not exists reports (
  id              uuid default gen_random_uuid() primary key,
  title           text not null,
  subject         text default '',
  difficulty      text default 'medium',
  summary         text default '',
  key_points      text[] default array[]::text[],
  sections        jsonb default '[]'::jsonb,
  vocabulary      jsonb default '[]'::jsonb,
  study_tips      text[] default array[]::text[],
  tags            text[] default array[]::text[],
  original_content text default '',
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table reports enable row level security;

create policy "allow all"
  on reports for all
  using (true)
  with check (true);

-- ────── 주간 목표 테이블 ──────
create table if not exists week_goals (
  id         uuid default gen_random_uuid() primary key,
  week_key   text not null unique,   -- 예: "2026-03-31" (해당 주 월요일)
  days       jsonb default '{}'::jsonb,  -- { "0": {goal, memo, progress}, ... "6": ... }
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table week_goals enable row level security;

create policy "allow all"
  on week_goals for all
  using (true)
  with check (true);
