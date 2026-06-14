import sql from "@/app/api/utils/sql";

// GET /api/analytics — org-wide recruiting metrics for the dashboard
export async function GET() {
  try {
    const [
      [jobStats],
      stageCounts,
      [hireCycle],
      [offerStats],
      sourceBreakdown,
    ] = await sql.transaction([
      sql`SELECT
          COUNT(*) FILTER (WHERE status = 'open')::int AS open_jobs,
          COUNT(*) FILTER (WHERE status = 'draft')::int AS draft_jobs,
          COUNT(*)::int AS total_jobs
        FROM jobs`,
      sql`SELECT stage, COUNT(*)::int AS count
          FROM applications WHERE status = 'active'
          GROUP BY stage`,
      sql`SELECT
          AVG(EXTRACT(EPOCH FROM (h.created_at - a.created_at)) / 86400)::numeric(10,1) AS avg_days_to_hire
          FROM application_stage_history h
          JOIN applications a ON a.id = h.application_id
          WHERE h.to_stage = 'hired'`,
      sql`SELECT
          COUNT(*) FILTER (WHERE stage = 'offer')::int AS offers,
          COUNT(*) FILTER (WHERE stage = 'hired')::int AS hires
          FROM applications`,
      sql`SELECT source, COUNT(*)::int AS count
          FROM applications GROUP BY source ORDER BY count DESC`,
    ]);

    const stages = ["sourced", "screened", "interviewing", "offer", "hired"];
    const stageMap = Object.fromEntries(
      stageCounts.map((s) => [s.stage, s.count]),
    );
    const funnel = stages.map((stage) => ({
      stage,
      count: stageMap[stage] || 0,
    }));

    const totalActive = funnel.reduce((sum, f) => sum + f.count, 0);

    return Response.json({
      jobStats: jobStats || { open_jobs: 0, draft_jobs: 0, total_jobs: 0 },
      funnel,
      totalActive,
      avgDaysToHire: hireCycle?.avg_days_to_hire
        ? Number(hireCycle.avg_days_to_hire)
        : null,
      offerAcceptance:
        offerStats && offerStats.offers + offerStats.hires > 0
          ? Math.round(
              (offerStats.hires / (offerStats.offers + offerStats.hires)) * 100,
            )
          : null,
      sourceBreakdown,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return Response.json(
      { error: "Failed to load analytics" },
      { status: 500 },
    );
  }
}
