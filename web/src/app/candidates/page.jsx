import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, MapPin, Briefcase } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  Card,
  OutlinePill,
  StatusPill,
  PrimaryButton,
  Spinner,
  EmptyState,
} from "@/components/ui";

const SENIORITY = ["all", "Junior", "Mid", "Senior", "Lead"];

export default function CandidatesPage() {
  const [query, setQuery] = useState("");
  const [seniority, setSeniority] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["candidates", query, seniority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("query", query);
      if (seniority !== "all") params.set("seniority", seniority);
      const res = await fetch(`/api/candidates?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load candidates");
      return res.json();
    },
  });

  const candidates = data?.candidates || [];

  return (
    <AppShell
      title="Talent Pool"
      subtitle="Every candidate, enriched and ready to match against open roles."
      actions={
        <PrimaryButton
          onClick={() => (window.location.href = "/candidates/new")}
        >
          <Plus size={16} /> Add candidate
        </PrimaryButton>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, headline or location…"
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {SENIORITY.map((s) => {
            const active = s === seniority;
            const cls = active
              ? "bg-blue-50 text-blue-600 border-blue-200"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300";
            return (
              <button
                key={s}
                onClick={() => setSeniority(s)}
                className={`text-xs font-medium border rounded-full px-3 py-1.5 transition-colors duration-150 ${cls}`}
              >
                {s === "all" ? "All levels" : s}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Spinner /> Loading talent pool…
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">Could not load candidates.</p>
        </Card>
      ) : candidates.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description="Add a candidate manually or let AI parse a resume into a structured profile."
          action={
            <PrimaryButton
              onClick={() => (window.location.href = "/candidates/new")}
            >
              <Plus size={16} /> Add candidate
            </PrimaryButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candidates.map((c) => (
            <Card
              key={c.id}
              onClick={() => (window.location.href = `/candidates/${c.id}`)}
              className="p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {c.full_name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {c.headline || "—"}
                  </p>
                </div>
                <StatusPill dot="gray">{c.seniority || "—"}</StatusPill>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                <OutlinePill>
                  <MapPin size={11} /> {c.location || "Remote"}
                </OutlinePill>
                <OutlinePill>
                  <Briefcase size={11} /> {c.years_experience || 0} yrs
                </OutlinePill>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {(c.skills || []).slice(0, 4).map((s) => (
                  <OutlinePill key={s}>{s}</OutlinePill>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                {c.application_count} active application
                {c.application_count === 1 ? "" : "s"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
