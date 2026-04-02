import { CVTemplate } from '../types';

// CV Templates with images - using placeholder images that represent different styles
// In production, replace these with actual template preview images
export const cvTemplates: CVTemplate[] = [
    {
        id: 'modern-minimal',
        name: 'Modern Minimal',
        description: 'Clean, professional design perfect for tech and creative industries. ATS-friendly layout.',
        imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=600&fit=crop',
        category: 'modern',
        layout: 'single-column',
        features: ['ATS-Friendly', 'Clean Design', 'Modern']
    },
    {
        id: 'classic-professional',
        name: 'Classic Professional',
        description: 'Traditional two-column layout trusted by recruiters. Perfect for corporate roles.',
        imageUrl: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=400&h=600&fit=crop',
        category: 'classic',
        layout: 'two-column',
        features: ['Traditional', 'Professional', 'Corporate']
    },
    {
        id: 'creative-portfolio',
        name: 'Creative Portfolio',
        description: 'Eye-catching design for designers, artists, and creative professionals.',
        imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=600&fit=crop',
        category: 'creative',
        layout: 'two-column',
        features: ['Creative', 'Visual', 'Portfolio']
    },
    {
        id: 'ats-optimized',
        name: 'ATS Optimized',
        description: 'Designed specifically to pass Applicant Tracking Systems. Maximum keyword visibility.',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=600&fit=crop',
        category: 'ats-friendly',
        layout: 'single-column',
        features: ['ATS-Friendly', 'Keyword Rich', 'Optimized']
    },
    {
        id: 'executive-summary',
        name: 'Executive Summary',
        description: 'Sophisticated layout for senior executives and C-level positions.',
        imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop',
        category: 'classic',
        layout: 'two-column',
        features: ['Executive', 'Sophisticated', 'Professional']
    },
    {
        id: 'timeline-chronological',
        name: 'Timeline Chronological',
        description: 'Visual timeline format showing career progression. Great for experienced professionals.',
        imageUrl: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=600&fit=crop',
        category: 'modern',
        layout: 'timeline',
        features: ['Timeline', 'Chronological', 'Visual']
    },
    {
        id: 'google-style',
        name: 'Google-Style Resume',
        description: 'Inspired by resumes that get you noticed at top tech companies. Clean and impactful.',
        imageUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=600&fit=crop',
        category: 'modern',
        layout: 'single-column',
        features: ['Tech Industry', 'Impactful', 'Clean']
    },
    {
        id: 'startup-founder',
        name: 'Startup Founder',
        description: 'Bold design for entrepreneurs and startup founders. Stands out from the crowd.',
        imageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=600&fit=crop',
        category: 'creative',
        layout: 'two-column',
        features: ['Bold', 'Entrepreneur', 'Standout']
    },
    {
        id: 'academic-research',
        name: 'Academic Research',
        description: 'Perfect for researchers, academics, and PhD candidates. Emphasizes publications and research.',
        imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop',
        category: 'classic',
        layout: 'single-column',
        features: ['Academic', 'Research', 'Publications']
    },
    {
        id: 'student-friendly',
        name: 'Student Friendly',
        description: 'Ideal for students and recent graduates. Highlights education and internships.',
        imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=600&fit=crop',
        category: 'modern',
        layout: 'single-column',
        features: ['Student', 'Entry-Level', 'Education Focus']
    },
    {
        id: 'sales-focused',
        name: 'Sales Focused',
        description: 'Results-driven layout emphasizing achievements and metrics. Perfect for sales roles.',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=600&fit=crop',
        category: 'ats-friendly',
        layout: 'two-column',
        features: ['Results-Driven', 'Metrics', 'Sales']
    },
    {
        id: 'minimalist-elegant',
        name: 'Minimalist Elegant',
        description: 'Ultra-clean design with elegant typography. Perfect for any professional role.',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=600&fit=crop',
        category: 'modern',
        layout: 'single-column',
        features: ['Elegant', 'Minimalist', 'Universal']
    }
];

// Helper function to get template by ID
export const getTemplateById = (id: string): CVTemplate | undefined => {
    return cvTemplates.find(t => t.id === id);
};

// Helper function to get templates by category
export const getTemplatesByCategory = (category: string): CVTemplate[] => {
    if (category === 'all') return cvTemplates;
    return cvTemplates.filter(t => t.category === category);
};

