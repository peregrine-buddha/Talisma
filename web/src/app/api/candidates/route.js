import sql from "@/app/api/utils/sql";

// GET /api/candidates?query=&skill=&seniority=
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");
    const skill = url.searchParams.get("skill");
    const seniority = url.searchParams.get("seniority");

    let conditions = [];
    let values = [];
    let i = 1;

    if (query) {
      conditions.push(
        `(LOWER(full_name) LIKE $${i} OR LOWER(headline) LIKE $${i} OR LOWER(location) LIKE $${i})`,
      );
      values.push(`%${query.toLowerCase()}%`);
      i++;
    }
    if (seniority && seniority !== "all") {
      conditions.push(`seniority = $${i++}`);
      values.push(seniority);
    }
    if (skill) {
      conditions.push(`skills::text ILIKE $${i++}`);
      values.push(`%${skill}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const candidates = await sql(
      `SELECT c.*,
        COALESCE(ac.app_count, 0) AS application_count
       FROM candidates c
       LEFT JOIN (
         SELECT candidate_id, COUNT(*) AS app_count
         FROM applications WHERE status = 'active' GROUP BY candidate_id
       ) ac ON ac.candidate_id = c.id
       ${where}
       ORDER BY c.created_at DESC`,
      values,
    );

    return Response.json({ candidates });
  } catch (error) {
    console.error("GET /api/candidates error:", error);
    return Response.json(
      { error: "Failed to load candidates" },
      { status: 500 },
    );
  }
}

// POST /api/candidates
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      location,
      headline,
      source,
      years_experience,
      seniority,
      skills,
      experience,
      education,
      resume_url,
      resume_text,
      ai_summary,
    } = body;

    if (!full_name || !full_name.trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    const [candidate] = await sql(
      `INSERT INTO candidates
        (full_name, email, phone, location, headline, source, years_experience,
         seniority, skills, experience, education, resume_url, resume_text, parse_status, ai_summary)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [
        full_name.trim(),
        email || null,
        phone || null,
        location || null,
        headline || null,
        source || "manual",
        years_experience || 0,
        seniority || null,
        JSON.stringify(skills || []),
        JSON.stringify(experience || []),
        JSON.stringify(education || []),
        resume_url || null,
        resume_text || null,
        resume_text ? "parsed" : "manual",
        ai_summary || null,
      ],
    );

    return Response.json({ candidate });
  } catch (error) {
    console.error("POST /api/candidates error:", error);
    return Response.json(
      { error: "Failed to create candidate" },
      { status: 500 },
    );
  }
}
