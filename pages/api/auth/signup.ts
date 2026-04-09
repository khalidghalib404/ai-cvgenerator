import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // For demo purposes, we'll simulate user creation
        // In production, you'd save to a real database
        const newUser = {
            id: `user_${Date.now()}`,
            name,
            email,
            role: 'user' as const
        };

        // Generate a simple token (in production, use JWT or similar)
        const token = `token_${newUser.id}_${Date.now()}`;

        res.status(201).json({
            success: true,
            user: newUser,
            token
        });

    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}