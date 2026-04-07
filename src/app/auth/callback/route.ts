import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-route";

// Supabase OAuth (Google 등) 콜백 핸들러.
// Provider가 ?code=... 로 돌려보낸 인증 코드를 세션 쿠키로 교환한다.

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createRouteClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
  }

  // 화이트리스트 외 이메일은 즉시 로그아웃 + 에러 페이지로
  const { data: { user } } = await supabase.auth.getUser();
  const allowed = user?.email?.toLowerCase() === "snu9026@gmail.com";
  if (!allowed) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=unauthorized_email`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
