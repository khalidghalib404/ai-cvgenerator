
export interface PersonalInfo {
    fullName: string;
    email: string;
    phone: string;
    linkedin: string;
    website: string;
    location: string;
    jobTitle: string;
}

export interface ExperienceItem {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

export interface EducationItem {
    id: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    description: string;
}

export interface SkillItem {
    id: string;
    name: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}

export interface Resume {
    id: string;
    name: string;
    lastModified: number;
    personalInfo: PersonalInfo;
    summary: string;
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: SkillItem[];
    colorAccent: string;
    templateId?: string;
    userId?: string;
}

export type ResumeSection = 'personal' | 'summary' | 'experience' | 'education' | 'skills';

export type UserRole = 'user' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatar?: string;
}

export interface CVTemplate {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    category: 'modern' | 'classic' | 'creative' | 'ats-friendly';
    layout: 'single-column' | 'two-column' | 'timeline';
    features: string[];
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}
