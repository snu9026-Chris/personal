-- ============================================================
-- 프로젝트 추적 테이블 추가
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1) 프로젝트 테이블
create table if not exists projects (
  id          uuid default gen_random_uuid() primary key,
  name        text not null,
  description text default '',
  status      text default 'in_progress',
  color       text default '#6366f1',
  created_at  timestamptz default now()
);

alter table projects enable row level security;
create policy "allow all" on projects for all using (true) with check (true);

-- 2) 프로젝트 로그 테이블
create table if not exists project_logs (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade,
  title      text not null,
  content    text default '',
  status     text default 'in_progress',
  tags       text[] default array[]::text[],
  logged_at  timestamptz default now()
);

alter table project_logs enable row level security;
create policy "allow all" on project_logs for all using (true) with check (true);

-- 3) 인덱스
create index if not exists idx_project_logs_project_id on project_logs(project_id);
create index if not exists idx_project_logs_logged_at on project_logs(logged_at desc);
