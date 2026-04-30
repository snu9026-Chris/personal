"use client";

import { useMemo } from "react";
import { Activity, Loader2, Clock, Trash2, Tag } from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";
import { LOG_STATUS_CONFIG } from "@/lib/constants";
import { formatFullDate, formatTime } from "@/lib/format";
import type { LogStatus, ProjectLog } from "@/lib/types";

function groupLogsByDate(logs: ProjectLog[]) {
  const groups: Record<string, ProjectLog[]> = {};
  logs.forEach((log) => {
    const date = formatFullDate(log.logged_at);
    if (!groups[date]) groups[date] = [];
    groups[date].push(log);
  });
  return groups;
}

interface Props {
  logs: ProjectLog[];
  loading: boolean;
  onDeleteLog: (id: string) => void;
}

export default function ProjectTimeline({ logs, loading, onDeleteLog }: Props) {
  const grouped = useMemo(() => groupLogsByDate(logs), [logs]);

  return (
    <div className="lg:w-1/2 h-full px-4 md:px-6 py-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Activity size={16} className="text-brand-500" />
        <h2 className="font-bold text-gray-900 text-sm">업데이트 현황</h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-gray-300" />
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
            <Clock size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-400 text-sm font-medium">아직 로그가 없습니다</p>
          <p className="text-gray-300 text-xs mt-1">
            Claude Code에서 <code className="px-1.5 py-0.5 bg-gray-100 rounded text-brand-600 font-mono text-xs">update.recent</code> 트리거 시 자동 기록됩니다
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, dateLogs]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full flex-shrink-0">
                  {date}
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <div className="space-y-3 relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />

                {dateLogs.map((log) => {
                  const sc = LOG_STATUS_CONFIG[log.status as LogStatus] ?? LOG_STATUS_CONFIG.in_progress;
                  const StatusIcon = sc.icon;
                  return (
                    <div key={log.id} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-10 flex items-start justify-center pt-3 z-10">
                        <StatusIcon size={16} className={sc.color} fill={log.status === "completed" ? "currentColor" : "none"} />
                      </div>

                      <div className="flex-1 card p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">{log.title}</h3>
                            <span className={`badge text-xs ${sc.bg}`}>{sc.label}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-400">{formatTime(log.logged_at)}</span>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md
                                         hover:bg-red-50 text-gray-400 hover:text-red-500
                                         flex items-center justify-center transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        {log.content && <MarkdownContent content={log.content} className="mb-3" />}

                        {log.tags?.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {log.tags.map((tag) => (
                              <span key={tag} className="badge bg-gray-100 text-gray-500 text-xs">
                                <Tag size={9} className="mr-1" />{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
