import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// API 라우트 / Server Component 전용 Supabase 클라이언트.
// 요청에 실린 Supabase 세션 쿠키를 읽어 `auth.getUser()` 로 사용자 검증에 사용한다.
// 데이터 CRUD는 여전히 `supabase-server.ts` (service_role) 클라이언트로 수행하고,
// 이 클라이언트는 오직 인증 확인 용도로만 쓴다.

export async function createRouteClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Component에서 호출된 경우 set이 throw — 무시 가능 (middleware가 갱신 처리)
          }
        },
      },
    }
  );
}
