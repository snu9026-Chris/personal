-- planning_docs 테이블 생성
CREATE TABLE IF NOT EXISTS planning_docs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('context_priming', 'feature_spec', 'screen_structure', 'design_spec')),
  phase TEXT NOT NULL CHECK (phase IN ('research', 'feature', 'screen', 'design')),
  title TEXT NOT NULL,
  summary TEXT,
  key_decisions JSONB DEFAULT '[]',
  sections JSONB DEFAULT '[]',
  dev_notes JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 프로젝트당 doc_type 유니크 (한 프로젝트에 같은 타입 문서 1개)
CREATE UNIQUE INDEX IF NOT EXISTS idx_planning_docs_unique ON planning_docs(project_id, doc_type);

-- RLS 활성화
ALTER TABLE planning_docs ENABLE ROW LEVEL SECURITY;
