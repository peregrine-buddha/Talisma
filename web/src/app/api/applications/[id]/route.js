import sql from "@/app/api/utils/sql";

const VALID_STAGES = [
  "sourced",
  "screened",
  "interviewing",
  "offer",
  "hired",
  "rejected",
];

// PATCH /api/applications/:id — move stage and/or change status
export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { stage, status, note } = body;

    const [current] = await sql`SELECT * FROM applications WHERE id = ${id}`;
    if (!current) {
      return Response.json({ error: "Application not found" }, { status: 404 });
    }

    if (stage !== undefined) {
      if (!VALID_STAGES.includes(stage)) {
        return Response.json({ error: "Invalid stage" }, { status: 400 });
      }

      const newStatus =
        stage === "rejected" ? "archived" : status || current.status;

      const [updated] = await sql`
        UPDATE applications
        SET stage = ${stage}, status = ${newStatus},
            stage_updated_at = now(), updated_at = now()
        WHERE id = ${id} RETURNING *`;

      await sql`
        INSERT INTO application_stage_history (application_id, from_stage, to_stage, note)
        VALUES (${id}, ${current.stage}, ${stage}, ${note || null})`;

      return Response.json({ application: updated });
    }

    if (status !== undefined) {
      const [updated] = await sql`
        UPDATE applications SET status = ${status}, updated_at = now()
        WHERE id = ${id} RETURNING *`;
      return Response.json({ application: updated });
    }

    return Response.json({ error: "Nothing to update" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/applications/:id error:", error);
    return Response.json(
      { error: "Failed to update application" },
      { status: 500 },
    );
  }
}
