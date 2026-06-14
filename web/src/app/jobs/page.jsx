import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, MapPin, Users, Search } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  Card,
  StatusPill,
  OutlinePill,
  PrimaryButton,
  Spinner,
  EmptyState,
} from "@/components/ui";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "draft", label: "Draft" },
  { key: "closed", label: "Closed" },
];

function statusDot(status) {
  if (status === "open") return "green";
  if (status === "draft") return "gray";
  return "orange";
}

export default function JobsPage() {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", filter, query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (query) params.set("query", query);
      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to load jobs");
      }
      return res.json();
    },
  });

  const jobs = data?.jobs || [];

  return (
    <AppShell
      title="Requisitions"
      subtitle="Every role, with live pipeline coverage and predicted fill timelines."
      actions={
        <PrimaryButton onClick={() => (window.location.href = "/jobs/new")}>
          <Plus size={16} /> New requisition
        </PrimaryButton>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-1 border-b border-gray-200 w-full sm:w-auto">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const cls = active
              ? "text-gray-900 font-medium border-b-2 border-blue-600 pb-2.5 -mb-[1px]"
              : "text-gray-500 font-normal border-b-2 border-transparent hover:text-gray-700 pb-2.5";
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-sm px-3 transition-colors duration-150 ${cls}`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Spinner /> Loading requisitions…
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">Could not load requisitions.</p>
        </Card>
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No requisitions yet"
          description="Create your first role to start sourcing and matching candidates."
          action={
            <PrimaryButton onClick={() => (window.location.href = "/jobs/new")}>
              <Plus size={16} /> New requisition
            </PrimaryButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job) => (
            <Card
              key={job.id}
              onClick={() => (window.location.href = `/jobs/${job.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 truncate">
                    {job.title}
                  </h3>
                  <p className="text-sm font-normal text-gray-500 mt-0.5">
                    {job.department || "—"} · {job.seniority || "Any level"}
                  </p>
                </div>
                <StatusPill dot={statusDot(job.status)}>
                  {job.status}
                </StatusPill>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <OutlinePill>
                  <MapPin size={12} /> {job.location || "Remote"}
                </OutlinePill>
                <OutlinePill>
                  <Users size={12} /> {job.pipeline_count} in pipeline
                </OutlinePill>
                {(job.required_skills || []).slice(0, 2).map((s) => (
                  <OutlinePill key={s}>{s}</OutlinePill>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
