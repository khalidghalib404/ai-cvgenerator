import React, { useState } from 'react';
import { Resume } from '../types';
import { Button, Input, TextArea } from './UIComponents';
import { generateResumeSummary, improveText } from '../services/aiService';
import { ChatBot } from './ChatBot';
import { 
    FileText, 
    Sparkles, 
    Download, 
    ArrowLeft,
    Plus,
    Trash2,
    Wand2
} from 'lucide-react';

interface EditorProps {
    resume: Resume;
    onResumeChange: (resume: Resume) => void;
    onBack?: () => void;
}

export const Editor: React.FC<EditorProps> = ({ resume, onResumeChange, onBack }) => {
    const [activeSection, setActiveSection] = useState<'personal' | 'summary' | 'experience' | 'education' | 'skills'>('personal');
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

    const updateResume = (updates: Partial<Resume>) => {
        onResumeChange({ ...resume, ...updates, lastModified: Date.now() });
    };

    const updatePersonalInfo = (field: string, value: string) => {
        updateResume({
            personalInfo: { ...resume.personalInfo, [field]: value }
        });
    };

    const generateSummary = async () => {
        if (!resume.personalInfo.jobTitle) return;
        
        setIsGeneratingSummary(true);
        try {
            const summary = await generateResumeSummary(resume.personalInfo.jobTitle, 'Mid-Level');
            updateResume({ summary });
        } catch (error) {
            console.error('Failed to generate summary:', error);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const addExperience = () => {
        const newExp = {
            id: Date.now().toString(),
            company: '',
            position: '',
            startDate: '',
            endDate: '',
            current: false,
            description: ''
        };
        updateResume({
            experience: [...resume.experience, newExp]
        });
    };

    const updateExperience = (id: string, field: string, value: any) => {
        updateResume({
            experience: resume.experience.map(exp => 
                exp.id === id ? { ...exp, [field]: value } : exp
            )
        });
    };

    const removeExperience = (id: string) => {
        updateResume({
            experience: resume.experience.filter(exp => exp.id !== id)
        });
    };

    const addEducation = () => {
        const newEdu = {
            id: Date.now().toString(),
            school: '',
            degree: '',
            startDate: '',
            endDate: '',
            description: ''
        };
        updateResume({
            education: [...resume.education, newEdu]
        });
    };

    const updateEducation = (id: string, field: string, value: any) => {
        updateResume({
            education: resume.education.map(edu => 
                edu.id === id ? { ...edu, [field]: value } : edu
            )
        });
    };

    const removeEducation = (id: string) => {
        updateResume({
            education: resume.education.filter(edu => edu.id !== id)
        });
    };

    const addSkill = () => {
        const newSkill = {
            id: Date.now().toString(),
            name: '',
            level: 'Intermediate'
        };
        updateResume({
            skills: [...resume.skills, newSkill]
        });
    };

    const updateSkill = (id: string, field: string, value: any) => {
        updateResume({
            skills: resume.skills.map(skill => 
                skill.id === id ? { ...skill, [field]: value } : skill
            )
        });
    };

    const removeSkill = (id: string) => {
        updateResume({
            skills: resume.skills.filter(skill => skill.id !== id)
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {onBack && (
                            <Button variant="ghost" size="sm" onClick={onBack}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        )}
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{resume.name}</h1>
                            <p className="text-sm text-slate-500">Last modified: {new Date(resume.lastModified).toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                        </Button>
                        <Button size="sm">
                            <FileText className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Editor Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Section Navigation */}
                        <div className="bg-white rounded-xl border border-slate-200 p-4">
                            <h3 className="font-bold text-slate-900 mb-4">Resume Sections</h3>
                            <div className="space-y-2">
                                {[
                                    { key: 'personal', label: 'Personal Info' },
                                    { key: 'summary', label: 'Summary' },
                                    { key: 'experience', label: 'Experience' },
                                    { key: 'education', label: 'Education' },
                                    { key: 'skills', label: 'Skills' }
                                ].map(section => (
                                    <button
                                        key={section.key}
                                        onClick={() => setActiveSection(section.key as any)}
                                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                                            activeSection === section.key 
                                                ? 'bg-primary-100 text-primary-700 font-medium' 
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {section.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Section Editor */}
                        <div className="bg-white rounded-xl border border-slate-200 p-6">
                            {activeSection === 'personal' && (
                                <div className="space-y-4">
                                    <h3 className="font-bold text-slate-900 mb-4">Personal Information</h3>
                                    <Input
                                        label="Full Name"
                                        value={resume.personalInfo.fullName}
                                        onChange={e => updatePersonalInfo('fullName', e.target.value)}
                                        placeholder="John Doe"
                                    />
                                    <Input
                                        label="Job Title"
                                        value={resume.personalInfo.jobTitle}
                                        onChange={e => updatePersonalInfo('jobTitle', e.target.value)}
                                        placeholder="Software Engineer"
                                    />
                                    <Input
                                        label="Email"
                                        type="email"
                                        value={resume.personalInfo.email}
                                        onChange={e => updatePersonalInfo('email', e.target.value)}
                                        placeholder="john@example.com"
                                    />
                                    <Input
                                        label="Phone"
                                        value={resume.personalInfo.phone}
                                        onChange={e => updatePersonalInfo('phone', e.target.value)}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                    <Input
                                        label="Location"
                                        value={resume.personalInfo.location}
                                        onChange={e => updatePersonalInfo('location', e.target.value)}
                                        placeholder="New York, NY"
                                    />
                                    <Input
                                        label="LinkedIn"
                                        value={resume.personalInfo.linkedin}
                                        onChange={e => updatePersonalInfo('linkedin', e.target.value)}
                                        placeholder="linkedin.com/in/johndoe"
                                    />
                                </div>
                            )}

                            {activeSection === 'summary' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">Professional Summary</h3>
                                        <Button 
                                            size="sm" 
                                            variant="outline"
                                            onClick={generateSummary}
                                            isLoading={isGeneratingSummary}
                                        >
                                            <Wand2 className="w-4 h-4 mr-2" />
                                            AI Generate
                                        </Button>
                                    </div>
                                    <TextArea
                                        value={resume.summary}
                                        onChange={e => updateResume({ summary: e.target.value })}
                                        placeholder="Write a compelling professional summary..."
                                        rows={6}
                                    />
                                </div>
                            )}

                            {activeSection === 'experience' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">Work Experience</h3>
                                        <Button size="sm" onClick={addExperience}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Experience
                                        </Button>
                                    </div>
                                    
                                    {resume.experience.map((exp, index) => (
                                        <div key={exp.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-600">Experience {index + 1}</span>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => removeExperience(exp.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    label="Company"
                                                    value={exp.company}
                                                    onChange={e => updateExperience(exp.id, 'company', e.target.value)}
                                                    placeholder="Company Name"
                                                />
                                                <Input
                                                    label="Position"
                                                    value={exp.position}
                                                    onChange={e => updateExperience(exp.id, 'position', e.target.value)}
                                                    placeholder="Job Title"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    label="Start Date"
                                                    value={exp.startDate}
                                                    onChange={e => updateExperience(exp.id, 'startDate', e.target.value)}
                                                    placeholder="MM/YYYY"
                                                />
                                                <Input
                                                    label="End Date"
                                                    value={exp.endDate}
                                                    onChange={e => updateExperience(exp.id, 'endDate', e.target.value)}
                                                    placeholder="MM/YYYY or Present"
                                                    disabled={exp.current}
                                                />
                                            </div>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={exp.current}
                                                    onChange={e => updateExperience(exp.id, 'current', e.target.checked)}
                                                    className="rounded border-slate-300"
                                                />
                                                <span className="text-sm text-slate-600">Currently working here</span>
                                            </label>
                                            <TextArea
                                                label="Description"
                                                value={exp.description}
                                                onChange={e => updateExperience(exp.id, 'description', e.target.value)}
                                                placeholder="• Describe your achievements and responsibilities..."
                                                rows={4}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeSection === 'education' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">Education</h3>
                                        <Button size="sm" onClick={addEducation}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Education
                                        </Button>
                                    </div>
                                    
                                    {resume.education.map((edu, index) => (
                                        <div key={edu.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-600">Education {index + 1}</span>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => removeEducation(edu.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Input
                                                label="School/University"
                                                value={edu.school}
                                                onChange={e => updateEducation(edu.id, 'school', e.target.value)}
                                                placeholder="University Name"
                                            />
                                            <Input
                                                label="Degree"
                                                value={edu.degree}
                                                onChange={e => updateEducation(edu.id, 'degree', e.target.value)}
                                                placeholder="Bachelor of Science in Computer Science"
                                            />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input
                                                    label="Start Date"
                                                    value={edu.startDate}
                                                    onChange={e => updateEducation(edu.id, 'startDate', e.target.value)}
                                                    placeholder="YYYY"
                                                />
                                                <Input
                                                    label="End Date"
                                                    value={edu.endDate}
                                                    onChange={e => updateEducation(edu.id, 'endDate', e.target.value)}
                                                    placeholder="YYYY"
                                                />
                                            </div>
                                            <TextArea
                                                label="Description (Optional)"
                                                value={edu.description}
                                                onChange={e => updateEducation(edu.id, 'description', e.target.value)}
                                                placeholder="Honors, GPA, relevant coursework..."
                                                rows={3}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeSection === 'skills' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">Skills</h3>
                                        <Button size="sm" onClick={addSkill}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Skill
                                        </Button>
                                    </div>
                                    
                                    {resume.skills.map((skill, index) => (
                                        <div key={skill.id} className="border border-slate-200 rounded-lg p-4 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-slate-600">Skill {index + 1}</span>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost"
                                                    onClick={() => removeSkill(skill.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                            <Input
                                                label="Skill Name"
                                                value={skill.name}
                                                onChange={e => updateSkill(skill.id, 'name', e.target.value)}
                                                placeholder="e.g., JavaScript, Python, Project Management"
                                            />
                                            <div>
                                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Proficiency Level</label>
                                                <select
                                                    value={skill.level}
                                                    onChange={e => updateSkill(skill.id, 'level', e.target.value)}
                                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                >
                                                    <option value="Beginner">Beginner</option>
                                                    <option value="Intermediate">Intermediate</option>
                                                    <option value="Advanced">Advanced</option>
                                                    <option value="Expert">Expert</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Resume Preview */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm">
                            <div className="max-w-2xl mx-auto">
                                {/* Header */}
                                <div className="text-center mb-8">
                                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                        {resume.personalInfo.fullName || 'Your Name'}
                                    </h1>
                                    <p className="text-xl text-primary-600 mb-4">
                                        {resume.personalInfo.jobTitle || 'Your Job Title'}
                                    </p>
                                    <div className="flex flex-wrap justify-center gap-4 text-sm text-slate-600">
                                        {resume.personalInfo.email && <span>{resume.personalInfo.email}</span>}
                                        {resume.personalInfo.phone && <span>{resume.personalInfo.phone}</span>}
                                        {resume.personalInfo.location && <span>{resume.personalInfo.location}</span>}
                                    </div>
                                </div>

                                {/* Summary */}
                                {resume.summary && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold text-slate-900 mb-3 border-b border-slate-200 pb-1">
                                            Professional Summary
                                        </h2>
                                        <p className="text-slate-700 leading-relaxed">{resume.summary}</p>
                                    </div>
                                )}

                                {/* Experience */}
                                {resume.experience.length > 0 && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-1">
                                            Work Experience
                                        </h2>
                                        <div className="space-y-6">
                                            {resume.experience.map(exp => (
                                                <div key={exp.id}>
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="font-bold text-slate-900">{exp.position}</h3>
                                                            <p className="text-primary-600 font-medium">{exp.company}</p>
                                                        </div>
                                                        <span className="text-sm text-slate-500">
                                                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                                        </span>
                                                    </div>
                                                    {exp.description && (
                                                        <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
                                                            {exp.description}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Education */}
                                {resume.education.length > 0 && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-1">
                                            Education
                                        </h2>
                                        <div className="space-y-4">
                                            {resume.education.map(edu => (
                                                <div key={edu.id}>
                                                    <h3 className="font-bold text-slate-900">{edu.degree}</h3>
                                                    <p className="text-primary-600 font-medium">{edu.school}</p>
                                                    <p className="text-sm text-slate-500">
                                                        {edu.startDate} - {edu.endDate}
                                                    </p>
                                                    {edu.description && (
                                                        <p className="text-slate-700 text-sm mt-2">{edu.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Skills */}
                                {resume.skills.length > 0 && (
                                    <div className="mb-8">
                                        <h2 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-200 pb-1">
                                            Skills
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {resume.skills.map(skill => (
                                                <div key={skill.id} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                                                    {skill.name} {skill.level && `(${skill.level})`}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Chat Bot */}
            <ChatBot 
                resume={resume} 
                onResumeUpdate={(updates) => {
                    updateResume(updates);
                }}
            />
        </div>
    );
};