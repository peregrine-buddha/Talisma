import { useQuery } from "@tanstack/react-query";
import { ArrowRight, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  StatCard,
  Card,
  CircularRing,
  OutlinePill,
  Spinner,
  PrimaryButton,
} from "@/components/ui";

const STAGE_LABELS = {
  sourced: "Sourced",
  screened: "Screened",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
};

function FunnelRow({ stage, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-xs font-medium text-gray-500 w-24 shrink-0">
        {STAGE_LABELS[stage] || stage}
      </span>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${pct}%`, transition: "width 200ms ease" }}
        />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-8 text-right">
        {count}
      </span>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        throw new Error("Failed to load analytics");
      }
      return res.json();
    },
  });

  const funnel = data?.funnel || [];
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
  const hired = funnel.find((f) => f.stage === "hired")?.count || 0;
  const sourced = funnel.find((f) => f.stage === "sourced")?.count || 0;
  const interviewing =
    funnel.find((f) => f.stage === "interviewing")?.count || 0;
  const conversion =
    sourced > 0
      ? Math.round((hired / (data?.totalActive || sourced)) * 100)
      : 0;

  return (
    <AppShell
      title="Hiring Command Center"
      subtitle="Predictive matching and pipeline orchestration across every open role."
      actions={
        <PrimaryButton onClick={() => (window.location.href = "/jobs")}>
          View requisitions <ArrowRight size={16} />
        </PrimaryButton>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Spinner /> Loading metrics…
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">
            Could not load metrics. Please refresh.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Open requisitions"
              value={data.jobStats.open_jobs}
              sub={`${data.jobStats.draft_jobs} in draft`}
            />
            <StatCard
              label="Active in pipeline"
              value={data.totalActive}
              sub={`${interviewing} interviewing now`}
            />
            <StatCard
              label="Avg. time to hire"
              value={
                data.avgDaysToHire != null ? `${data.avgDaysToHire}d` : "—"
              }
              sub="From sourced to hired"
            />
            <StatCard
              label="Offer acceptance"
              value={
                data.offerAcceptance != null ? `${data.offerAcceptance}%` : "—"
              }
              sub="Offers turned into hires"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Funnel */}
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">
                    Conversion funnel
                  </h2>
                  <p className="text-sm font-normal text-gray-500">
                    Active candidates by pipeline stage
                  </p>
                </div>
                <OutlinePill>
                  <TrendingUp size={12} /> Live
                </OutlinePill>
              </div>
              <div>
                {funnel.map((f) => (
                  <FunnelRow
                    key={f.stage}
                    stage={f.stage}
                    count={f.count}
                    max={maxFunnel}
                  />
                ))}
              </div>
            </Card>

            {/* Pipeline health ring */}
            <Card className="p-6 flex flex-col items-center justify-center text-center">
              <h2 className="text-base font-semibold text-gray-900 self-start">
                Pipeline health
              </h2>
              <p className="text-sm font-normal text-gray-500 self-start mb-4">
                Throughput to hire
              </p>
              <CircularRing
                value={conversion}
                size={140}
                stroke={8}
                label={`${conversion}%`}
              />
              <div className="flex items-center gap-4 mt-5">
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <CheckCircle2 size={14} className="text-green-600" /> {hired}{" "}
                  hired
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Clock size={14} className="text-orange-600" /> {interviewing}{" "}
                  in flight
                </div>
              </div>
            </Card>
          </div>

          {/* Source breakdown */}
          <Card className="p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">
              Sourcing channels
            </h2>
            <p className="text-sm font-normal text-gray-500 mb-4">
              Where active candidates entered the funnel
            </p>
            <div className="flex flex-wrap gap-2">
              {(data.sourceBreakdown || []).map((s) => (
                <OutlinePill key={s.source}>
                  {s.source} · {s.count}
                </OutlinePill>
              ))}
              {(!data.sourceBreakdown || data.sourceBreakdown.length === 0) && (
                <p className="text-sm text-gray-500">No sourcing data yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
