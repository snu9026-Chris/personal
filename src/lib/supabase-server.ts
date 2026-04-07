import "server-only";
import { createClient } from "@supabase/supabase-js";

// 서버 전용 Supabase 클라이언트.
// service_role 키를 사용하므로 RLS를 우회한다 — 절대 클라이언트 번들에 들어가면 안 됨.
// 모든 DB 접근은 이 클라이언트를 경유하는 `/api/*` 라우트에서만 일어나야 한다.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
}
if (!serviceRoleKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in .env.local");
}

export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
