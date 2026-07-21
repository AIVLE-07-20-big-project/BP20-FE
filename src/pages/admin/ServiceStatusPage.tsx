import { useState } from "react";
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, RefreshCw,
  ChevronRight, X, Building2, Activity, Wifi, Cpu, FileText,
  BarChart3, Bell, ShoppingBag, Search, Info
} from "lucide-react";

type ServiceStatus = "정상" | "성능 저하" | "일부 장애" | "장애" | "점검 중";
type IncidentStatus = "진행 중" | "복구 완료" | "예정 점검";

interface ServiceComponent {
  name: string;
  icon: typeof CheckCircle2;
  status: ServiceStatus;
  successRate: number;
  delay: string;
  affectedStores: number;
  lastSuccess: string;
}

interface AffectedStore {
  name: string;
  component: string;
  detected: string;
  retried: string;
  impact: string;
  status: ServiceStatus;
}

interface Incident {
  id: string;
  status: IncidentStatus;
  title: string;
  service: string;
  start: string;
  end: string;
  duration: string;
  affected: number;
  resolution: string;
}

const SERVICES: ServiceComponent[] = [
  { name: "POS 매출 동기화", icon: BarChart3, status: "정상", successRate: 99.8, delay: "평균 2.1초", affectedStores: 0, lastSuccess: "07.20 09:41" },
  { name: "온라인 주문", icon: ShoppingBag, status: "정상", successRate: 99.5, delay: "평균 1.8초", affectedStores: 0, lastSuccess: "07.20 09:42" },
  { name: "결제 상태 수집", icon: Wifi, status: "성능 저하", successRate: 96.2, delay: "평균 8.4초 (기준 3초)", affectedStores: 18, lastSuccess: "07.20 09:38" },
  { name: "AI 가계부 OCR", icon: FileText, status: "정상", successRate: 98.9, delay: "평균 4.2초", affectedStores: 0, lastSuccess: "07.20 09:40" },
  { name: "AI 전략 분석", icon: Cpu, status: "정상", successRate: 99.1, delay: "평균 12.1초", affectedStores: 0, lastSuccess: "07.20 09:39" },
  { name: "재고·발주 추천", icon: Activity, status: "정상", successRate: 99.3, delay: "평균 3.5초", affectedStores: 0, lastSuccess: "07.20 09:41" },
  { name: "앱 알림 발송", icon: Bell, status: "일부 장애", successRate: 88.4, delay: "일부 발송 지연", affectedStores: 34, lastSuccess: "07.20 09:20" },
];

const AFFECTED_STORES: AffectedStore[] = [
  { name: "성수 브루랩", component: "앱 알림 발송", detected: "09:20", retried: "09:35", impact: "알림 발송 지연 약 15분", status: "일부 장애" },
  { name: "마포 베이커리", component: "결제 상태 수집", detected: "09:28", retried: "09:42", impact: "결제 상태 갱신 지연 14분", status: "성능 저하" },
  { name: "홍대 카페오리", component: "앱 알림 발송", detected: "09:20", retried: "09:35", impact: "알림 발송 지연 약 15분", status: "일부 장애" },
  { name: "강남 피자", component: "결제 상태 수집", detected: "09:30", retried: "09:42", impact: "결제 상태 갱신 지연 12분", status: "성능 저하" },
];

const INCIDENTS: Incident[] = [
  { id: "INC-042", status: "진행 중", title: "앱 알림 발송 일부 지연", service: "앱 알림 발송", start: "09:20", end: "—", duration: "22분 이상", affected: 34, resolution: "원인 파악 중. 발송 큐 과부하 추정." },
  { id: "INC-041", status: "복구 완료", title: "결제 상태 수집 성능 저하", service: "결제 상태 수집", start: "08:45", end: "09:10", duration: "25분", affected: 18, resolution: "DB 인덱스 재구성 후 정상화." },
  { id: "MNT-012", status: "예정 점검", title: "정기 시스템 점검", service: "전체", start: "07.22 02:00", end: "07.22 04:00", duration: "2시간 예정", affected: 0, resolution: "예정된 정기 점검 (영향 최소화 예정)" },
  { id: "INC-039", status: "복구 완료", title: "POS 연동 오류", service: "POS 매출 동기화", start: "07.17 08:12", end: "07.17 09:04", duration: "52분", affected: 127, resolution: "API 게이트웨이 재시작 후 복구 완료." },
];

const STATUS_ICON: Record<ServiceStatus, typeof CheckCircle2> = {
  "정상": CheckCircle2,
  "성능 저하": AlertTriangle,
  "일부 장애": AlertTriangle,
  "장애": XCircle,
  "점검 중": Clock,
};

const STATUS_COLOR: Record<ServiceStatus, string> = {
  "정상": "text-[#0E9F6E]",
  "성능 저하": "text-amber-500",
  "일부 장애": "text-amber-500",
  "장애": "text-red-500",
  "점검 중": "text-muted-foreground",
};

const STATUS_BG: Record<ServiceStatus, string> = {
  "정상": "bg-[#0E9F6E]/8 border-[#0E9F6E]/20",
  "성능 저하": "bg-amber-50 border-amber-200",
  "일부 장애": "bg-amber-50 border-amber-200",
  "장애": "bg-red-50 border-red-200",
  "점검 중": "bg-muted border-border",
};

const INCIDENT_STYLE: Record<IncidentStatus, string> = {
  "진행 중": "bg-red-50 text-red-600 border-red-200",
  "복구 완료": "bg-[#0E9F6E]/10 text-[#0E9F6E] border-[#0E9F6E]/20",
  "예정 점검": "bg-[#246BFD]/10 text-[#246BFD] border-[#246BFD]/20",
};

const hasIssues = SERVICES.some(s => s.status !== "정상");
const issueCount = SERVICES.filter(s => s.status !== "정상").length;

interface StoreDrawerProps { store: AffectedStore; onClose: () => void; isSuperAdmin: boolean; }
function StoreDrawer({ store, onClose, isSuperAdmin }: StoreDrawerProps) {
  const [confirmReprocess, setConfirmReprocess] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-card border-l border-border h-full overflow-y-auto z-10 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-sm">{store.name}</h3>
            <div className="text-xs text-muted-foreground">{store.component}</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 flex-1">
          <div className="space-y-2 text-sm">
            {[
              { label: "영향 서비스", value: store.component },
              { label: "최초 감지", value: store.detected },
              { label: "최근 재시도", value: store.retried },
              { label: "영향 내용", value: store.impact },
            ].map(r => (
              <div key={r.label} className="flex justify-between">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold text-right">{r.value}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">타임라인</div>
            <div className="space-y-2">
              {[
                { time: store.detected, text: "장애 최초 감지", status: "error" },
                { time: store.retried, text: "자동 재처리 시도", status: "warn" },
                { time: "—", text: "복구 대기 중", status: "pending" },
              ].map((t, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${t.status === "error" ? "bg-red-500" : t.status === "warn" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                  <span className="text-muted-foreground w-10">{t.time}</span>
                  <span>{t.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 border-t border-border pt-4 space-y-2">
          {!confirmReprocess ? (
            <>
              <button onClick={() => setConfirmReprocess(true)} className="w-full h-9 flex items-center justify-center gap-1.5 text-xs font-semibold bg-[#246BFD]/10 text-[#246BFD] border border-[#246BFD]/20 rounded-xl hover:bg-[#246BFD]/20 transition-colors">
                <RefreshCw className="w-3.5 h-3.5" /> 재처리 요청
              </button>
              <button className="w-full h-9 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">담당자 확인 요청</button>
            </>
          ) : (
            <div className="bg-[#246BFD]/5 border border-[#246BFD]/20 rounded-xl p-3 space-y-2">
              <p className="text-xs text-foreground font-semibold">재처리를 요청하시겠습니까?</p>
              <p className="text-xs text-muted-foreground">재처리는 서비스 부하를 일시적으로 증가시킬 수 있습니다.</p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmReprocess(false)} className="flex-1 h-8 text-xs font-bold bg-[#246BFD] text-white rounded-xl hover:bg-[#1D4ED8] transition-colors">확인</button>
                <button onClick={() => setConfirmReprocess(false)} className="flex-1 h-8 text-xs font-semibold border border-border rounded-xl text-muted-foreground hover:bg-muted transition-colors">취소</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ServiceStatusPage() {
  const [selectedStore, setSelectedStore] = useState<AffectedStore | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [lastRefresh, setLastRefresh] = useState("09:42");

  const filteredStores = AFFECTED_STORES.filter(s =>
    s.name.includes(storeSearch) || s.component.includes(storeSearch)
  );

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-6 pt-6 pb-8 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">서비스 운영 상태</h1>
            <p className="text-sm text-muted-foreground mt-0.5">가맹점 영향 서비스의 정상 여부를 확인하고 처리 지연·장애에 대응합니다.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>마지막 확인: {lastRefresh}</span>
            <button
              onClick={() => setLastRefresh(new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }))}
              className="flex items-center gap-1 text-[#246BFD] font-semibold hover:underline"
            >
              <RefreshCw className="w-3 h-3" /> 자동 새로고침 1분
            </button>
          </div>
        </div>

        {/* Overall status banner */}
        <div className={`rounded-2xl border p-4 mb-5 flex items-center gap-4 ${hasIssues ? "bg-amber-50 border-amber-200" : "bg-[#0E9F6E]/8 border-[#0E9F6E]/20"}`}>
          {hasIssues ? <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" /> : <CheckCircle2 className="w-6 h-6 text-[#0E9F6E] flex-shrink-0" />}
          <div className="flex-1">
            <div className={`font-bold ${hasIssues ? "text-amber-800" : "text-[#0E9F6E]"}`}>
              {hasIssues ? `${issueCount}개 서비스에서 이상이 감지되었습니다` : "모든 핵심 서비스 정상"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">마지막 확인: {lastRefresh} · 영향받는 가맹점: {AFFECTED_STORES.length}개 · 진행 중 장애: {INCIDENTS.filter(i => i.status === "진행 중").length}건</div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { label: "핵심 서비스 정상률", value: `${Math.round(SERVICES.filter(s => s.status === "정상").length / SERVICES.length * 100)}%`, sub: "7개 중 5개 정상", color: "text-[#0E9F6E]" },
            { label: "영향받는 가맹점", value: `${AFFECTED_STORES.length}개`, sub: "전체 512개 중", color: "text-amber-500" },
            { label: "처리 지연 작업", value: "52건", sub: "알림·결제 처리 큐", color: "text-amber-500" },
            { label: "진행 중 장애", value: `${INCIDENTS.filter(i => i.status === "진행 중").length}건`, sub: "전일 대비 +1건", color: "text-red-500" },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-2xl p-4">
              <div className="text-xs text-muted-foreground mb-1">{k.label}</div>
              <div className={`text-2xl font-black tabular-nums ${k.color}`}>{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Service component table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-bold">서비스 구성 요소</h3>
          </div>
          <table className="w-full text-xs">
            <thead className="border-b border-border">
              <tr>
                {["서비스", "상태", "성공률", "처리 지연", "영향 가맹점", "마지막 정상 처리", ""].map(h => (
                  <th key={h} className="text-left text-muted-foreground font-semibold px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SERVICES.map(s => {
                const Icon = STATUS_ICON[s.status];
                const SvcIcon = s.icon;
                return (
                  <tr key={s.name} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SvcIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="font-semibold">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 font-bold ${STATUS_COLOR[s.status]}`}>
                        <Icon className="w-3.5 h-3.5" /> {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      <div className="flex items-center gap-1.5">
                        <div className="w-10 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${s.successRate >= 99 ? "bg-[#0E9F6E]" : s.successRate >= 95 ? "bg-amber-400" : "bg-red-400"}`}
                            style={{ width: `${s.successRate}%` }}
                          />
                        </div>
                        {s.successRate}%
                      </div>
                    </td>
                    <td className={`px-4 py-3 ${s.status !== "정상" ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>{s.delay}</td>
                    <td className={`px-4 py-3 tabular-nums ${s.affectedStores > 0 ? "text-amber-600 font-semibold" : "text-muted-foreground"}`}>
                      {s.affectedStores > 0 ? `${s.affectedStores}개` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{s.lastSuccess}</td>
                    <td className="px-4 py-3">
                      <button className="text-[#246BFD] hover:underline text-[11px] font-semibold">상세</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Affected stores */}
        {AFFECTED_STORES.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">가맹점 영향 현황</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <input
                  value={storeSearch}
                  onChange={e => setStoreSearch(e.target.value)}
                  placeholder="가맹점 또는 서비스 검색"
                  className="h-7 pl-7 pr-3 text-xs bg-muted rounded-xl focus:outline-none focus:ring-2 focus:ring-[#246BFD]/30"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    {["가맹점", "영향 서비스", "최초 감지", "최근 재시도", "영향 내용", "상태", ""].map(h => (
                      <th key={h} className="text-left text-muted-foreground font-semibold pb-2 pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStores.map((s, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">{s.component}</td>
                      <td className="py-3 pr-4 tabular-nums text-muted-foreground">{s.detected}</td>
                      <td className="py-3 pr-4 tabular-nums text-muted-foreground">{s.retried}</td>
                      <td className="py-3 pr-4 text-amber-600">{s.impact}</td>
                      <td className="py-3 pr-4">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUS_BG[s.status]} ${STATUS_COLOR[s.status]}`}>{s.status}</span>
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => setSelectedStore(s)}
                          className="text-[#246BFD] font-semibold hover:underline flex items-center gap-0.5"
                        >
                          상세 <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Incident history */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-bold mb-4">장애 및 점검 이력</h3>
          <div className="space-y-2">
            {INCIDENTS.map(inc => (
              <div key={inc.id} className={`border rounded-2xl p-4 ${inc.status === "진행 중" ? "bg-red-50/60 border-red-200" : inc.status === "예정 점검" ? "bg-[#246BFD]/5 border-[#246BFD]/15" : "bg-card border-border"}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${INCIDENT_STYLE[inc.status]}`}>{inc.status}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">{inc.id}</span>
                      <span className="text-[11px] text-muted-foreground">{inc.service}</span>
                    </div>
                    <div className="text-sm font-bold mb-1">{inc.title}</div>
                    <div className="flex gap-3 text-xs text-muted-foreground mb-2">
                      <span>시작: {inc.start}</span>
                      <span>종료: {inc.end}</span>
                      <span>지속: {inc.duration}</span>
                      {inc.affected > 0 && <span>영향 가맹점: {inc.affected}개</span>}
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      {inc.resolution}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedStore && (
        <StoreDrawer
          store={selectedStore}
          onClose={() => setSelectedStore(null)}
          isSuperAdmin={false}
        />
      )}
    </div>
  );
}
