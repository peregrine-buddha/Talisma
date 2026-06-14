import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  Card,
  Tabs,
  OutlinePill,
  StatusPill,
  PrimaryButton,
  SecondaryButton,
  Spinner,
  EmptyState,
  scoreDot,
  STAGE_META,
} from "@/components/ui";

function Profile({ candidate, applications }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 lg:col-span-2">
        <h2 className="text-base font-semibold text-gray-900 mb-1">
          AI summary
        </h2>
        <p className="text-sm text-gray-600 leading-relaxed flex items-start gap-2">
          <Sparkles size={14} className="text-blue-600 mt-0.5 shrink-0" />
          {candidate.ai_summary || "No summary generated yet."}
        </p>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {(candidate.skills || []).map((s) => (
              <OutlinePill key={s}>{s}</OutlinePill>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Experience</p>
          <div className="flex flex-col">
            {(candidate.experience || []).map((e, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-2.5 border-b border-gray-200 last:border-0"
              >
                <Briefcase size={15} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.title}</p>
                  <p className="text-xs text-gray-500">
                    {e.company} · {e.years}
                  </p>
                </div>
              </div>
            ))}
            {(candidate.experience || []).length === 0 ? (
              <p className="text-sm text-gray-400">No experience on file.</p>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-xs font-medium text-gray-500 mb-2">Education</p>
          {(candidate.education || []).map((e, idx) => (
            <div key={idx} className="flex items-start gap-3 py-1.5">
              <GraduationCap size={15} className="text-gray-400 mt-0.5" />
              <p className="text-sm text-gray-700">
                {e.degree} · <span className="text-gray-500">{e.school}</span>
              </p>
            </div>
          ))}
          {(candidate.education || []).length === 0 ? (
            <p className="text-sm text-gray-400">No education on file.</p>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Contact
          </h2>
          <div className="flex flex-col gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-2">
              <Mail size={14} className="text-gray-400" />{" "}
              {candidate.email || "—"}
            </span>
            <span className="flex items-center gap-2">
              <MapPin size={14} className="text-gray-400" />{" "}
              {candidate.location || "Remote"}
            </span>
            <span className="flex items-center gap-2">
              <Briefcase size={14} className="text-gray-400" />{" "}
              {candidate.years_experience || 0} yrs ·{" "}
              {candidate.seniority || "—"}
            </span>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            Applications
          </h2>
          {applications.length === 0 ? (
            <p className="text-sm text-gray-400">Not in any pipeline yet.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.map((a) => (
                <a
                  key={a.id}
                  href={`/jobs/${a.job_id}`}
                  className="flex items-center justify-between gap-2 group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                      {a.job_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {a.department || "—"}
                    </p>
                  </div>
                  <StatusPill dot={STAGE_META[a.stage]?.dot || "gray"}>
                    {STAGE_META[a.stage]?.label || a.stage}
                  </StatusPill>
                </a>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function InterviewKit({ candidateId, applications }) {
  const [jobId, setJobId] = useState(applications[0]?.job_id || "");
  const [questions, setQuestions] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const gen = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: Number(candidateId),
          job_id: Number(jobId),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Failed to generate questions");
      }
      return res.json();
    },
    onSuccess: (data) => setQuestions(data.questions || []),
    onError: (err) => setErrorMsg(err.message),
  });

  if (applications.length === 0) {
    return (
      <EmptyState
        title="Add this candidate to a role first"
        description="Interview kits are generated against a specific requisition's requirements."
      />
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        AI interview kit
      </h2>
      <p className="text-sm font-normal text-gray-500 mb-4">
        Role-specific questions that probe strengths and surface gaps.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-xs font-medium text-gray-500">
            Target role
          </label>
          <select
            value={jobId}
            onChange={(e) => setJobId(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            {applications.map((a) => (
              <option key={a.job_id} value={a.job_id}>
                {a.job_title}
              </option>
            ))}
          </select>
        </div>
        <PrimaryButton
          onClick={() => {
            setErrorMsg(null);
            gen.mutate();
          }}
          disabled={gen.isLoading || !jobId}
        >
          <Sparkles size={16} /> {gen.isLoading ? "Generating…" : "Generate"}
        </PrimaryButton>
      </div>

      {errorMsg ? (
        <p className="text-sm text-red-600 mt-3">{errorMsg}</p>
      ) : null}

      {gen.isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-8 justify-center">
          <Spinner /> Crafting questions…
        </div>
      ) : null}

      {questions.length > 0 ? (
        <div className="mt-5 flex flex-col gap-4">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="border-b border-gray-200 last:border-0 pb-4 last:pb-0"
            >
              <OutlinePill className="mb-2">{q.area}</OutlinePill>
              <p className="text-sm font-medium text-gray-900">{q.question}</p>
              <p className="text-sm text-gray-600 mt-1 flex items-start gap-1.5">
                <span className="text-gray-400 mr-1">-</span>
                <span>
                  <span className="font-medium text-gray-700">
                    Strong answer:
                  </span>{" "}
                  {q.strong_answer}
                </span>
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}

export default function CandidateDetailPage({ params }) {
  const { id } = params;
  const [tab, setTab] = useState("profile");

  const { data, isLoading, error } = useQuery({
    queryKey: ["candidate", id],
    queryFn: async () => {
      const res = await fetch(`/api/candidates/${id}`);
      if (!res.ok) throw new Error("Failed to load candidate");
      return res.json();
    },
  });

  const candidate = data?.candidate;
  const applications = data?.applications || [];

  return (
    <AppShell
      title={candidate ? candidate.full_name : "Candidate"}
      subtitle={
        candidate ? candidate.headline || candidate.location : "Loading…"
      }
      actions={
        <SecondaryButton onClick={() => (window.location.href = "/candidates")}>
          <ArrowLeft size={16} /> Talent pool
        </SecondaryButton>
      }
    >
      {isLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-10 justify-center">
          <Spinner /> Loading profile…
        </div>
      ) : error || !candidate ? (
        <Card className="p-6">
          <p className="text-sm text-red-600">Could not load this candidate.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          <Tabs
            tabs={[
              { key: "profile", label: "Profile" },
              { key: "interview", label: "Interview Kit" },
            ]}
            active={tab}
            onChange={setTab}
          />
          {tab === "profile" ? (
            <Profile candidate={candidate} applications={applications} />
          ) : (
            <InterviewKit candidateId={id} applications={applications} />
          )}
        </div>
      )}
    </AppShell>
  );
}
