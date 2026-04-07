import { NextResponse } from "next/server";
import { createRouteClient } from "./supabase-route";

// 이 앱은 단일 사용자 전용. 아래 이메일만 접근 허용.
const ALLOWED_EMAILS = new Set(["snu9026@gmail.com"]);

/**
 * API 라우트에서 호출 — 현재 요청의 Supabase 세션을 검증한다.
 * 인증되지 않았거나 화이트리스트에 없는 이메일이면 UnauthorizedError를 throw한다.
 * try/catch + handleApiError 안에서 호출할 것.
 */
export async function requireUser() {
  const supabase = await createRouteClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new UnauthorizedError("로그인이 필요합니다.");
  }
  if (!user.email || !ALLOWED_EMAILS.has(user.email.toLowerCase())) {
    throw new UnauthorizedError("이 계정은 접근 권한이 없습니다.");
  }
  return user;
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * API 에러 응답 생성 헬퍼
 */
export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * 문자열 필드 검증 — 빈 문자열 / undefined / null 체크
 */
export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${fieldName}은(는) 필수 입력입니다.`);
  }
  return value.trim();
}

/**
 * 허용된 값 목록 검증
 */
export function requireOneOf<T extends string>(value: unknown, allowed: T[], fieldName: string): T {
  if (!allowed.includes(value as T)) {
    throw new ValidationError(`${fieldName}은(는) ${allowed.join(", ")} 중 하나여야 합니다.`);
  }
  return value as T;
}

/**
 * UUID 형식 간단 검증
 */
export function requireUUID(value: unknown, fieldName: string): string {
  const s = requireString(value, fieldName);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) {
    throw new ValidationError(`${fieldName}이(가) 올바른 UUID 형식이 아닙니다.`);
  }
  return s;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * API 핸들러 래퍼 — 에러 처리를 통일
 */
export function handleApiError(err: unknown, context: string) {
  console.error(`${context}:`, err);
  if (err instanceof UnauthorizedError) {
    return apiError(err.message, 401);
  }
  if (err instanceof ValidationError) {
    return apiError(err.message, 400);
  }
  const message = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
  return apiError(message, 500);
}
