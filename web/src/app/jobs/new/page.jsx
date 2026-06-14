import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, ArrowLeft } from "lucide-react";
import AppShell from "@/components/AppShell";
import {
  Card,
  PrimaryButton,
  SecondaryButton,
  OutlinePill,
} from "@/components/ui";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

function SkillEditor({ label, skills, setSkills, placeholder }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (v && !skills.includes(v)) {
      setSkills([...skills, v]);
    }
    setDraft("");
  };
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={inputCls}
        />
        <SecondaryButton onClick={add} type="button">
          <Plus size={14} /> Add
        </SecondaryButton>
      </div>
      {skills.length > 0 && (
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
      )}
    </Field>
  );
}

export default function NewJobPage() {
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    seniority: "Mid",
    employment_type: "full_time",
    status: "open",
    description: "",
    min_years: 0,
    salary_min: "",
    salary_max: "",
    target_fill_days: 30,
  });
  const [required, setRequired] = useState([]);
  const [nice, setNice] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          min_years: Number(form.min_years) || 0,
          salary_min: form.salary_min ? Number(form.salary_min) : null,
          salary_max: form.salary_max ? Number(form.salary_max) : null,
          target_fill_days: Number(form.target_fill_days) || 30,
          required_skills: required,
          nice_to_have_skills: nice,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create requisition");
      }
      return res.json();
    },
    onSuccess: (data) => {
      window.location.href = `/jobs/${data.job.id}`;
    },
    onError: (err) => setErrorMsg(err.message),
  });

  const submit = (e) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!form.title.trim()) {
      setErrorMsg("A role title is required.");
      return;
    }
    mutation.mutate();
  };

  return (
    <AppShell
      title="New requisition"
      subtitle="Define the role and requirements — matching runs automatically once it's live."
      actions={
        <SecondaryButton onClick={() => (window.location.href = "/jobs")}>
          <ArrowLeft size={16} /> Back
        </SecondaryButton>
      }
    >
      <form onSubmit={submit} className="max-w-3xl flex flex-col gap-6">
        <Card className="p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">
            Role details
          </h2>
          <Field label="Title">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Senior Backend Engineer"
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Department">
              <input
                value={form.department}
                onChange={(e) => set("department", e.target.value)}
                placeholder="Engineering"
                className={inputCls}
              />
            </Field>
            <Field label="Location">
              <input
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Remote (US)"
                className={inputCls}
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
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set("status", e.target.value)}
                className={inputCls}
              >
                <option value="open">Open</option>
                <option value="draft">Draft</option>
              </select>
            </Field>
          </div>
          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="What this person will own and the impact they'll have…"
              className={inputCls}
            />
          </Field>
        </Card>

        <Card className="p-6 flex flex-col gap-4">
          <h2 className="text-base font-semibold text-gray-900">
            Requirements
          </h2>
          <SkillEditor
            label="Required skills"
            skills={required}
            setSkills={setRequired}
            placeholder="Add a must-have skill and press Enter"
          />
          <SkillEditor
            label="Nice-to-have skills"
            skills={nice}
            setSkills={setNice}
            placeholder="Add a bonus skill and press Enter"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Min. years experience">
              <input
                type="number"
                min="0"
                value={form.min_years}
                onChange={(e) => set("min_years", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Salary min (USD)">
              <input
                type="number"
                value={form.salary_min}
                onChange={(e) => set("salary_min", e.target.value)}
                placeholder="120000"
                className={inputCls}
              />
            </Field>
            <Field label="Salary max (USD)">
              <input
                type="number"
                value={form.salary_max}
                onChange={(e) => set("salary_max", e.target.value)}
                placeholder="160000"
                className={inputCls}
              />
            </Field>
          </div>
          <Field label="Target time to fill (days)">
            <input
              type="number"
              value={form.target_fill_days}
              onChange={(e) => set("target_fill_days", e.target.value)}
              className={`${inputCls} max-w-[160px]`}
            />
          </Field>
        </Card>

        {errorMsg ? <p className="text-sm text-red-600">{errorMsg}</p> : null}

        <div className="flex items-center gap-3">
          <PrimaryButton type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? "Creating…" : "Create requisition"}
          </PrimaryButton>
          <SecondaryButton onClick={() => (window.location.href = "/jobs")}>
            Cancel
          </SecondaryButton>
        </div>
      </form>
    </AppShell>
  );
}
