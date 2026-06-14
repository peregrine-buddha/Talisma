import { callAI } from "@/app/api/utils/ai";

// POST /api/ai/parse-resume { resume_text }
// Returns structured candidate fields extracted from raw resume text.
export async function POST(request) {
  try {
    const { resume_text } = await request.json();
    if (!resume_text || resume_text.trim().length < 30) {
      return Response.json(
        { error: "Please paste the full resume text (at least a few lines)." },
        { status: 400 },
      );
    }

    const parsed = await callAI(
      [
        {
          role: "system",
          content:
            "You parse resumes into structured data for a recruiting system. Extract the candidate's details accurately. Infer seniority (Junior, Mid, Senior, or Lead) from titles and years. Write a concise two-sentence professional summary. Only return data present or reasonably inferable from the text.",
        },
        { role: "user", content: resume_text.slice(0, 12000) },
      ],
      {
        name: "parsed_resume",
        schema: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            email: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            location: { type: ["string", "null"] },
            headline: { type: "string" },
            years_experience: { type: "number" },
            seniority: { type: "string" },
            skills: { type: "array", items: { type: "string" } },
            experience: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  company: { type: "string" },
                  title: { type: "string" },
                  years: { type: "string" },
                },
                required: ["company", "title", "years"],
                additionalProperties: false,
              },
            },
            education: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  school: { type: "string" },
                  degree: { type: "string" },
                },
                required: ["school", "degree"],
                additionalProperties: false,
              },
            },
            ai_summary: { type: "string" },
          },
          required: [
            "full_name",
            "email",
            "phone",
            "location",
            "headline",
            "years_experience",
            "seniority",
            "skills",
            "experience",
            "education",
            "ai_summary",
          ],
          additionalProperties: false,
        },
      },
    );

    return Response.json({ parsed });
  } catch (error) {
    console.error("POST /api/ai/parse-resume error:", error);
    return Response.json(
      { error: "AI is unavailable right now. You can enter details manually." },
      { status: 502 },
    );
  }
}
