"use client";

import type { SWRConfiguration } from "swr";
import { swrFetcher } from "@/lib/api";

// 전역 SWR 기본 옵션
// - 탭 복귀(focus) 시 자동 refetch — 기존 visibilitychange 패턴 대체
// - 5초 dedupe로 페이지 전환 시 중복 fetch 차단
// - 에러 시 재시도 1회만 (그 다음은 mutate로 수동)
export const swrConfig: SWRConfiguration = {
  fetcher: swrFetcher,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 1,
  shouldRetryOnError: false,
};
