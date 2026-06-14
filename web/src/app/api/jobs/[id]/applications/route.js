import sql from "@/app/api/utils/sql";

// GET /api/jobs/:id/applications — pipeline for a job, joined with candidate + score
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const apps = await sql`
      SELECT
        a.id, a.stage, a.status, a.source, a.created_at, a.stage_updated_at,
        c.id AS candidate_id, c.full_name, c.headline, c.location,
        c.years_experience, c.seniority, c.skills, c.ai_summary,
        m.score, m.label
      FROM applications a
      JOIN candidates c ON c.id = a.candidate_id
      LEFT JOIN match_scores m ON m.job_id = a.job_id AND m.candidate_id = a.candidate_id
      WHERE a.job_id = ${id} AND a.status = 'active'
      ORDER BY COALESCE(m.score, 0) DESC, a.created_at DESC`;

    return Response.json({ applications: apps });
  } catch (error) {
    console.error("GET /api/jobs/:id/applications error:", error);
    return Response.json({ error: "Failed to load pipeline" }, { status: 500 });
  }
}
