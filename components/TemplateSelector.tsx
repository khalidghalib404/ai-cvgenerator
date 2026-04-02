import React, { useState } from 'react';
import { CVTemplate } from '../types';
import { Check, Search, Sparkles, X, Eye, Zap, Layout, Palette, TrendingUp, ArrowRight, Star, Filter } from 'lucide-react';
import { Button } from './UIComponents';

interface TemplateSelectorProps {
    templates: CVTemplate[];
    selectedTemplate: CVTemplate | null;
    onSelectTemplate: (template: CVTemplate) => void;
    onContinue: () => void;
    onCancel: () => void;
}

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    templates,
    selectedTemplate,
    onSelectTemplate,
    onContinue,
    onCancel
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [previewTemplate, setPreviewTemplate] = useState<CVTemplate | null>(null);
    const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

    const categories = [
        { id: 'all', label: 'All Templates', icon: Layout, color: 'slate' },
        { id: 'modern', label: 'Modern', icon: Zap, color: 'blue' },
        { id: 'classic', label: 'Classic', icon: TrendingUp, color: 'amber' },
        { id: 'creative', label: 'Creative', icon: Palette, color: 'purple' },
        { id: 'ats-friendly', label: 'ATS-Friendly', icon: Check, color: 'green' }
    ];

    const filteredTemplates = templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const getCategoryColor = (category: string) => {
        const cat = categories.find(c => c.id === category);
        return cat?.color || 'slate';
    };

    return (
        <>
            <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-50 via-white to-primary-50/30 overflow-y-auto">
                {/* Animated Background Elements */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-blob"></div>
                    <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
                    <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                    {/* Header Section */}
                    <div className="mb-10 lg:mb-12">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
                                        <Sparkles className="w-6 h-6 text-white" />
                                    </div>
                        <div>
                                        <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-2 tracking-tight">
                                            Choose Your Template
                            </h1>
                                        <p className="text-lg text-slate-600">
                                            Select a professional resume template that matches your style
                            </p>
                                    </div>
                                </div>
                        </div>
                        <button
                            onClick={onCancel}
                                className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-white hover:border-slate-300 transition-all shadow-sm hover:shadow-md"
                        >
                                <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative max-w-2xl">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search templates by name or style..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm hover:shadow-md transition-all text-slate-900 placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Category Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                                <Filter className="w-4 h-4" />
                                <span>Filter:</span>
                            </div>
                            {categories.map(cat => {
                                const Icon = cat.icon;
                                const isActive = selectedCategory === cat.id;
                                
                                // Dynamic color classes based on category
                                const getActiveClasses = (color: string) => {
                                    switch(color) {
                                        case 'blue': return 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30';
                                        case 'amber': return 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30';
                                        case 'purple': return 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30';
                                        case 'green': return 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30';
                                        default: return 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-lg shadow-slate-500/30';
                                    }
                                };
                                
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => setSelectedCategory(cat.id)}
                                        className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                            isActive
                                                ? `${getActiveClasses(cat.color)} transform scale-105`
                                                : 'bg-white/80 backdrop-blur-sm text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-white hover:shadow-md'
                                        }`}
                                    >
                                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                        <span>{cat.label}</span>
                                        {isActive && (
                                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                                                {filteredTemplates.length}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                    </div>
                </div>

                {/* Templates Grid */}
                    {filteredTemplates.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-20">
                            {filteredTemplates.map((template) => {
                                const isSelected = selectedTemplate?.id === template.id;
                                const isHovered = hoveredTemplate === template.id;
                                const categoryColor = getCategoryColor(template.category);

                                return (
                        <div
                            key={template.id}
                                        onMouseEnter={() => setHoveredTemplate(template.id)}
                                        onMouseLeave={() => setHoveredTemplate(null)}
                            onClick={() => onSelectTemplate(template)}
                                        className={`group relative cursor-pointer transition-all duration-300 ${
                                            isSelected
                                                ? 'scale-[1.02]'
                                                : 'hover:scale-[1.02]'
                                        }`}
                                    >
                                        {/* Card Container */}
                                        <div className={`relative rounded-2xl overflow-hidden bg-white border-2 transition-all duration-300 ${
                                            isSelected
                                                ? 'border-primary-600 shadow-2xl shadow-primary-500/20'
                                                : 'border-slate-200 hover:border-primary-300 shadow-lg hover:shadow-xl'
                                        }`}>
                                            {/* Template Preview Image */}
                                            <div className="relative aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                                <img
                                    src={template.imageUrl}
                                    alt={template.name}
                                                    className={`w-full h-full object-cover transition-transform duration-500 ${
                                                        isHovered ? 'scale-110' : 'scale-100'
                                                    }`}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600/4f46e5/ffffff?text=' + encodeURIComponent(template.name);
                                    }}
                                />
                                                
                                                {/* Overlay Gradient */}
                                                <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                                                {/* Selection Indicator */}
                                                {isSelected && (
                                                    <div className="absolute top-4 right-4 w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                                                        <Check className="w-6 h-6 text-white" />
                                                    </div>
                                                )}

                                                {/* Preview Button on Hover */}
                                                {isHovered && !isSelected && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all duration-300">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setPreviewTemplate(template);
                                                            }}
                                                            className="px-6 py-3 bg-white/90 backdrop-blur-sm rounded-xl text-slate-900 font-semibold flex items-center gap-2 hover:bg-white hover:scale-105 transition-all shadow-lg"
                                                        >
                                                            <Eye className="w-5 h-5" />
                                                            Preview
                                                        </button>
                                    </div>
                                )}

                                                {/* Category Badge */}
                                                <div className="absolute top-4 left-4">
                                                    <span className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                                                        template.category === 'modern' ? 'bg-blue-500/90 text-white' :
                                                        template.category === 'classic' ? 'bg-amber-500/90 text-white' :
                                                        template.category === 'creative' ? 'bg-purple-500/90 text-white' :
                                                        'bg-green-500/90 text-white'
                                                    } shadow-lg`}>
                                                        {template.category}
                                                    </span>
                                                </div>
                            </div>

                            {/* Template Info */}
                                            <div className="p-5 bg-white">
                                                <div className="flex items-start justify-between mb-2">
                                                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                                                        {template.name}
                                                    </h3>
                                                    {isSelected && (
                                                        <Star className="w-5 h-5 text-primary-600 fill-primary-600" />
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                                                    {template.description}
                                                </p>
                                
                                {/* Features */}
                                                <div className="flex flex-wrap gap-2 mb-3">
                                                    {template.features.slice(0, 2).map((feature, idx) => (
                                        <span
                                            key={idx}
                                                            className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                                    {template.features.length > 2 && (
                                                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg font-medium">
                                                            +{template.features.length - 2}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Layout Badge */}
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <Layout className="w-3 h-3" />
                                                    <span className="capitalize">{template.layout.replace('-', ' ')}</span>
                                                </div>
                                </div>

                                            {/* Selection Glow Effect */}
                                            {isSelected && (
                                                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-600 to-purple-600 rounded-2xl blur opacity-75 -z-10 animate-pulse"></div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                                </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">No templates found</h3>
                            <p className="text-slate-600 mb-6">Try adjusting your search or filter criteria</p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedCategory('all');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}

                    {/* Sticky Footer Actions */}
                    <div className="fixed bottom-0 left-0 right-0 z-20 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-2xl">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    {selectedTemplate ? (
                                        <>
                                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-purple-600 flex items-center justify-center">
                                                <Check className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">
                                                    {selectedTemplate.name} selected
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Ready to customize
                                                </p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Sparkles className="w-5 h-5 text-primary-600" />
                                            <span className="text-sm font-medium">
                                                Select a template to continue
                                            </span>
                    </div>
                )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onCancel}
                                        className="px-6"
                                    >
                                Cancel
                            </Button>
                            <Button
                                onClick={onContinue}
                                disabled={!selectedTemplate}
                                        leftIcon={<ArrowRight className="w-4 h-4" />}
                                        className="px-8 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Continue with Template
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
            </div>

            {/* Preview Modal */}
            {previewTemplate && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setPreviewTemplate(null)}
                >
                    <div
                        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between z-10">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">{previewTemplate.name}</h2>
                                <p className="text-sm text-slate-600 mt-1">{previewTemplate.description}</p>
                            </div>
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Preview Image */}
                        <div className="p-6">
                            <div className="relative aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                                <img
                                    src={previewTemplate.imageUrl}
                                    alt={previewTemplate.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x600/4f46e5/ffffff?text=' + encodeURIComponent(previewTemplate.name);
                                    }}
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-200 p-6 flex items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                                {previewTemplate.features.map((feature, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                                    >
                                        {feature}
                                    </span>
                                ))}
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setPreviewTemplate(null)}
                                >
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        onSelectTemplate(previewTemplate);
                                        setPreviewTemplate(null);
                                    }}
                                    leftIcon={<Check className="w-4 h-4" />}
                                    className="bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700"
                                >
                                    Use This Template
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
