"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Target, Home, Brain, FolderOpen, Terminal, LogIn, LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const navItems = [
  { href: "/",         label: "홈",           icon: Home },
  { href: "/study",    label: "학습 내용 업로드", icon: Brain },
  { href: "/library",  label: "라이브러리",    icon: BookOpen },
  { href: "/projects", label: "진행 프로젝트", icon: FolderOpen },
  { href: "/goals",    label: "주간 목표",    icon: Target },
  { href: "/skills",   label: "스킬",         icon: Terminal },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  // 기본값 "out" — 스피너 단계 없이 바로 로그인 버튼 보이게 (iOS Safari 등에서 getUser 지연/실패 시 사용자가 갇히지 않도록)
  const [authState, setAuthState] = useState<"in" | "out">("out");
  const [email, setEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    let supabase;
    try {
      supabase = createClient();
    } catch {
      return; // env 누락 등 — 그냥 "out" 상태 유지
    }
    supabase.auth.getUser()
      .then(({ data }) => {
        if (!mounted) return;
        if (data.user) {
          setAuthState("in");
          setEmail(data.user.email ?? null);
        } else {
          setAuthState("out");
        }
      })
      .catch(() => {
        if (mounted) setAuthState("out");
      });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setAuthState("in");
        setEmail(session.user.email ?? null);
      } else {
        setAuthState("out");
        setEmail(null);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInWithGoogle() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setBusy(false);
      alert(`로그인 실패: ${error.message}`);
    }
  }

  async function signOut() {
    setBusy(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setBusy(false);
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
                            flex items-center justify-center shadow-md group-hover:shadow-brand-200
                            transition-all duration-200">
              <span className="text-white font-bold text-sm">PM</span>
            </div>
            <span className="font-bold text-gray-900 text-lg hidden sm:block">
              Personal<span className="text-brand-500"> Management</span>
            </span>
          </Link>

          {/* 네비게이션 링크 */}
          <div className="flex items-center gap-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3.5 py-2 rounded-xl text-sm font-medium
                              transition-all duration-150
                              ${isActive
                                ? "bg-brand-50 text-brand-600"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              }`}
                >
                  <Icon size={16} />
                  <span className="hidden sm:block">{label}</span>
                </Link>
              );
            })}

            {/* 인증 상태 */}
            <div className="ml-1 sm:ml-2 pl-1 sm:pl-2 border-l border-gray-200 flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {authState === "in" ? (
                <>
                  <span className="hidden md:block text-xs text-gray-500 max-w-[160px] truncate" title={email ?? ""}>
                    {email}
                  </span>
                  <button
                    onClick={signOut}
                    disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 transition-colors"
                    title="로그아웃"
                  >
                    <LogOut size={16} />
                    <span className="hidden sm:block">로그아웃</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  disabled={busy}
                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-2 rounded-xl text-sm font-semibold bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors shadow-sm"
                  title="Google 로그인"
                >
                  {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
                  <span className="hidden sm:block">Google 로그인</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
