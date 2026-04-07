# 🚀 Personal Management 설치 및 실행 가이드

## 필요한 것
- **Node.js** 18 이상 (https://nodejs.org)
- **Supabase 계정** (무료) (https://supabase.com)
- **Anthropic API 키** (https://console.anthropic.com)

---

## 1단계: 패키지 설치

이 폴더에서 터미널(PowerShell 또는 명령 프롬프트)을 열고:

```bash
npm install
```

---

## 2단계: 환경 변수 설정

`.env.local.example` 파일을 복사해서 `.env.local` 로 이름을 바꾸세요:

```bash
# Windows
copy .env.local.example .env.local

# Mac/Linux
cp .env.local.example .env.local
```

`.env.local` 파일을 메모장이나 VSCode로 열고 값을 채워주세요:

```env
ANTHROPIC_API_KEY=sk-ant-api03-여기에_실제_키_입력
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 3단계: Supabase 데이터베이스 설정

1. https://supabase.com 에서 새 프로젝트 생성
2. 프로젝트 대시보드 > **SQL Editor** 클릭
3. `setup-supabase.sql` 파일의 내용을 전체 복사해서 붙여넣기
4. **Run** 버튼 클릭

### API 키 확인 방법
- 프로젝트 대시보드 > **Settings** > **API**
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public** 키 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 4단계: 실행

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 을 여세요! 🎉

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| 📄 Word 파일 업로드 | .docx, .doc 파일 드래그앤드롭 |
| 🤖 AI 자동 요약 | Claude AI가 교육용 보고서 생성 |
| ✏️ 인라인 편집 | 보고서 내용을 클릭해서 바로 수정 |
| 💾 Supabase 저장 | 클라우드에 영구 저장 |
| 📥 PDF 다운로드 | 브라우저 인쇄 기능으로 PDF 저장 |
| 🔍 검색 & 태그 | 라이브러리에서 보고서 검색 |

---

## 문제 해결

### "API 키 오류" 가 나올 때
→ `.env.local` 파일의 Anthropic API 키 확인

### "Supabase 연결 실패" 가 나올 때
→ Supabase URL과 anon key 확인, SQL 스키마가 실행되었는지 확인

### Word 파일이 업로드 안 될 때
→ .docx 형식인지 확인 (구버전 .doc는 제한적으로 지원)

---

## 프로덕션 배포 (선택사항)

Vercel에 배포하면 어디서든 접속 가능합니다:

```bash
npm install -g vercel
vercel
```

---

*Made with ❤️ using Next.js + Supabase + Claude AI*
