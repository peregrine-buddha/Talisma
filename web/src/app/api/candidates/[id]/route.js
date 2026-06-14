import sql from "@/app/api/utils/sql";

// GET /api/candidates/:id — profile with applications + match context
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [candidate] = await sql`SELECT * FROM candidates WHERE id = ${id}`;
    if (!candidate) {
      return Response.json({ error: "Candidate not found" }, { status: 404 });
    }

    const applications = await sql`
      SELECT a.id, a.stage, a.status, a.created_at,
        j.id AS job_id, j.title AS job_title, j.department,
        m.score, m.label
      FROM applications a
      JOIN jobs j ON j.id = a.job_id
      LEFT JOIN match_scores m ON m.job_id = a.job_id AND m.candidate_id = a.candidate_id
      WHERE a.candidate_id = ${id}
      ORDER BY a.created_at DESC`;

    const artifacts = await sql`
      SELECT * FROM ai_artifacts
      WHERE entity_type = 'candidate' AND entity_id = ${id}
      ORDER BY created_at DESC`;

    return Response.json({ candidate, applications, artifacts });
  } catch (error) {
    console.error("GET /api/candidates/:id error:", error);
    return Response.json(
      { error: "Failed to load candidate" },
      { status: 500 },
    );
  }
}
