import sql from "@/app/api/utils/sql";
import { callAI } from "@/app/api/utils/ai";

// POST /api/ai/interview-questions { candidate_id, job_id }
export async function POST(request) {
  try {
    const { candidate_id, job_id } = await request.json();
    if (!candidate_id || !job_id) {
      return Response.json(
        { error: "candidate_id and job_id are required" },
        { status: 400 },
      );
    }

    const [candidate] =
      await sql`SELECT * FROM candidates WHERE id = ${candidate_id}`;
    const [job] = await sql`SELECT * FROM jobs WHERE id = ${job_id}`;
    if (!candidate || !job) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    let questions = [];
    try {
      const result = await callAI(
        [
          {
            role: "system",
            content:
              "You are an expert interviewer. Generate role-specific interview questions that probe the candidate's skills and surface any gaps. For each question include the skill area it targets and what a strong answer looks like.",
          },
          {
            role: "user",
            content: JSON.stringify({
              role: {
                title: job.title,
                seniority: job.seniority,
                required_skills: job.required_skills,
              },
              candidate: {
                headline: candidate.headline,
                years: candidate.years_experience,
                skills: candidate.skills,
              },
            }),
          },
        ],
        {
          name: "interview_questions",
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    area: { type: "string" },
                    question: { type: "string" },
                    strong_answer: { type: "string" },
                  },
                  required: ["area", "question", "strong_answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      );
      questions = result.questions || [];
    } catch (aiErr) {
      console.error("Interview question generation failed:", aiErr);
      return Response.json(
        { error: "AI is unavailable right now. Please try again shortly." },
        { status: 502 },
      );
    }

    await sql`
      INSERT INTO ai_artifacts (entity_type, entity_id, artifact_type, content, model)
      VALUES ('candidate', ${candidate_id}, 'interview_questions',
        ${JSON.stringify({ job_id, job_title: job.title, questions })}, 'anthropic-claude-sonnet-4-5')`;

    return Response.json({ questions });
  } catch (error) {
    console.error("POST /api/ai/interview-questions error:", error);
    return Response.json(
      { error: "Failed to generate questions" },
      { status: 500 },
    );
  }
}
