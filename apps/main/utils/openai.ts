/**
 * OpenAI structured extraction utility.
 *
 * Takes a transcript and extracts:
 *   - title
 *   - summary (bullet points)
 *   - tasks (with priority & due hints)
 *   - tags
 */

import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
}

export interface ExtractedTask {
    text: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    dueHint: string | null;
    timestampHint: number | null;
}

export interface ExtractionResult {
    title: string;
    summary: string[];
    tasks: ExtractedTask[];
    tags: string[];
    languageDetected: string;
    confidence: number;
}

export interface InteractTaskSuggestion {
    text: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    dueHint: string | null;
}

export interface InteractAnswerResult {
    answer: string;
    tasks: InteractTaskSuggestion[];
}

const EXTRACTION_PROMPT = `You are an AI assistant that processes voice recording transcripts. 
Analyze the following transcript and extract structured information.

RULES:
1. Return ONLY valid JSON — no markdown, no explanation, no extra text.
2. Keep the title short and descriptive (max 10 words).
3. Summary should be 2-7 concise bullet points capturing the key points.
4. Tasks: Extract actionable to-do items mentioned by the speaker. If there are NO tasks or action items mentioned, return an empty array.
5. Tags: Extract 1-5 relevant topic tags.
6. Max 20 tasks.
7. Priority: assign HIGH for urgent/important, MEDIUM for normal, LOW for someday/maybe items.
8. Due hint: if the speaker mentions a deadline or timeframe, include it as a string (e.g., "tomorrow", "next week", "March 20"). Otherwise null.
9. Tasks must be clean and actionable: start with a verb, 4-140 characters, no trailing punctuation-only entries.
10. If a task is ambiguous, rewrite into the clearest actionable version without inventing facts.

RESPONSE SCHEMA:
    {
        "title": "string",
        "summary": ["string"],
        "tasks": [
            {
            "text": "string",
            "priority": "HIGH" | "MEDIUM" | "LOW",
            "dueHint": "string | null",
            "timestampHint": "number | null"
            }
        ],
        "tags": ["string"],
        "languageDetected": "string",
        "confidence": 0.0-1.0
}`;

export async function extractFromTranscript(transcript: string): Promise<ExtractionResult> {
    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: EXTRACTION_PROMPT },
            { role: "user", content: `TRANSCRIPT:\n\n${transcript}` },
        ],
        temperature: 0.3,
        max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");

    const parsed = JSON.parse(content) as ExtractionResult;

    // Validate and normalize
    return {
        title: parsed.title || "Untitled Recording",
        summary: Array.isArray(parsed.summary) ? parsed.summary.slice(0, 7) : [],
        tasks: Array.isArray(parsed.tasks)
            ? parsed.tasks
                .slice(0, 20)
                .map((t) => ({
                    text: (t.text || "").trim().replace(/\s+/g, " "),
                    priority: (["HIGH", "MEDIUM", "LOW"].includes(t.priority) ? t.priority : "MEDIUM") as ExtractedTask["priority"],
                    dueHint: t.dueHint ? String(t.dueHint).trim() : null,
                    timestampHint: typeof t.timestampHint === "number" ? t.timestampHint : null,
                }))
                .filter((t) => t.text.length >= 4 && t.text.length <= 140)
            : [],
        tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
        languageDetected: parsed.languageDetected || "unknown",
        confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
    };
}

/**
 * Answer a question using context from past transcripts.
 */
export async function askAboutRecordings(
    question: string,
    recordingsContext: { title: string; transcript: string; date: string }[]
): Promise<InteractAnswerResult> {
    const openai = getOpenAI();

    const contextText = recordingsContext
        .map((r, i) => `--- Recording ${i + 1}: "${r.title}" (${r.date}) ---\n${r.transcript}`)
        .join("\n\n");

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `You are Vani, a helpful voice assistant.
The user asks questions grounded in their past recordings.

Return ONLY valid JSON with this schema:
{
  "answer": "string",
  "tasks": [
    {
      "text": "string",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "dueHint": "string | null"
    }
  ]
}

Rules:
1. "answer" must be concise, accurate, and conversational.
2. If context does not contain the answer, say that clearly.
3. Add items to "tasks" ONLY if the user explicitly asks to add/create/remind/follow-up on tasks or if they clearly confirm an action item.
4. If no tasks are requested, return an empty tasks array.
5. Tasks must be actionable and 4-140 characters.
6. Never include markdown or extra keys.`,
            },
            {
                role: "user",
                content: `Here are my past recordings:\n\n${contextText}\n\nMy question: ${question}`,
            },
        ],
        temperature: 0.4,
        max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
        return {
            answer: "I couldn't find an answer based on your recordings.",
            tasks: [],
        };
    }

    try {
        const parsed = JSON.parse(content) as {
            answer?: string;
            tasks?: Array<{ text?: string; priority?: string; dueHint?: string | null }>;
        };

        const tasks: InteractTaskSuggestion[] = Array.isArray(parsed.tasks)
            ? parsed.tasks
                .map((task) => {
                    const priority: InteractTaskSuggestion["priority"] =
                        task.priority === "HIGH" || task.priority === "LOW" || task.priority === "MEDIUM"
                            ? task.priority
                            : "MEDIUM";

                    return {
                        text: (task.text || "").trim().replace(/\s+/g, " "),
                        priority,
                        dueHint: typeof task.dueHint === "string" && task.dueHint.trim().length > 0
                            ? task.dueHint.trim()
                            : null,
                    };
                })
                .filter((task) => task.text.length >= 4 && task.text.length <= 140)
                .slice(0, 10)
            : [];

        return {
            answer: (parsed.answer || "I couldn't find an answer based on your recordings.").trim(),
            tasks,
        };
    } catch {
        return {
            answer: content,
            tasks: [],
        };
    }
}