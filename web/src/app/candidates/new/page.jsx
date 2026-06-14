import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, Sparkles, Wand2, X, Plus } from "lucide-react";
import AppShell from "@/components/AppShell";
import { Card, PrimaryButton, SecondaryButton, Spinner } from "@/components/ui";

const inputCls =
  "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

export default function NewCandidatePage() {
  const [resumeText, setResumeText] = useState("");
  const [skillDraft, setSkillDraft] = useState("");
  const [parseError, setParseError] = useState(null);
  const [saveError, setSaveError] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    location: "",
    headline: "",
    seniority: "Mid",
    years_experience: 0,
    source: "manual",
    ai_summary: "",
  });
  const [skills, setSkills] = useState([]);
  const [experience, setExperience] = useState([]);
  const [education, setEducation] = useState([]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const parse = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume_text: resumeText }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Failed to parse resume");
      }
      return res.json();
    },
    onSuccess: ({ parsed }) => {
      setForm((f) => ({
        ...f,
        full_name: parsed.full_name || f.full_name,
        email: parsed.email || "",
        phone: parsed.phone || "",
        location: parsed.location || "",
        headline: parsed.headline || "",
        seniority: parsed.seniority || "Mid",
        years_experience: parsed.years_experience || 0,
        ai_summary: parsed.ai_summary || "",
        source: "resume",
      }));
      setSkills(parsed.skills || []);
      setExperience(parsed.experience || []);
      setEducation(parsed.education || []);
    },
    onError: (err) => setParseError(err.message),
  });

  const save = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          years_experience: Number(form.years_experience) || 0,
          skills,
          experience,
          education,
          resume_text: resumeText || null,
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b.error || "Failed to save candidate");
      }
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = `/candidates/${data.candidate.id}`;
    },
    onError: (err) => setSaveError(err.message),
  });

  const addSkill = () => {
    const v = skillDraft.trim();
    if (v && !skills.includes(v)) setSkills([...skills, v]);
    setSkillDraft("");
  };

  const submit = (e) => {
    e.preventDefault();
    setSaveError(null);
    if (!form.full_name.trim()) {
      setSaveError("A candidate name is required.");
      return;
    }
    save.mutate();
  };

  return (
    <AppShell
      title="Add candidate"
      subtitle="Paste a resume to auto-build a structured profile, or enter details by hand."
      actions={
        <SecondaryButton onClick={() => (window.location.href = "/candidates")}>
          <ArrowLeft size={16} /> Back
        </SecondaryButton>
      }
    >
      <div className="max-w-3xl flex flex-col gap-6">
        {/* AI parse */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} className="text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              Smart resume import
            </h2>
          </div>
          <p className="text-sm font-normal text-gray-500 mb-3">
            Paste resume text and AI will extract skills, experience and a
            summary.
          </p>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            rows={5}
            placeholder="Paste the full resume text here…"
            className={inputCls}
          />
          {parseError ? (
            <p className="text-sm text-red-600 mt-2">{parseError}</p>
          ) : null}
          <div className="mt-3">
            <PrimaryButton
              onClick={() => {
                setParseError(null);
                parse.mutate();
              }}
              disabled={parse.isLoading || resumeText.trim().length < 30}
            >
              {parse.isLoading ? (
                <Spinner className="border-white border-t-white/40" />
              ) : (
                <Wand2 size={16} />
              )}
              {parse.isLoading ? "Parsing…" : "Parse with AI"}
            </PrimaryButton>
          </div>
        </Card>

        {/* Manual / parsed form */}
        <form onSubmit={submit} className="flex flex-col gap-6">
          <Card className="p-6 flex flex-col gap-4">
            <h2 className="text-base font-semibold text-gray-900">
              Candidate details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name">
                <input
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  className={inputCls}
                  placeholder="Jordan Avery"
                />
              </Field>
              <Field label="Headline">
                <input
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  className={inputCls}
                  placeholder="Backend engineer"
                />
              </Field>
              <Field label="Email">
                <input
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  className={inputCls}
                  placeholder="jordan@example.com"
                />
              </Field>
              <Field label="Location">
                <input
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  className={inputCls}
                  placeholder="Remote"
                />
              </Field>
              <Field label="Seniority">
                <select
                  value={form.seniority}
                  onChange={(e) => set("seniority", e.target.value)}
                  className={inputCls}
                >
                  <option>Junior</option>
                  <option>Mid</option>
                  <option>Senior</option>
                  <option>Lead</option>
                </select>
              </Field>
              <Field label="Years of experience">
                <input
                  type="number"
                  min="0"
                  value={form.years_experience}
                  onChange={(e) => set("years_experience", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Skills">
              <div className="flex gap-2">
                <input
                  value={skillDraft}
                  onChange={(e) => setSkillDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  placeholder="Add a skill and press Enter"
                  className={inputCls}
                />
                <SecondaryButton onClick={addSkill} type="button">
                  <Plus size={14} /> Add
                </SecondaryButton>
              </div>
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-1">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="bg-white border border-gray-200 rounded-full pl-3 pr-1.5 py-1 text-xs font-medium text-gray-700 inline-flex items-center gap-1.5"
                    >
                      {s}
                      <button
                        type="button"
                        onClick={() => setSkills(skills.filter((x) => x !== s))}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </Field>

            {form.ai_summary ? (
              <Field label="AI summary">
                <textarea
                  value={form.ai_summary}
                  onChange={(e) => set("ai_summary", e.target.value)}
                  rows={3}
                  className={inputCls}
                />
              </Field>
            ) : null}
          </Card>

          {saveError ? (
            <p className="text-sm text-red-600">{saveError}</p>
          ) : null}

          <div className="flex items-center gap-3">
            <PrimaryButton type="submit" disabled={save.isLoading}>
              {save.isLoading ? "Saving…" : "Save candidate"}
            </PrimaryButton>
            <SecondaryButton
              onClick={() => (window.location.href = "/candidates")}
            >
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
