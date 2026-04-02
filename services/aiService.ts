// Frontend service to call Next.js API routes

export const generateResumeSummary = async (jobTitle: string, experienceLevel: string): Promise<string> => {
    try {
        const response = await fetch('/api/generate-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobTitle, experienceLevel }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.summary;
    } catch (error) {
        console.error('Error generating summary:', error);
        return "Experienced professional with a proven track record of success and a passion for driving results.";
    }
};

export const improveText = async (text: string): Promise<string> => {
    try {
        const response = await fetch('/api/improve-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.improvedText;
    } catch (error) {
        console.error('Error improving text:', error);
        return text; // Return original text if improvement fails
    }
};

export const generateJobDescription = async (role: string, company: string): Promise<string> => {
    try {
        const response = await fetch('/api/improve-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                text: `Generate 3 standard, impactful bullet points for a ${role} role at ${company || 'a tech company'}. Return ONLY the bullet points text.`
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.improvedText;
    } catch (error) {
        console.error('Error generating job description:', error);
        return "";
    }
};

export const generateFullResume = async (jobTitle: string, experienceLevel: string, userContext: string = ""): Promise<any> => {
    try {
        const response = await fetch('/api/generate-resume', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ jobTitle, experienceLevel, userContext }),
        });

        if (!response.ok) {
            let errorMessage = `HTTP error! status: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // If response is not JSON, try to get text
                try {
                    const errorText = await response.text();
                    if (errorText) errorMessage = errorText;
                } catch (e2) {
                    // Ignore parsing errors
                }
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        return result.data;
    } catch (error) {
        console.error('Error generating full resume:', error);
        throw error; // Re-throw to let the component handle the error
    }
};