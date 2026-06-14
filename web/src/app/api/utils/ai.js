// Shared AI helper. Uses the Anthropic Claude Sonnet 4.5 integration but degrades gracefully
// if the integration is unavailable so the product keeps working.

export async function callAI(messages, jsonSchema = null) {
  const body = { messages };
  if (jsonSchema) {
    body.json_schema = jsonSchema;
  }

  const response = await fetch("/integrations/anthropic-claude-sonnet-4-5/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `AI request failed: [${response.status}] ${response.statusText}`,
    );
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI request returned no content");
  }

  if (jsonSchema) {
    return JSON.parse(content);
  }
  return content;
}

// Deterministic match scoring so ranking always works, with or without AI.
// Returns { score, label, matchedSkills, missingSkills, niceMatched }
export function computeDeterministicScore(job, candidate) {
  const norm = (s) =>
    String(s || "")
      .trim()
      .toLowerCase();
  const required = (job.required_skills || []).map(norm).filter(Boolean);
  const nice = (job.nice_to_have_skills || []).map(norm).filter(Boolean);
  const candSkills = (candidate.skills || []).map(norm).filter(Boolean);
  const candSet = new Set(candSkills);

  const matched = required.filter((s) => candSet.has(s));
  const missing = required.filter((s) => !candSet.has(s));
  const niceMatched = nice.filter((s) => candSet.has(s));

  // Skills weight: 60 points
  const skillRatio = required.length ? matched.length / required.length : 0.6;
  let score = skillRatio * 60;

  // Nice-to-have bonus: up to 15 points
  const niceRatio = nice.length ? niceMatched.length / nice.length : 0;
  score += niceRatio * 15;

  // Experience fit: 25 points
  const minYears = job.min_years || 0;
  const years = candidate.years_experience || 0;
  let expScore;
  if (minYears === 0) {
    expScore = 20;
  } else if (years >= minYears) {
    expScore = 25;
  } else {
    expScore = Math.max(0, (years / minYears) * 25 - 3);
  }
  score += expScore;

  score = Math.round(Math.max(0, Math.min(100, score)));

  let label = "Weak";
  if (score >= 80) {
    label = "Strong";
  } else if (score >= 55) {
    label = "Medium";
  }

  // Map back to the original-cased skill names for display.
  const displayMatched = (job.required_skills || []).filter((s) =>
    matched.includes(norm(s)),
  );
  const displayMissing = (job.required_skills || []).filter((s) =>
    missing.includes(norm(s)),
  );

  return {
    score,
    label,
    matchedSkills: displayMatched,
    missingSkills: displayMissing,
    niceMatched: (job.nice_to_have_skills || []).filter((s) =>
      niceMatched.includes(norm(s)),
    ),
  };
}
