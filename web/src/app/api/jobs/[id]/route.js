import sql from "@/app/api/utils/sql";

// GET /api/jobs/:id  — detail with pipeline + cycle metrics
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [job] = await sql`SELECT * FROM jobs WHERE id = ${id}`;
    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }

    const stageCounts = await sql`
      SELECT stage, COUNT(*)::int AS count
      FROM applications
      WHERE job_id = ${id} AND status = 'active'
      GROUP BY stage`;

    // Time-to-hire: avg days from application creation to hired stage history.
    const [cycle] = await sql`
      SELECT
        AVG(EXTRACT(EPOCH FROM (h.created_at - a.created_at)) / 86400)::numeric(10,1) AS avg_days_to_hire,
        COUNT(*)::int AS hired_total
      FROM application_stage_history h
      JOIN applications a ON a.id = h.application_id
      WHERE a.job_id = ${id} AND h.to_stage = 'hired'`;

    return Response.json({
      job,
      stageCounts,
      metrics: {
        avgDaysToHire: cycle?.avg_days_to_hire
          ? Number(cycle.avg_days_to_hire)
          : null,
        hiredTotal: cycle?.hired_total || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/jobs/:id error:", error);
    return Response.json({ error: "Failed to load job" }, { status: 500 });
  }
}

// PATCH /api/jobs/:id — update any provided fields
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();

    const allowed = [
      "title",
      "department",
      "location",
      "employment_type",
      "seniority",
      "status",
      "description",
      "required_skills",
      "nice_to_have_skills",
      "min_years",
      "salary_min",
      "salary_max",
      "target_fill_days",
    ];
    const jsonFields = ["required_skills", "nice_to_have_skills"];

    const sets = [];
    const values = [];
    let i = 1;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        sets.push(`${key} = $${i++}`);
        values.push(
          jsonFields.includes(key) ? JSON.stringify(body[key]) : body[key],
        );
      }
    }

    if (sets.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    sets.push(`updated_at = now()`);
    values.push(id);

    const [job] = await sql(
      `UPDATE jobs SET ${sets.join(", ")} WHERE id = $${i} RETURNING *`,
      values,
    );

    if (!job) {
      return Response.json({ error: "Job not found" }, { status: 404 });
    }
    return Response.json({ job });
  } catch (error) {
    console.error("PATCH /api/jobs/:id error:", error);
    return Response.json({ error: "Failed to update job" }, { status: 500 });
  }
}
