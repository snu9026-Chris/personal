"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/components/Toast";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi: any;
    google: any;
    onGooglePickerLoaded?: () => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface UseGoogleDrivePickerResult {
  openPicker: () => Promise<void>;
  isGoogleLoading: boolean;
  isConfigured: boolean;
}

const SCRIPT_API = "https://apis.google.com/js/api.js";
const SCRIPT_GSI = "https://accounts.google.com/gsi/client";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    document.body.appendChild(s);
  });
}

export function useGoogleDrivePicker(
  onFilePicked: (file: File) => void,
): UseGoogleDrivePickerResult {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const tokenRef = useRef<string | null>(null);
  const toast = useToast();

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";
  const isConfigured = !!(clientId && apiKey);

  // Google API 스크립트 로드
  useEffect(() => {
    if (!isConfigured) return;

    Promise.all([loadScript(SCRIPT_API), loadScript(SCRIPT_GSI)])
      .then(() => {
        if (window.gapi?.load) {
          window.gapi.load("picker", () => setIsGoogleReady(true));
        }
      })
      .catch(() => {
        // 스크립트 로드 실패 시 무시 (오프라인 등)
      });
  }, [isConfigured]);

  const openPicker = useCallback(async () => {
    if (!isConfigured) {
      toast.error(
        "Google Drive 연동을 위해 .env.local에 NEXT_PUBLIC_GOOGLE_CLIENT_ID와 NEXT_PUBLIC_GOOGLE_API_KEY를 설정해주세요.",
      );
      return;
    }
    if (!isGoogleReady) {
      toast.info("Google API 로딩 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      // OAuth 토큰 요청
      const token = await new Promise<string>((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "https://www.googleapis.com/auth/drive.readonly",
          callback: (resp: { error?: string; access_token: string }) => {
            if (resp.error) reject(new Error(resp.error));
            else resolve(resp.access_token);
          },
        });
        client.requestAccessToken({ prompt: "" });
      });

      tokenRef.current = token;

      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView()
            .setIncludeFolders(true)
            .setMimeTypes(
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword",
            ),
        )
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .setCallback(async (data: { action: string; docs?: { id: string; name: string }[] }) => {
          if (data.action !== window.google.picker.Action.PICKED) return;
          const doc = data.docs![0];
          setIsGoogleLoading(true);

          try {
            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            const blob = await res.blob();
            const pickedFile = new File([blob], doc.name, { type: blob.type });
            onFilePicked(pickedFile);
          } catch {
            toast.error("파일 다운로드에 실패했습니다.");
          } finally {
            setIsGoogleLoading(false);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGoogleLoading(false);
    }
  }, [clientId, apiKey, isGoogleReady, isConfigured, onFilePicked, toast]);

  return { openPicker, isGoogleLoading, isConfigured };
}
