const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Add fetch polyfill for Node.js versions < 18
if (!globalThis.fetch) {
    const { default: fetch } = require('node-fetch');
    globalThis.fetch = fetch;
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to extract JSON from text
function extractJSON(text) {
    try {
        return JSON.parse(text);
    } catch (e) {
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

// Helper function to call OpenRouter API instead of direct Gemini
async function callOpenRouterAPI(messages) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
        throw new Error("OPENROUTER_API_KEY is missing. Please set it in your .env file.");
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            console.error(`OpenRouter API Error (${response.status}):`, errorText);
            throw new Error(`OpenRouter API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("OpenRouter API Exception:", error);
        throw error;
    }
}

// API Routes
app.post('/api/generate-summary', async (req, res) => {
    try {
        const { jobTitle, experienceLevel } = req.body;

        if (!jobTitle || !experienceLevel) {
            return res.status(400).json({ error: 'Missing required fields: jobTitle and experienceLevel' });
        }

        const prompt = `Write a professional, concise, and impactful resume summary (max 3-4 sentences) for a ${jobTitle} with ${experienceLevel} experience. Focus on achievements and unique value. Do not use placeholders.`;
        const result = await callOpenRouterAPI([{ role: "user", content: prompt }]);
        
        const summary = result || "Experienced professional with a proven track record of success and a passion for driving results.";

        res.status(200).json({ success: true, summary });

    } catch (error) {
        console.error("Error in generate-summary API:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post('/api/improve-text', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Missing required field: text' });
        }

        const prompt = `Rewrite the following resume bullet point to be professional, action-oriented, and ATS-friendly. Keep the core meaning but improve impact: "${text}"`;
        const result = await callOpenRouterAPI([{ role: "user", content: prompt }]);
        
        const improvedText = result ? result.replace(/^"|"$/g, '') : text;

        res.status(200).json({ success: true, improvedText });

    } catch (error) {
        console.error("Error in improve-text API:", error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

app.post('/api/generate-resume', async (req, res) => {
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
        3. Ensure specific fields like 'current' are booleans, not strings.`;

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

        const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;
        const result = await callOpenRouterAPI([
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
            parsedData.experience = parsedData.experience.map((exp, i) => ({
                ...exp,
                id: `exp-${Date.now()}-${i}`,
                current: Boolean(exp.current)
            }));
        }
        if (parsedData.education) {
            parsedData.education = parsedData.education.map((edu, i) => ({
                ...edu,
                id: `edu-${Date.now()}-${i}`
            }));
        }
        if (parsedData.skills) {
            parsedData.skills = parsedData.skills.map((skill, i) => ({
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
});

// ============================================
// FAKE STORAGE (In-Memory)
// ============================================
const users = new Map(); // userId -> user object
const resumes = new Map(); // resumeId -> resume object
const userResumes = new Map(); // userId -> [resumeId1, resumeId2, ...]

// Helper to generate session token
function generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Helper to hash password (simple for demo)
function hashPassword(password) {
    return 'hashed_' + password; // In production, use bcrypt
}

// Helper to verify password
function verifyPassword(password, hash) {
    return hash === 'hashed_' + password;
}

// ============================================
// AUTHENTICATION ENDPOINTS
// ============================================

// Sign Up
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields: name, email, password' });
        }

        // Check if user already exists
        for (const [userId, user] of users.entries()) {
            if (user.email === email) {
                return res.status(400).json({ error: 'User with this email already exists' });
            }
        }

        const userId = Date.now().toString();
        const isAdmin = email.includes('admin');
        
        const newUser = {
            id: userId,
            name: name,
            email: email,
            role: isAdmin ? 'admin' : 'user',
            avatar: `https://i.pravatar.cc/150?u=${email}`,
            createdAt: Date.now()
        };

        users.set(userId, {
            ...newUser,
            passwordHash: hashPassword(password)
        });

        const token = generateToken();
        
        res.status(201).json({
            success: true,
            user: newUser,
            token: token
        });
    } catch (error) {
        console.error("Error in signup:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Sign In
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing required fields: email, password' });
        }

        // Find user by email
        let foundUser = null;
        let foundUserId = null;
        
        for (const [userId, user] of users.entries()) {
            if (user.email === email) {
                foundUser = user;
                foundUserId = userId;
                break;
            }
        }

        if (!foundUser) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        if (!verifyPassword(password, foundUser.passwordHash)) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const { passwordHash, ...userWithoutPassword } = foundUser;
        const token = generateToken();

        res.json({
            success: true,
            user: {
                ...userWithoutPassword,
                id: foundUserId
            },
            token: token
        });
    } catch (error) {
        console.error("Error in signin:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Get current user (by token - simplified for demo)
app.get('/api/auth/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    // In a real app, verify token and get user ID
    // For demo, we'll use a simple approach
    res.json({ error: 'Token verification not implemented in demo mode' });
});

// ============================================
// CV/RESUME STORAGE ENDPOINTS
// ============================================

// Get all resumes for a user
app.get('/api/resumes', (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'Missing userId parameter' });
        }

        const resumeIds = userResumes.get(userId) || [];
        const userResumesList = resumeIds.map(id => {
            const resume = resumes.get(id);
            return resume ? { ...resume } : null;
        }).filter(r => r !== null);

        res.json({ success: true, resumes: userResumesList });
    } catch (error) {
        console.error("Error fetching resumes:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Get a single resume
app.get('/api/resumes/:id', (req, res) => {
    try {
        const resumeId = req.params.id;
        const resume = resumes.get(resumeId);

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        res.json({ success: true, resume });
    } catch (error) {
        console.error("Error fetching resume:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Save/Create a resume
app.post('/api/resumes', (req, res) => {
    try {
        const { userId, resume } = req.body;

        if (!userId || !resume) {
            return res.status(400).json({ error: 'Missing required fields: userId, resume' });
        }

        const resumeId = resume.id || Date.now().toString();
        const resumeToSave = {
            ...resume,
            id: resumeId,
            userId: userId,
            lastModified: Date.now()
        };

        resumes.set(resumeId, resumeToSave);

        // Update user-resume mapping
        const userResumeIds = userResumes.get(userId) || [];
        if (!userResumeIds.includes(resumeId)) {
            userResumeIds.push(resumeId);
            userResumes.set(userId, userResumeIds);
        }

        res.json({ success: true, resume: resumeToSave });
    } catch (error) {
        console.error("Error saving resume:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Update a resume
app.put('/api/resumes/:id', (req, res) => {
    try {
        const resumeId = req.params.id;
        const resume = resumes.get(resumeId);

        if (!resume) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const updatedResume = {
            ...resume,
            ...req.body.resume,
            id: resumeId,
            lastModified: Date.now()
        };

        resumes.set(resumeId, updatedResume);
        res.json({ success: true, resume: updatedResume });
    } catch (error) {
        console.error("Error updating resume:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Delete a resume
app.delete('/api/resumes/:id', (req, res) => {
    try {
        const resumeId = req.params.id;
        const userId = req.query.userId;

        if (!resumes.has(resumeId)) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        resumes.delete(resumeId);

        // Remove from user-resume mapping
        if (userId) {
            const userResumeIds = userResumes.get(userId) || [];
            const filtered = userResumeIds.filter(id => id !== resumeId);
            userResumes.set(userId, filtered);
        }

        res.json({ success: true, message: 'Resume deleted successfully' });
    } catch (error) {
        console.error("Error deleting resume:", error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API server is running' });
});

// Test endpoint to check OpenRouter connection
app.get('/api/test-openrouter', async (req, res) => {
    try {
        const result = await callOpenRouterAPI([
            { role: "user", content: "Say 'OpenRouter connection successful!'" }
        ]);
        res.json({ 
            success: true, 
            message: "OpenRouter API is working",
            response: result
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Make sure OPENROUTER_API_KEY is set in your .env file`);
    console.log(`💾 Using in-memory storage (fake storage)`);
    console.log(`🤖 Using OpenRouter API with Gemini model`);
});

