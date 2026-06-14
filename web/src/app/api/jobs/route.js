import sql from "@/app/api/utils/sql";

// GET /api/jobs?status=open&query=engineer
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const query = url.searchParams.get("query");

    let conditions = [];
    let values = [];
    let i = 1;

    if (status && status !== "all") {
      conditions.push(`j.status = $${i++}`);
      values.push(status);
    }
    if (query) {
      conditions.push(
        `(LOWER(j.title) LIKE $${i} OR LOWER(j.department) LIKE $${i} OR LOWER(j.location) LIKE $${i})`,
      );
      values.push(`%${query.toLowerCase()}%`);
      i++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const jobs = await sql(
      `SELECT j.*,
        COALESCE(a.total, 0) AS pipeline_count,
        COALESCE(a.hired, 0) AS hired_count
       FROM jobs j
       LEFT JOIN (
         SELECT job_id,
           COUNT(*) FILTER (WHERE status = 'active') AS total,
           COUNT(*) FILTER (WHERE stage = 'hired') AS hired
         FROM applications GROUP BY job_id
       ) a ON a.job_id = j.id
       ${where}
       ORDER BY j.created_at DESC`,
      values,
    );

    return Response.json({ jobs });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return Response.json({ error: "Failed to load jobs" }, { status: 500 });
  }
}

// POST /api/jobs
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      title,
      department,
      location,
      employment_type,
      seniority,
      status,
      description,
      required_skills,
      nice_to_have_skills,
      min_years,
      salary_min,
      salary_max,
      target_fill_days,
    } = body;

    if (!title || !title.trim()) {
      return Response.json({ error: "Title is required" }, { status: 400 });
    }

    const [job] = await sql(
      `INSERT INTO jobs
        (title, department, location, employment_type, seniority, status, description,
         required_skills, nice_to_have_skills, min_years, salary_min, salary_max, target_fill_days)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        title.trim(),
        department || null,
        location || null,
        employment_type || "full_time",
        seniority || null,
        status || "open",
        description || null,
        JSON.stringify(required_skills || []),
        JSON.stringify(nice_to_have_skills || []),
        min_years || 0,
        salary_min || null,
        salary_max || null,
        target_fill_days || 30,
      ],
    );

    return Response.json({ job });
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }
}
