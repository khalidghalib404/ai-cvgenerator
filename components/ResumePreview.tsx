import React from 'react';
import { Resume } from '../types';
import { MapPin, Mail, Phone, Globe, Linkedin } from 'lucide-react';

interface ResumePreviewProps {
    resume: Resume;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume }) => {
    const { personalInfo, summary, experience, education, skills, colorAccent } = resume;

    return (
        <div 
            id="resume-preview"
            className="w-[210mm] min-h-[297mm] mx-auto bg-white shadow-2xl print:shadow-none p-[10mm] md:p-[15mm] text-slate-800 relative overflow-hidden"
            style={{ fontSize: '10.5pt' }}
        >
            {/* Header */}
            <header className="border-b-2 pb-6 mb-6" style={{ borderColor: colorAccent }}>
                <h1 className="text-4xl font-bold tracking-tight mb-2 text-slate-900 uppercase">
                    {personalInfo.fullName || "Your Name"}
                </h1>
                <p className="text-lg font-medium mb-4" style={{ color: colorAccent }}>
                    {personalInfo.jobTitle || "Professional Title"}
                </p>
                
                <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                    {personalInfo.email && (
                        <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{personalInfo.email}</span>
                        </div>
                    )}
                    {personalInfo.phone && (
                        <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            <span>{personalInfo.phone}</span>
                        </div>
                    )}
                    {personalInfo.location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{personalInfo.location}</span>
                        </div>
                    )}
                    {personalInfo.linkedin && (
                        <div className="flex items-center gap-1.5">
                            <Linkedin className="w-3.5 h-3.5" />
                            <span>{personalInfo.linkedin}</span>
                        </div>
                    )}
                    {personalInfo.website && (
                        <div className="flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{personalInfo.website}</span>
                        </div>
                    )}
                </div>
            </header>

            {/* Summary */}
            {summary && (
                <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: colorAccent }}>
                        Professional Summary
                    </h2>
                    <p className="text-slate-700 leading-relaxed text-justify">
                        {summary}
                    </p>
                </section>
            )}

            {/* Experience */}
            {experience.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: colorAccent }}>
                        Work Experience
                    </h2>
                    <div className="space-y-5">
                        {experience.map((exp) => (
                            <div key={exp.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-900">{exp.position}</h3>
                                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                                        {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-slate-700 mb-2">{exp.company}</div>
                                <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                    {exp.description}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Education */}
            {education.length > 0 && (
                <section className="mb-6">
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: colorAccent }}>
                        Education
                    </h2>
                    <div className="space-y-4">
                        {education.map((edu) => (
                            <div key={edu.id}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-slate-900">{edu.school}</h3>
                                    <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                                        {edu.startDate} - {edu.endDate}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-700">
                                    {edu.degree}
                                </div>
                                {edu.description && (
                                    <p className="text-sm text-slate-600 mt-1">{edu.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Skills */}
            {skills.length > 0 && (
                <section>
                    <h2 className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2" style={{ color: colorAccent }}>
                        Skills
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill) => (
                            <span 
                                key={skill.id} 
                                className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md"
                            >
                                {skill.name}
                            </span>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};