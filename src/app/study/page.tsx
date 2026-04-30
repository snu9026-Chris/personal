"use client";

import { useState, useCallback, useRef } from "react";
import {
  Upload, FileText, Sparkles, Loader2,
  AlertCircle, X, Brain, HardDrive
} from "lucide-react";
import type { Report } from "@/lib/types";
import ReportPreview from "@/components/ReportPreview";
import { useGoogleDrivePicker } from "@/hooks/useGoogleDrivePicker";
import { useReports } from "@/hooks/useReports";
import { uploadDocument, summarize } from "@/lib/api";
import { useToast } from "@/components/Toast";

type TabType = "upload" | "text";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const { create: createReport } = useReports();
  const toast = useToast();

  const handleFilePicked = useCallback((f: File) => setFile(f), []);
  const { openPicker, isGoogleLoading, isConfigured: isGoogleConfigured } =
    useGoogleDrivePicker(handleFilePicked);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragging(true); }, []);
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

  const handleGenerate = async () => {
    setError(null);
    setReport(null);
    setSavedId(null);
    setIsProcessing(true);

    try {
      let text = "";
      let filename = "";

      if (activeTab === "upload" && file) {
        const uploaded = await uploadDocument(file);
        text = uploaded.text;
        filename = uploaded.filename;
      } else {
        text = textInput;
        filename = "텍스트 입력";
      }

      if (!text.trim()) throw new Error("분석할 내용이 없습니다.");

      const { report: generated } = await summarize(text, filename);
      setReport({ ...generated, original_content: text });
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const saved = await createReport(report);
      setSavedId(saved.id ?? null);
      toast.success("라이브러리에 저장했습니다.");
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      toast.error(`저장 실패: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
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
        <div className="lg:w-[420px] flex-shrink-0 space-y-4">
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

          {activeTab === "upload" && (
            <div className="card p-5 space-y-4">
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

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">또는</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

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

              {!isGoogleConfigured && (
                <p className="text-xs text-gray-400 text-center leading-relaxed">
                  Google Drive 연동은 .env.local에<br />
                  <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> 설정 후 사용 가능
                </p>
              )}
            </div>
          )}

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

          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-700">오류 발생</p>
                <p className="text-sm text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

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
