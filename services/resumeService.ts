// Resume storage service for backend API
import { Resume } from '../types';

export const getResumes = async (userId: string): Promise<Resume[]> => {
    const response = await fetch(`/api/resumes?userId=${userId}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch resumes');
    }
    
    const data = await response.json();
    return data.resumes || [];
};

export const getResume = async (resumeId: string): Promise<Resume> => {
    const response = await fetch(`/api/resumes/${resumeId}`);
    
    if (!response.ok) {
        throw new Error('Failed to fetch resume');
    }
    
    const data = await response.json();
    return data.resume;
};

export const saveResume = async (userId: string, resume: Resume): Promise<Resume> => {
    const response = await fetch('/api/resumes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, resume }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save resume');
    }
    
    const data = await response.json();
    return data.resume;
};

export const updateResume = async (resumeId: string, resume: Partial<Resume>): Promise<Resume> => {
    const response = await fetch(`/api/resumes/${resumeId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resume }),
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update resume');
    }
    
    const data = await response.json();
    return data.resume;
};

export const deleteResume = async (resumeId: string, userId: string): Promise<void> => {
    const response = await fetch(`/api/resumes/${resumeId}?userId=${userId}`, {
        method: 'DELETE',
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete resume');
    }
};

