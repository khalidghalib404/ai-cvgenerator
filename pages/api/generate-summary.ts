import type { NextApiRequest, NextApiResponse } from 'next';

const API_URL = "https://openrouter.ai/api/v1/chat/completions";

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
        const { jobTitle, experienceLevel } = req.body;

        if (!jobTitle || !experienceLevel) {
            return res.status(400).json({ error: 'Missing required fields: jobTitle and experienceLevel' });
        }

        const prompt = `Write a professional, concise, and impactful resume summary (max 3-4 sentences) for a ${jobTitle} with ${experienceLevel} experience. Focus on achievements and unique value. Do not use placeholders.`;
        const result = await callAI([{ role: "user", content: prompt }]);
        
        const summary = result || "Experienced professional with a proven track record of success and a passion for driving results.";

        res.status(200).json({ success: true, summary });

    } catch (error) {
        console.error("Error in generate-summary API:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}