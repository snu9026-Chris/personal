"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "@/hooks/swr-config";

export default function SwrProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
