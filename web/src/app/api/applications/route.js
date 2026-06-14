import sql from "@/app/api/utils/sql";

// POST /api/applications — add a candidate to a job's pipeline
export async function POST(request) {
  try {
    const body = await request.json();
    const { job_id, candidate_id, stage, source } = body;

    if (!job_id || !candidate_id) {
      return Response.json(
        { error: "job_id and candidate_id are required" },
        { status: 400 },
      );
    }

    const existing = await sql`
      SELECT id, status FROM applications
      WHERE job_id = ${job_id} AND candidate_id = ${candidate_id}`;

    if (existing.length > 0) {
      // Re-activate if previously archived, otherwise report conflict.
      if (existing[0].status !== "active") {
        const [reactivated] = await sql`
          UPDATE applications SET status = 'active', updated_at = now()
          WHERE id = ${existing[0].id} RETURNING *`;
        return Response.json({ application: reactivated });
      }
      return Response.json(
        {
          error: "Candidate is already in this pipeline",
          application_id: existing[0].id,
        },
        { status: 409 },
      );
    }

    const initialStage = stage || "sourced";
    const [application] = await sql`
      INSERT INTO applications (job_id, candidate_id, stage, source)
      VALUES (${job_id}, ${candidate_id}, ${initialStage}, ${source || "sourced"})
      RETURNING *`;

    await sql`
      INSERT INTO application_stage_history (application_id, from_stage, to_stage)
      VALUES (${application.id}, NULL, ${initialStage})`;

    return Response.json({ application });
  } catch (error) {
    console.error("POST /api/applications error:", error);
    return Response.json(
      { error: "Failed to add candidate to pipeline" },
      { status: 500 },
    );
  }
}
