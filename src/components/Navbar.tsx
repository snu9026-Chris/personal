"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Target, Home, Brain, FolderOpen, Terminal } from "lucide-react";

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
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium
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
          </div>
        </div>
      </div>
    </nav>
  );
}
