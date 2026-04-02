// Authentication service for backend API

export interface SignUpData {
    name: string;
    email: string;
    password: string;
}

export interface SignInData {
    email: string;
    password: string;
}

export interface AuthResponse {
    success: boolean;
    user: {
        id: string;
        name: string;
        email: string;
        role: 'user' | 'admin';
        avatar?: string;
    };
    token: string;
}

export const signUp = async (data: SignUpData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sign up failed');
    }

    return response.json();
};

export const signIn = async (data: SignInData): Promise<AuthResponse> => {
    const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Sign in failed');
    }

    return response.json();
};

