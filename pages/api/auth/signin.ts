import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Missing email or password' });
        }

        // For demo purposes, we'll create a mock authentication
        // In production, you'd validate against a real database
        const mockUsers = [
            { id: '1', name: 'Demo User', email: 'demo@example.com', password: 'demo123', role: 'user' as const },
            { id: '2', name: 'Test User', email: 'test@example.com', password: 'test123', role: 'user' as const }
        ];

        const user = mockUsers.find(u => u.email === email && u.password === password);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate a simple token (in production, use JWT or similar)
        const token = `token_${user.id}_${Date.now()}`;

        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            token
        });

    } catch (error) {
        console.error('Sign in error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}