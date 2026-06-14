import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Sparkles,
  Plus,
  Check,
  RefreshCw,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  Card,
  Tabs,
  StatCard,
  CircularRing,
  OutlinePill,
  StatusPill,
  SoftActionPill,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  EmptyState,
  HyphenList,
  scoreColor,
  scoreDot,
  STAGE_META,
} from "@/components/ui";

const PIPELINE_STAGES = [
  "sourced",
  "screened",
  "interviewing",
  "offer",
  "hired",
];
const ALL_STAGES = [...PIPELINE_STAGES, "rejected"];

function salaryText(job) {
  if (!job.salary_min && !job.salary_max) return "Not specified";
  const fmt = (n) => `$${Math.round(n / 1000)}k`;
  if (job.salary_min && job.salary_max)
    return `${fmt(job.salary_min)} – ${fmt(job.salary_max)}`;
  return fmt(job.salary_min || job.salary_max);
}

/* ---------------- Overview ---------------- */
function Overview({ job, stageCounts, metrics }) {
  const counts = Object.fromEntries(stageCounts.map((s) => [s.stage, s.count]));
  const total = stageCounts.reduce((sum, s) => sum + s.count, 0);
  const predicted =
    metrics.avgDaysToHire != null
      ? Math.round(metrics.avgDaysToHire)
      : job.target_fill_days;
  const onTrack = predicted <= job.target_fill_days;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="In pipeline" value={total} sub="Active candidates" />
        <StatCard
          label="Predicted time to fill"
          value={`${predicted}d`}
          sub={onTrack ? "On track" : "At risk"}
        />
        <StatCard
          label="Target"
          value={`${job.target_fill_days}d`}
          sub="Goal to close"
        />
        <StatCard
          label="Avg. days to hire"
          value={
            metrics.avgDaysToHire != null ? `${metrics.avgDaysToHire}d` : "—"
          }
          sub="Historical"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Role overview
          </h2>
          <p className="text-sm font-normal text-gray-600 leading-relaxed">
            {job.description || "No description provided."}
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <OutlinePill>
              <MapPin size={12} /> {job.location || "Remote"}
            </OutlinePill>
            <OutlinePill>
              <DollarSign size={12} /> {salaryText(job)}
            </OutlinePill>
            <OutlinePill>{job.seniority || "Any level"}</OutlinePill>
            <OutlinePill>{job.min_years}+ yrs</OutlinePill>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Required skills
              </p>
              <HyphenList items={job.required_skills || []} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">
                Nice to have
              </p>
              {(job.nice_to_have_skills || []).length ? (
                <HyphenList items={job.nice_to_have_skills} />
              ) : (
                <p className="text-sm text-gray-400">—</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Stage distribution
          </h2>
          <div className="flex flex-col gap-3">
            {PIPELINE_STAGES.map((stage) => {
              const c = counts[stage] || 0;
              const pct = total > 0 ? (c / total) * 100 : 0;
              return (
                <div key={stage} className="flex items-center gap-3">
                  <CircularRing
                    value={pct}
                    size={40}
                    stroke={3}
                    color={scoreColor(pct)}
                    label={String(c)}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {STAGE_META[stage].label}
                    </p>
                    <p className="text-xs text-gray-500">
                      {Math.round(pct)}% of pipeline
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------------- Pipeline ---------------- */
function PipelineCard({ app, onMove }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a
            href={`/candidates/${app.candidate_id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate block"
          >
            {app.full_name}
          </a>
          <p className="text-xs text-gray-500 truncate">
            {app.headline || app.location}
          </p>
        </div>
        {app.score != null ? (
          <StatusPill dot={scoreDot(app.label)}>{app.score}</StatusPill>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {(app.skills || []).slice(0, 3).map((s) => (
          <OutlinePill key={s}>{s}</OutlinePill>
        ))}
      </div>
      <select
        value={app.stage}
        onChange={(e) => onMove(app.id, e.target.value)}
        className="mt-3 w-full text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
      >
        {ALL_STAGES.map((s) => (
          <option key={s} value={s}>
            {STAGE_META[s].label}
          </option>
        ))}
      </select>
    </Card>
  );
}

function Pipeline({ jobId }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["pipeline", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/applications`);
      if (!res.ok) throw new Error("Failed to load pipeline");
      return res.json();
    },
  });

  const move = useMutation({
    mutationFn: async ({ id, stage }) => {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error("Failed to move candidate");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipeline", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
        <Spinner /> Loading pipeline…
      </div>
    );
  }

  const apps = (data?.applications || []).filter((a) => a.stage !== "rejected");
  if (apps.length === 0) {
    return (
      <EmptyState
        title="Pipeline is empty"
        description="Head to the Matching tab to add your best-fit candidates."
      />
    );
  }

  const byStage = Object.fromEntries(PIPELINE_STAGES.map((s) => [s, []]));
  apps.forEach((a) => {
    if (byStage[a.stage]) byStage[a.stage].push(a);
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      {PIPELINE_STAGES.map((stage) => (
        <div key={stage} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-900">
              {STAGE_META[stage].label}
            </span>
            <span className="text-xs font-medium text-gray-400">
              {byStage[stage].length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {byStage[stage].map((app) => (
              <PipelineCard
                key={app.id}
                app={app}
                onMove={(id, s) => move.mutate({ id, stage: s })}
              />
            ))}
            {byStage[stage].length === 0 ? (
              <div className="border border-dashed border-gray-200 rounded-xl py-6 text-center text-xs text-gray-400">
                Empty
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Matching ---------------- */
function MatchRow({ match, jobId }) {
  const queryClient = useQueryClient();
  const add = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: Number(jobId),
          candidate_id: match.id,
          stage: "sourced",
        }),
      });
      if (!res.ok && res.status !== 409) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", jobId] });
      queryClient.invalidateQueries({ queryKey: ["pipeline", jobId] });
    },
  });

  const inPipeline = !!match.application_id;
  const scored = match.score != null;

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 last:border-0">
      <CircularRing
        value={scored ? match.score : 0}
        size={52}
        stroke={4}
        color={scoreColor(match.score || 0)}
        label={scored ? String(match.score) : "—"}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/candidates/${match.id}`}
            className="text-sm font-semibold text-gray-900 hover:text-blue-600"
          >
            {match.full_name}
          </a>
          {match.label ? (
            <StatusPill dot={scoreDot(match.label)}>
              {match.label} fit
            </StatusPill>
          ) : null}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {match.headline || "—"} · {match.years_experience || 0} yrs
        </p>
        {match.rationale ? (
          <p className="text-sm text-gray-600 mt-2 flex items-start gap-1.5">
            <Sparkles size={13} className="text-blue-600 mt-0.5 shrink-0" />
            {match.rationale}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {(match.matched_skills || []).map((s) => (
            <OutlinePill key={`m-${s}`}>
              <Check size={11} className="text-green-600" /> {s}
            </OutlinePill>
          ))}
          {(match.missing_skills || []).map((s) => (
            <span
              key={`x-${s}`}
              className="bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-medium text-gray-400 inline-flex items-center gap-1.5 line-through"
            >
              {s}
            </span>
          ))}
        </div>
      </div>
      <div className="shrink-0">
        {inPipeline ? (
          <StatusPill dot="blue">In pipeline</StatusPill>
        ) : (
          <SoftActionPill onClick={() => add.mutate()} disabled={add.isLoading}>
            <Plus size={13} /> Add
          </SoftActionPill>
        )}
      </div>
    </div>
  );
}

function Matching({ jobId }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["matches", jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/matches`);
      if (!res.ok) throw new Error("Failed to load matches");
      return res.json();
    },
  });

  const recompute = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}/matches`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to compute matches");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matches", jobId] });
    },
  });

  const matches = data?.matches || [];
  const hasScores = matches.some((m) => m.score != null);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Predictive candidate matches
          </h2>
          <p className="text-sm font-normal text-gray-500">
            Ranked by fit across skills, experience and seniority.
          </p>
        </div>
        <SecondaryButton
          onClick={() => recompute.mutate()}
          disabled={recompute.isLoading}
        >
          <RefreshCw
            size={14}
            className={recompute.isLoading ? "animate-spin" : ""}
          />
          {recompute.isLoading ? "Scoring…" : "Recompute"}
        </SecondaryButton>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Spinner /> Loading matches…
        </div>
      ) : !hasScores ? (
        <EmptyState
          title="No match scores yet"
          description="Run the matching engine to rank every candidate against this role."
          action={
            <PrimaryButton
              onClick={() => recompute.mutate()}
              disabled={recompute.isLoading}
            >
              <Sparkles size={16} /> Run matching
            </PrimaryButton>
          }
        />
      ) : (
        <div className="mt-2">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} jobId={jobId} />
          ))}
        </div>
      )}
    </Card>
  );
}

/* ---------------- Page ---------------- */
export default function JobDetailPage({ params }) {
  const { id } = params;
  const [tab, setTab] = useState("overview");

  const { data, isLoading, error } = useQuery({
    queryKey: ["job", id],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${id}`);
      if (!res.ok) throw new Error("Failed to load job");
      return res.json();
    },
  });

  const job = data?.job;

  const statusActions = (
    <SecondaryButton onClick={() => (window.location.href = "/jobs")}>
      <ArrowLeft size={16} /> Requisitions
    </SecondaryButton>
  );

  return (
    <AppShell
      title={job ? job.title : "Requisition"}
      subtitle={
        job
          ? `${job.department || "—"} · ${job.location || "Remote"}`
          : "Loading…"
      }
      actions={statusActions}
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Spinner /> Loading requisition…
        </div>
      ) : error || !job ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">
            Could not load this requisition.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <StatusPill dot={job.status === "open" ? "green" : "gray"}>
              {job.status}
            </StatusPill>
            <OutlinePill>{job.seniority || "Any level"}</OutlinePill>
          </div>

          <Tabs
            tabs={[
              { key: "overview", label: "Overview" },
              { key: "pipeline", label: "Pipeline" },
              { key: "matching", label: "Matching" },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "overview" ? (
            <Overview
              job={job}
              stageCounts={data.stageCounts}
              metrics={data.metrics}
            />
          ) : null}
          {tab === "pipeline" ? <Pipeline jobId={id} /> : null}
          {tab === "matching" ? <Matching jobId={id} /> : null}
        </div>
      )}
    </AppShell>
  );
}
