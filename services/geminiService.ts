
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
    // This should only be used on the server side
    // Frontend should call API routes instead
    throw new Error("This service should not be used on the frontend. Use aiService.ts instead.");
}

export const generateResumeSummary = async (jobTitle: string, experienceLevel: string): Promise<string> => {
    const prompt = `Write a professional, concise, and impactful resume summary (max 3-4 sentences) for a ${jobTitle} with ${experienceLevel} experience. Focus on achievements and unique value. Do not use placeholders.`;
    const result = await callAI([{ role: "user", content: prompt }]);
    return result || "Experienced professional with a proven track record of success and a passion for driving results.";
};

export const improveText = async (text: string): Promise<string> => {
    const prompt = `Rewrite the following resume bullet point to be professional, action-oriented, and ATS-friendly. Keep the core meaning but improve impact: "${text}"`;
    const result = await callAI([{ role: "user", content: prompt }]);
    // Clean up if AI adds quotes
    return result ? result.replace(/^"|"$/g, '') : text;
};

export const generateJobDescription = async (role: string, company: string): Promise<string> => {
    const prompt = `Generate 3 standard, impactful bullet points for a ${role} role at ${company || 'a tech company'}. Return ONLY the bullet points text.`;
    const result = await callAI([{ role: "user", content: prompt }]);
    return result || "";
};

export const generateFullResume = async (jobTitle: string, experienceLevel: string, userContext: string = ""): Promise<any> => {
    
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

    try {
        const result = await callAI([
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
        ]);

        if (!result) return null;

        const parsedData = extractJSON(result);
        
        if (!parsedData) {
            console.error("Could not extract JSON from AI response:", result);
            return null;
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

        return parsedData;

    } catch (e) {
        console.error("Critical error in generateFullResume:", e);
        return null;
    }
};
