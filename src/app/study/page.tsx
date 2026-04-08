"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Upload, FileText, Sparkles, Save, Download, Edit3,
  CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronUp,
  X, Tag, BookOpen, Brain, Lightbulb, GraduationCap, HardDrive
} from "lucide-react";
import { Report } from "@/lib/supabase";
import { DIFFICULTY_CONFIG } from "@/lib/constants";
import ReportPreview from "@/components/ReportPreview";

// ──────────────────────────────────────────
// 타입
// ──────────────────────────────────────────
type TabType = "upload" | "text";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    gapi: any;
    google: any;
    onGooglePickerLoaded?: () => void;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ──────────────────────────────────────────
// Google Drive Picker 훅
// ──────────────────────────────────────────
function useGoogleDrivePicker(onFilePicked: (file: File) => void) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleReady, setIsGoogleReady] = useState(false);
  const tokenRef = useRef<string | null>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const apiKey   = process.env.NEXT_PUBLIC_GOOGLE_API_KEY ?? "";

  // Google API 스크립트 로드
  useEffect(() => {
    if (!clientId || !apiKey) return;

    const loadScript = (src: string) =>
      new Promise<void>((resolve) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement("script");
        s.src = src;
        s.onload = () => resolve();
        document.body.appendChild(s);
      });

    Promise.all([
      loadScript("https://apis.google.com/js/api.js"),
      loadScript("https://accounts.google.com/gsi/client"),
    ]).then(() => {
      if (window.gapi?.load) {
        window.gapi.load("picker", () => setIsGoogleReady(true));
      }
    }).catch(() => {
      // Google API 로드 실패 시 무시 (오프라인 등)
    });
  }, [clientId, apiKey]);

  const openPicker = useCallback(async () => {
    if (!clientId || !apiKey) {
      alert("Google Drive 연동을 위해 .env.local에 NEXT_PUBLIC_GOOGLE_CLIENT_ID와 NEXT_PUBLIC_GOOGLE_API_KEY를 설정해주세요.");
      return;
    }
    if (!isGoogleReady) {
      alert("Google API 로딩 중입니다. 잠시 후 다시 시도해주세요.");
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

      // Picker 열기
      const picker = new window.google.picker.PickerBuilder()
        .addView(
          new window.google.picker.DocsView()
            .setIncludeFolders(true)
            .setMimeTypes("application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword")
        )
        .setOAuthToken(token)
        .setDeveloperKey(apiKey)
        .setCallback(async (data: { action: string; docs?: { id: string; name: string }[] }) => {
          if (data.action !== window.google.picker.Action.PICKED) return;
          const doc = data.docs![0];
          setIsGoogleLoading(true);

          try {
            // Google Drive에서 파일 다운로드
            const res = await fetch(
              `https://www.googleapis.com/drive/v3/files/${doc.id}?alt=media`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const blob = await res.blob();
            const pickedFile = new File([blob], doc.name, { type: blob.type });
            onFilePicked(pickedFile);
          } catch {
            alert("파일 다운로드에 실패했습니다.");
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
  }, [clientId, apiKey, isGoogleReady, onFilePicked]);

  return { openPicker, isGoogleLoading, isConfigured: !!(clientId && apiKey) };
}

// ──────────────────────────────────────────
// 메인 컴포넌트
// ──────────────────────────────────────────
export default function StudyPage() {
  const [activeTab, setActiveTab] = useState<TabType>("upload");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFilePicked = useCallback((f: File) => setFile(f), []);
  const { openPicker, isGoogleLoading, isConfigured: isGoogleConfigured } =
    useGoogleDrivePicker(handleFilePicked);

  // ── 드래그앤드롭 ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  // ── 보고서 생성 ──
  const handleGenerate = async () => {
    setError(null);
    setReport(null);
    setSavedId(null);
    setIsProcessing(true);

    try {
      let text = "";
      let filename = "";

      if (activeTab === "upload" && file) {
        const fd = new FormData();
        fd.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error ?? "파일 업로드 실패");
        }
        const uploadData = await uploadRes.json();
        text = uploadData.text;
        filename = uploadData.filename;
      } else {
        text = textInput;
        filename = "텍스트 입력";
      }

      if (!text.trim()) throw new Error("분석할 내용이 없습니다.");

      const sumRes = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, filename }),
      });
      if (!sumRes.ok) {
        const err = await sumRes.json();
        throw new Error(err.error ?? "AI 분석 실패");
      }
      const { report: generatedReport } = await sumRes.json();
      // 재생성을 위해 원본 텍스트를 함께 보관
      setReport({ ...generatedReport, original_content: text });
      setExpandedSections(new Set([0]));
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      if (!res.ok) throw new Error("저장 실패");
      const { report: saved } = await res.json();
      setSavedId(saved.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePdfDownload = () => { if (report) window.print(); };

  const toggleSection = (idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const updateReport = (field: keyof Report, value: unknown) => {
    setReport((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const updateSection = (idx: number, field: string, value: string) => {
    if (!report) return;
    const sections = [...report.sections];
    sections[idx] = { ...sections[idx], [field]: value };
    setReport({ ...report, sections });
  };

  // ──────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* 상단 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-5">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="text-brand-500" size={24} />
            학습 노트 AI 보고서
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Word 파일 업로드 또는 Google Drive에서 선택 → Claude AI가 교육용 보고서로 정리
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        {/* ────── 입력 패널 ────── */}
        <div className="lg:w-[420px] flex-shrink-0 space-y-4">
          {/* 탭 */}
          <div className="card p-1 flex gap-1">
            {([["upload", "📄 Word 파일"], ["text", "✏️ 텍스트 입력"]] as [TabType, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium transition-all
                  ${activeTab === tab
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-gray-500 hover:bg-gray-100"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 업로드 탭 */}
          {activeTab === "upload" && (
            <div className="card p-5 space-y-4">
              {/* 드롭존 */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer
                            transition-all duration-200 group
                            ${dragging
                              ? "border-brand-400 bg-brand-50"
                              : "border-gray-200 hover:border-brand-300 hover:bg-gray-50"}`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.doc"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
                      <FileText size={28} className="text-brand-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600"
                    >
                      <X size={14} /> 제거
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                                     ${dragging ? "bg-brand-100" : "bg-gray-100 group-hover:bg-brand-50"}`}>
                      <Upload size={28} className={dragging ? "text-brand-500" : "text-gray-400 group-hover:text-brand-400"} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">
                        {dragging ? "여기에 놓아주세요!" : "Word 파일을 드래그하거나 클릭"}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">.docx, .doc 파일 지원</p>
                    </div>
                  </div>
                )}
              </div>

              {/* 구분선 */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">또는</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google Drive 버튼 */}
              <button
                onClick={openPicker}
                disabled={isGoogleLoading}
                className={`w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl
                            border-2 font-medium text-sm transition-all duration-150
                            ${isGoogleConfigured
                              ? "border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 bg-white"
                              : "border-gray-100 text-gray-400 bg-gray-50 cursor-not-allowed"
                            }`}
                title={!isGoogleConfigured ? ".env.local에 Google API 키 설정 필요" : ""}
              >
                {isGoogleLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <HardDrive size={18} />
                )}
                {isGoogleLoading ? "Google Drive 연결 중..." : "Google Drive에서 파일 선택"}
                {!isGoogleConfigured && (
                  <span className="badge bg-gray-100 text-gray-400 text-xs ml-1">설정 필요</span>
                )}
              </button>

              {/* Google Drive 설정 안내 */}
              {!isGoogleConfigured && (
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Google Drive 연동은 .env.local에<br />
                  <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> 설정 후 사용 가능
                </p>
              )}
            </div>
          )}

          {/* 텍스트 탭 */}
          {activeTab === "text" && (
            <div className="card p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학습 내용을 입력하세요
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="공부한 내용을 자유롭게 입력하세요.&#10;텍스트, 요점 정리, 강의 노트 등 모두 가능합니다."
                className="input-field min-h-[280px] resize-none text-sm"
              />
              <p className="text-xs text-gray-400 mt-2 text-right">
                {textInput.length.toLocaleString()}자
              </p>
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            onClick={handleGenerate}
            disabled={isProcessing || (activeTab === "upload" ? !file : !textInput.trim())}
            className="btn-primary w-full justify-center py-3.5 text-base shadow-md shadow-brand-200"
          >
            {isProcessing ? (
              <><Loader2 size={20} className="animate-spin" />AI가 분석 중입니다...</>
            ) : (
              <><Sparkles size={20} />AI 보고서 생성하기</>
            )}
          </button>

          {/* 에러 */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">오류 발생</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* 저장 성공 */}
          {savedId && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
              <CheckCircle size={18} className="text-emerald-500" />
              <div>
                <p className="text-sm font-medium text-emerald-700">저장 완료!</p>
                <a href="/library" className="text-sm text-emerald-600 underline">
                  내 보고서에서 확인하기 →
                </a>
              </div>
            </div>
          )}

          {/* 사용 안내 */}
          {!report && !isProcessing && (
            <div className="card p-5 bg-brand-50 border-brand-100">
              <p className="text-sm font-medium text-brand-700 mb-2">💡 사용 방법</p>
              <ol className="text-sm text-brand-600 space-y-1.5 list-decimal list-inside">
                <li>Word 파일 드래그 또는 Google Drive에서 선택</li>
                <li>AI 보고서 생성 버튼 클릭</li>
                <li>생성된 보고서를 확인하고 편집</li>
                <li>저장 또는 PDF 다운로드</li>
              </ol>
            </div>
          )}
        </div>

        {/* ────── 미리보기 패널 ────── */}
        <div className="flex-1 min-w-0" ref={previewRef}>
          {isProcessing ? (
            <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-brand-50 flex items-center justify-center">
                  <Brain size={36} className="text-brand-400" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-800">Claude AI가 분석 중입니다</p>
                <p className="text-gray-400 text-sm mt-1">학습 내용을 구조화하고 요약하는 중...</p>
              </div>
            </div>
          ) : report ? (
            <ReportPreview
              report={report}
              onSave={handleSave}
              onPdfDownload={handlePdfDownload}
              isSaving={isSaving}
              savedId={savedId}
            />
          ) : (
            <div className="card p-12 flex flex-col items-center justify-center gap-4 text-center min-h-[400px]">
              <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center">
                <FileText size={36} className="text-gray-300" />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-400">아직 생성된 보고서가 없습니다</p>
                <p className="text-gray-300 text-sm mt-1">왼쪽에서 파일을 업로드하거나 내용을 입력해주세요</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

