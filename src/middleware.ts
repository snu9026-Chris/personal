import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Supabase 세션 쿠키 자동 갱신 미들웨어.
// 모든 요청에 대해 토큰 만료 체크 → 필요시 refresh → 응답 쿠키 갱신.
// 라우트 보호 자체는 각 API 핸들러에서 requireUser()로 수행한다.

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // getUser() 호출이 토큰 갱신을 트리거한다 — getSession()은 캐시되어 안 됨
  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: [
    // 정적 자원 / Next 내부 / 이미지 제외하고 전부
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
