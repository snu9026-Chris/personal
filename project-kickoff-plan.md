# Project Kickoff & Summary Planning — 구현 요청서

> 이 문서는 Cowork에서 기획한 내용을 Claude CLI에게 전달하기 위한 구현 명세입니다.
> 아래 내용을 순서대로 실행해주세요.

---

## 배경

현재 Personal Management 홈페이지(Next.js + Supabase)의 프로젝트 페이지에 "기획 초안" 영역이 비어있다.
프로젝트 기획 시 리서치 → 기능기획 → 화면기획 → 디자인 방향까지의 과정을 체계적으로 정리하고,
슬라이드 형식으로 렌더링해서 보여주는 시스템을 만들어야 한다.

---

## 만들어야 할 것 (4가지)

### 1. `project-kickoff` 스킬

**위치**: `~/.claude/skills/project-kickoff/SKILL.md`

**역할**: 프로젝트 기획을 위한 Q&A 세션을 진행하는 스킬

**상호작용 규칙**:
- 사용자가 클로드 채팅에서 먼저 리서치/검토를 진행하고 정리된 내용을 토스함
- 스킬은 토스받은 내용을 분석해서 아래 4개 Step 기준으로 이미 채워진 항목과 빠진 항목을 파악
- **이미 채워진 항목은 스킵**, 부족한 항목만 골라서 질문
- 모든 항목이 채워지면 summary.planning 로직을 적용해서 문서 생성 및 업로드

**Q&A 레퍼런스 (빈 항목 판별 기준)**:

#### Step 1: 리서치
서비스의 존재 이유와 실행 가능성을 확인하는 단계.
- 이 서비스가 해결하려는 문제는 뭐야?
- 서비스의 핵심 가치를 한 문장으로 정의하면?
- **서비스 대상(타겟 사용자)은 누구야?** ← 중요
- 구현 가능 여부 — 기술적으로 막히는 부분이 있어?
- 필요한 도구/기술 스택은? (API, 외부 서비스, 프레임워크 등)
- 비슷한 서비스나 레퍼런스가 있다면?
- MVP 범위 — 첫 버전에서 반드시 있어야 하는 것은?

#### Step 2: 기능 기획
어떤 기능을 가진 서비스인지 구체적으로 정의하는 단계.
- 핵심 기능 목록 나열 (자유롭게)
- 각 기능을 섹션별로 분류하면? (예: 인증, 대시보드, 설정 등)
- 각 섹션 안에서의 세부 기능은?
- 연동되는 외부 도구/서비스는?
- **각 기능의 우선순위는? (Must / Should / Could)** ← 중요
- 데이터 모델의 핵심 엔티티가 있다면?

#### Step 3: 화면 기획
3개의 레이어로 나눠서 질문:

**(a) 스키매틱 (전체 구조 설계도)**
- 어떤 페이지들이 있어?
- 페이지 간 연결(이동) 구조는?
- 네비게이션 방식은? (사이드바, 탭, 단일 페이지 등)

**(b) 와이어프레임 (각 페이지별 레이아웃)**
- 각 페이지의 레이아웃 구조는? (스플릿, 싱글 컬럼, 그리드 등)
- 고정 영역(sticky)과 스크롤 영역 구분은?
- 각 위치별 섹션 구성은? — 헤더, 사이드바(좌/우 고정), 메인 콘텐츠, 푸터 등
- 핵심 UI 요소는? (리스트, 카드, 폼, 모달 등)

**(c) 플로우 설계 (사용자 경로)**
- 각 기능이 화면에서 어떻게 보여지는지?
- 사용자의 주요 이동 경로는?
- 스키매틱 ↔ 와이어프레임 간 연결 — 어떤 페이지의 어떤 요소가 어디로 이동시키는지?

#### Step 4: UI 디자인 방향
구조 위에 입히는 스타일을 정의하는 단계.
- 레퍼런스 디자인 (URL, 앱 이름, 스크린샷)
- 컬러 방향 (메인 컬러, 어두운/밝은 톤)
- 폰트 무게감 (가볍고 산뜻 vs 묵직하고 안정적)
- 무드 키워드 (예: 전문적, 간결, 신뢰감, 미니멀)
- 반응형 필요 여부 및 breakpoint

---

### 2. `summary.planning` 스킬

**위치**: `~/.claude/skills/summary.planning/SKILL.md`

**역할**: project-kickoff에서 수집된 내용을 슬라이드 포맷으로 구조화하는 로직.
기존 `logic.summary`가 학습 콘텐츠용이라면, 이건 프로젝트 기획 콘텐츠 전용.

**Pre-Processing 규칙** (logic.summary와 동일한 철학):
- 산만한 Q&A 답변을 그대로 쓰지 않고, 핵심만 추려서 재구성
- 중복 제거, 논리적 재배열
- 기획 문서에 맞는 **선언적/명세 문체**로 변환 ("~한다", "~이다")
- 불확실한 표현 제거

**문서 타입별 구조화 전략**:

#### (a) 리서치 → 컨텍스트 프라이밍 문서
- `doc_type`: context_priming
- 슬라이드 구성: 문제 정의 → 서비스 가치 → 타겟 사용자 → 기술 스택 → MVP 범위 → 제약/리스크
- layout 전략: definition(가치/타겟 정의), bullets(MVP 범위), table(기술 스택 비교)
- key_message: Claude Code에게 전달 시 **판단 기준**이 되도록 작성

#### (b) 기능 기획 → 기능 명세 문서
- `doc_type`: feature_spec
- 슬라이드 구성: 기능 섹션별 1장 + 우선순위 매트릭스 1장 + 연동 도구 1장
- layout 전략: cards(기능별 카드), table(우선순위 매트릭스 Must/Should/Could), definition(연동 도구)
- 각 기능 카드의 points[]: 세부 기능, 입출력, 관련 화면

#### (c) 화면 기획 → 화면 구조 문서
- `doc_type`: screen_structure
- 슬라이드 구성:
  - 스키매틱: 전체 페이지 맵 (layout: steps)
  - 와이어프레임: 페이지별 레이아웃 설명 (layout: cards)
  - 플로우: 사용자 경로 (layout: table — from/action/to 구조)
- key_message: 컴포넌트 구조와 라우팅에 직접 반영될 수 있는 문장

#### (d) UI 디자인 → 디자인 명세 문서
- `doc_type`: design_spec
- 슬라이드 구성: 무드/톤앤매너 → 컬러 → 폰트 → 레퍼런스 분석
- layout 전략: definition(무드 키워드, 폰트 규칙), table(컬러 팔레트), bullets(레퍼런스 분석)

**JSON 스키마**:

```json
{
  "title": "프로젝트명 — Phase명",
  "doc_type": "context_priming | feature_spec | screen_structure | design_spec",
  "project_name": "프로젝트명",
  "phase": "research | feature | screen | design",
  "summary": "2~3문장 핵심 요약",
  "key_decisions": ["핵심 결정사항 1", "핵심 결정사항 2"],
  "sections": [
    {
      "title": "슬라이드 제목",
      "type": "overview | spec | wireframe | flow | style | priority",
      "layout": "bullets | table | steps | cards | definition",
      "key_message": "한 줄 핵심",
      "content": "마크다운 본문 (표는 GFM 표 사용)",
      "points": [
        { "term": "항목명", "explanation": "설명", "priority": "must|should|could" }
      ]
    }
  ],
  "dev_notes": {
    "claude_prompt_hint": "이 문서를 Claude Code에 전달할 때의 핵심 지시사항",
    "dependencies": ["의존성 1", "의존성 2"],
    "risks": ["리스크 1"]
  },
  "tags": ["태그1", "태그2"]
}
```

**슬라이드 작성 규칙**:
- 한 section = 한 슬라이드 = 한 메시지
- 선언적 문체 ("~한다", "~이다")
- key_message는 헤드라인 한 줄, content에 디테일 (logic.summary와 동일)
- 우선순위 시각 구분: Must 🔴 / Should 🟡 / Could 🟢
- phase별 슬라이드 3~8장 (최대 10장)
- 한국어 기본, 기술 용어는 영어 병기
- 이모지로 시각 구분 (✅ ❌ 💡 ⚠️ 📌 🔑)

**렌더링 색상 가이드** (프론트엔드용):
- context_priming: 🎯 보라
- feature_spec: ⚙️ 파랑
- screen_structure: 🖥️ 초록
- design_spec: 🎨 핑크

---

### 3. 프론트엔드 수정

**파일**: `src/app/projects/page.tsx`

**현재 상태**: 프로젝트 상세 뷰가 2컬럼 — 왼쪽 "기획 초안"(비어있음) + 오른쪽 "업데이트 현황"

**변경 사항**:

#### 왼쪽 패널 (기획 초안 영역)
- summary.planning JSON을 doc_type별로 탭 또는 아코디언으로 구분하여 렌더링
- 각 doc_type별 아이콘/컬러 적용 (위 렌더링 색상 가이드 참조)
- sections[]를 슬라이드 카드 형태로 렌더링 (기존 logic.summary 렌더러 참조)
- layout 타입에 따라 다른 렌더링: bullets → 불릿 리스트, table → GFM 표, cards → 카드 그리드, steps → 순서 리스트, definition → 용어-설명 쌍
- **수기 입력 지원**: 각 doc_type(리서치, 기능기획, 화면기획, 디자인) 섹션에 직접 내용을 추가/수정할 수 있는 에디터 (마크다운 입력)

#### API 변경
- 기존 `/api/projects` + `/api/project-logs`에 더해 planning docs 저장/조회 필요
- 옵션 A: `project_logs` 테이블에 `log_type` 컬럼 추가 ("update" | "planning")
- 옵션 B: 별도 `planning_docs` 테이블 생성
- **권장: 옵션 B** — planning docs는 구조가 다르므로 별도 테이블이 깔끔함

---

### 4. Supabase 스키마

**새 테이블: `planning_docs`**

```sql
CREATE TABLE planning_docs (
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
CREATE UNIQUE INDEX idx_planning_docs_unique ON planning_docs(project_id, doc_type);

-- RLS 정책 (기존 projects 테이블과 동일하게)
ALTER TABLE planning_docs ENABLE ROW LEVEL SECURITY;
```

---

## 실행 순서

```
Step 1. Supabase에 planning_docs 테이블 생성
Step 2. /api/planning-docs 라우트 생성 (CRUD)
Step 3. summary.planning 스킬 생성 (~/.claude/skills/summary.planning/SKILL.md)
Step 4. project-kickoff 스킬 생성 (~/.claude/skills/project-kickoff/SKILL.md)
Step 5. 프론트엔드 기획 초안 영역 렌더링 구현
Step 6. 수기 입력 에디터 구현
```

---

## Claude Code 전달 순서 (기획 문서 활용 시)

project-kickoff으로 기획이 완료된 후, 실제 개발을 시작할 때:

```
Step 1. 컨텍스트 프라이밍 → Claude가 판단 기준을 갖게 됨
Step 2. 기능 명세         → 코드 설계의 근거
Step 3. 화면 구조         → 컴포넌트/라우팅 설계에 반영
Step 4. 디자인 명세       → 구조에 스타일을 입히는 마지막 단계
```

---

## 참고 파일

- 기존 logic.summary 인라인 코드: `src/lib/logic-summary-skill.ts`
- 프로젝트 페이지: `src/app/projects/page.tsx`
- 프로젝트 API: `src/app/api/projects/route.ts`
- 프로젝트 로그 API: `src/app/api/project-logs/route.ts`
- 마크다운 렌더러: `src/components/MarkdownContent.tsx`
