import sql from "@/app/api/utils/sql";
import { computeDeterministicScore, callAI } from "@/app/api/utils/ai";

// GET /api/jobs/:id/matches — ranked candidates with cached scores
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const rows = await sql`
      SELECT c.id, c.full_name, c.headline, c.location, c.years_experience,
        c.seniority, c.skills, c.ai_summary,
        m.score, m.label, m.matched_skills, m.missing_skills, m.rationale, m.computed_at,
        a.id AS application_id, a.stage
      FROM candidates c
      LEFT JOIN match_scores m ON m.candidate_id = c.id AND m.job_id = ${id}
      LEFT JOIN applications a ON a.candidate_id = c.id AND a.job_id = ${id} AND a.status = 'active'
      ORDER BY COALESCE(m.score, -1) DESC, c.full_name ASC`;

    return Response.json({ matches: rows });
  } catch (error) {
    console.error("GET /api/jobs/:id/matches error:", error);
    return Response.json({ error: "Failed to load matches" }, { status: 500 });
  }
}

// POST /api/jobs/:id/matches — (re)compute predictive match scores for all candidates
export async function POST(request, { params }) {
  try {
    const { id } = params;
    const [job] = await sql`SELECT * FROM jobs WHERE id = ${id}`;
    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    const candidates = await sql`SELECT * FROM candidates`;

    // Deterministic scores first — always works.
    const scored = candidates.map((c) => ({
      candidate: c,
      ...computeDeterministicScore(job, c),
    }));

    // Try to enrich the top candidates with an AI rationale. Best-effort.
    const top = [...scored].sort((a, b) => b.score - a.score).slice(0, 8);
    let aiRationales = {};
    try {
      const result = await callAI(
        [
          {
            role: "system",
            content:
              "You are a senior technical recruiter. Given a role and candidates, write a concise one-sentence fit rationale for each candidate. Be specific and honest about gaps.",
          },
          {
            role: "user",
            content: JSON.stringify({
              role: {
                title: job.title,
                seniority: job.seniority,
                required_skills: job.required_skills,
                min_years: job.min_years,
              },
              candidates: top.map((s) => ({
                id: s.candidate.id,
                name: s.candidate.full_name,
                headline: s.candidate.headline,
                years: s.candidate.years_experience,
                skills: s.candidate.skills,
                matched: s.matchedSkills,
                missing: s.missingSkills,
              })),
            }),
          },
        ],
        {
          name: "match_rationales",
          schema: {
            type: "object",
            properties: {
              rationales: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    rationale: { type: "string" },
                  },
                  required: ["id", "rationale"],
                  additionalProperties: false,
                },
              },
            },
            required: ["rationales"],
            additionalProperties: false,
          },
        },
      );
      for (const r of result.rationales || []) {
        aiRationales[r.id] = r.rationale;
      }
    } catch (aiErr) {
      console.error("AI rationale generation failed, using fallback:", aiErr);
    }

    // Persist all scores (upsert).
    for (const s of scored) {
      const rationale =
        aiRationales[s.candidate.id] ||
        `${s.matchedSkills.length}/${(job.required_skills || []).length} required skills matched with ${s.candidate.years_experience || 0} yrs experience.`;
      await sql`
        INSERT INTO match_scores
          (job_id, candidate_id, score, label, matched_skills, missing_skills, rationale, model_version, computed_at)
        VALUES (${id}, ${s.candidate.id}, ${s.score}, ${s.label},
          ${JSON.stringify(s.matchedSkills)}, ${JSON.stringify(s.missingSkills)},
          ${rationale}, 'v1', now())
        ON CONFLICT (job_id, candidate_id) DO UPDATE SET
          score = EXCLUDED.score,
          label = EXCLUDED.label,
          matched_skills = EXCLUDED.matched_skills,
          missing_skills = EXCLUDED.missing_skills,
          rationale = EXCLUDED.rationale,
          computed_at = now()`;
    }

    return Response.json({ ok: true, scored: scored.length });
  } catch (error) {
    console.error("POST /api/jobs/:id/matches error:", error);
    return Response.json(
      { error: "Failed to compute matches" },
      { status: 500 },
    );
  }
}
