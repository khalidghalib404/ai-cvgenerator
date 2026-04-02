import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

// Robust JSON extractor to handle Markdown or conversational wrapping
function extractJSON(text: string): any {
    try {
        // 1. Try direct parse first
        return JSON.parse(text);
    } catch (e) {
        // 2. Extract JSON object between curly braces
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        
        if (start !== -1 && end !== -1 && end > start) {
            const jsonStr = text.substring(start, end + 1);
            try {
                return JSON.parse(jsonStr);
            } catch (e2) {
                console.error("Failed to parse extracted JSON string:", jsonStr);
                return null;
            }
        }
        return null;
    }
}

// Helper to call OpenRouter
async function callAI(messages: any[]) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error("API Key is missing. Please ensure OPENROUTER_API_KEY is set in environment variables.");
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.NEXTAUTH_URL || "http://localhost:3000",
                "X-Title": "resuAI",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemini-2.0-flash-001",
                messages: messages,
                temperature: 0.7,
                top_p: 0.9,
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`AI API Error (${response.status}):`, errorText);
            throw new Error(`AI API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("AI Service Exception:", error);
        throw error;
    }
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { jobTitle, experienceLevel, userContext = "" } = req.body;

        if (!jobTitle || !experienceLevel) {
            return res.status(400).json({ error: 'Missing required fields: jobTitle and experienceLevel' });
        }

        const systemPrompt = `You are an expert resume writer and data structure specialist. 
        Your task is to generate a valid JSON object representing a resume for a "${experienceLevel}" level "${jobTitle}".
        
        RULES:
        1. Return ONLY valid JSON. No markdown formatting (no \`\`\`json), no conversational text.
        2. Use the provided USER CONTEXT to fill in details. If context is missing, generate realistic, high-quality placeholder data typical for this role.
        3. Ensure specific fields like 'current' are booleans, not strings.
        `;

        const userPrompt = `
        TARGET ROLE: ${jobTitle}
        EXPERIENCE LEVEL: ${experienceLevel}
        
        USER CONTEXT (Use this data if available):
        "${userContext}"

        REQUIRED JSON STRUCTURE:
        {
            "personalInfo": {
                "fullName": "Name",
                "email": "Email",
                "phone": "Phone",
                "linkedin": "LinkedIn URL",
                "website": "Portfolio URL",
                "location": "City, State",
                "jobTitle": "${jobTitle}"
            },
            "summary": "Professional summary string...",
            "experience": [
                {
                    "id": "1",
                    "company": "Company Name",
                    "position": "Role Title",
                    "startDate": "MM/YYYY",
                    "endDate": "Present",
                    "current": true,
                    "description": "• Achievement 1\\n• Achievement 2\\n• Achievement 3"
                }
            ],
            "education": [
                {
                    "id": "1",
                    "school": "University Name",
                    "degree": "Degree Name",
                    "startDate": "YYYY",
                    "endDate": "YYYY",
                    "description": "Honors or details"
                }
            ],
            "skills": [
                { "id": "1", "name": "Skill 1", "level": "Expert" },
                { "id": "2", "name": "Skill 2", "level": "Advanced" }
            ]
        }
        `;

        const result = await callAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);

        if (!result) {
            return res.status(500).json({ error: 'Failed to generate resume content' });
        }

        const parsedData = extractJSON(result);
        
        if (!parsedData) {
            console.error("Could not extract JSON from AI response:", result);
            return res.status(500).json({ error: 'Failed to parse AI response' });
        }

        // Post-processing to ensure IDs are unique strings
        if (parsedData.experience) {
            parsedData.experience = parsedData.experience.map((exp: any, i: number) => ({
                ...exp,
                id: `exp-${Date.now()}-${i}`,
                current: Boolean(exp.current)
            }));
        }
        if (parsedData.education) {
            parsedData.education = parsedData.education.map((edu: any, i: number) => ({
                ...edu,
                id: `edu-${Date.now()}-${i}`
            }));
        }
        if (parsedData.skills) {
            parsedData.skills = parsedData.skills.map((skill: any, i: number) => ({
                ...skill,
                id: `skill-${Date.now()}-${i}`
            }));
        }

        res.status(200).json({ success: true, data: parsedData });

    } catch (error) {
        console.error("Critical error in generate-resume API:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}