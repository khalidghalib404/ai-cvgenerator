
import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { Resume, User, UserRole, CVTemplate } from './types';
import { Editor } from './components/Editor';
import { Button, Card, Input, TextArea } from './components/UIComponents';
import { generateFullResume } from './services/aiService';
import { signUp, signIn } from './services/authService';
import { getResumes, saveResume } from './services/resumeService';
import { TemplateSelector } from './components/TemplateSelector';
import { cvTemplates } from './data/templates';
import { 
    FileText, 
    Sparkles, 
    CheckCircle2, 
    ArrowRight, 
    Layout, 
    ShieldCheck, 
    Star, 
    PlayCircle, 
    Zap, 
    MousePointerClick,
    Download,
    Users,
    Menu,
    X,
    Cpu,
    Bot,
    PenTool,
    Loader2,
    Quote,
    LogOut,
    Settings,
    BarChart3,
    Lock,
    Mail,
    User as UserIcon
} from 'lucide-react';

// --- Initial Data ---
const initialResume: Resume = {
    id: '1',
    name: 'My Professional Resume',
    lastModified: Date.now(),
    colorAccent: '#4f46e5', // Indigo-600
    personalInfo: {
        fullName: '',
        email: '',
        phone: '',
        linkedin: '',
        website: '',
        location: '',
        jobTitle: ''
    },
    summary: '',
    experience: [],
    education: [],
    skills: []
};

type View = 'landing' | 'auth' | 'dashboard' | 'admin-dashboard' | 'editor';
type AuthMode = 'signin' | 'signup';

// Isolated AI Form Component using uncontrolled inputs to prevent re-renders
const AIFormInputs = memo(({ 
    initialJobTitle,
    initialExpLevel,
    initialUserData,
    isGeneratingFull,
    onGenerate
}: {
    initialJobTitle: string;
    initialExpLevel: string;
    initialUserData: string;
    isGeneratingFull: boolean;
    onGenerate: (jobTitle: string, expLevel: string, userData: string) => void;
}) => {
    const jobTitleRef = useRef<HTMLInputElement>(null);
    const userDataRef = useRef<HTMLTextAreaElement>(null);
    const expLevelRef = useRef<string>(initialExpLevel);
    const [selectedExpLevel, setSelectedExpLevel] = useState(initialExpLevel);

    const handleGenerate = useCallback(() => {
        const jobTitle = jobTitleRef.current?.value || '';
        const userData = userDataRef.current?.value || '';
        if (jobTitle && !isGeneratingFull) {
            onGenerate(jobTitle, expLevelRef.current, userData);
        }
    }, [isGeneratingFull, onGenerate]);

    return (
        <div className="space-y-4">
            <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Target Job Title
                </label>
                <input
                    ref={jobTitleRef}
                    type="text"
                    defaultValue={initialJobTitle}
                    placeholder="e.g. Senior Product Manager"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleGenerate();
                        }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                />
            </div>
            
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Experience Level</label>
                <div className="flex flex-wrap gap-2">
                    {['Intern', 'Junior', 'Mid-Level', 'Senior', 'Executive'].map(level => (
                        <button 
                            key={level}
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                expLevelRef.current = level;
                                setSelectedExpLevel(level);
                            }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedExpLevel === level ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-slate-600 border-slate-200 hover:border-primary-300'}`}
                        >
                            {level}
                        </button>
                    ))}
                </div>
            </div>

            <div className="w-full">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    Paste Your Details (Optional)
                </label>
                <textarea
                    ref={userDataRef}
                    defaultValue={initialUserData}
                    placeholder="Paste your existing resume content, LinkedIn bio, or a rough list of your skills and experience here. The AI will organize it for you."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical h-64"
                />
            </div>

            <Button 
                type="button"
                className="w-full py-3 text-base" 
                disabled={isGeneratingFull}
                isLoading={isGeneratingFull}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleGenerate();
                }}
                leftIcon={<Sparkles className="w-5 h-5" />}
            >
                {isGeneratingFull ? 'Generating...' : 'Generate Resume'}
            </Button>
        </div>
    );
});

AIFormInputs.displayName = 'AIFormInputs';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('landing');
    const [authMode, setAuthMode] = useState<AuthMode>('signup');
    const [user, setUser] = useState<User | null>(null);
    const [currentResume, setCurrentResume] = useState<Resume>(initialResume);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [userResumes, setUserResumes] = useState<Resume[]>([]);
    const [isLoadingResumes, setIsLoadingResumes] = useState(false);
    
    // Template Selection State
    const [showTemplateSelector, setShowTemplateSelector] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<CVTemplate | null>(null);
    
    // AI Onboarding State
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiJobTitle, setAiJobTitle] = useState("");
    const [aiExpLevel, setAiExpLevel] = useState("Mid-Level");
    const [aiUserData, setAiUserData] = useState("");
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);

    // Check for session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('resuai_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            loadUserResumes(parsedUser.id);
        }
    }, []);

    // Load user resumes from backend
    const loadUserResumes = async (userId: string) => {
        setIsLoadingResumes(true);
        try {
            const resumes = await getResumes(userId);
            setUserResumes(resumes);
        } catch (error) {
            console.error('Failed to load resumes:', error);
        } finally {
            setIsLoadingResumes(false);
        }
    };

    // Logic to route users based on role
    const routeUser = (u: User) => {
        if (u.role === 'admin') {
            setCurrentView('admin-dashboard');
        } else {
            setCurrentView('dashboard');
        }
    };

    const handleStartBuilding = () => {
        if (!user) {
            alert('You have to sign in first in order to go further. Please sign in or sign up to continue.');
            setAuthMode('signin');
            setCurrentView('auth');
        } else {
            // Show template selector first
            setShowTemplateSelector(true);
        }
    };

    const handleTemplateSelected = () => {
        if (!selectedTemplate) return;
        setShowTemplateSelector(false);
        setIsAIModalOpen(true);
    };

    const handleLogout = () => {
        localStorage.removeItem('resuai_user');
        setUser(null);
        setCurrentView('landing');
    };

    const handleManualStart = async () => {
        setIsAIModalOpen(false);
        if (!user) return;
        
        const newResume: Resume = {
            ...initialResume,
            id: Date.now().toString(),
            name: selectedTemplate?.name || 'My Resume',
            templateId: selectedTemplate?.id
        };
        
        try {
            const savedResume = await saveResume(user.id, newResume);
            setCurrentResume(savedResume);
            setCurrentView('editor');
            loadUserResumes(user.id);
        } catch (error) {
            console.error('Failed to save resume:', error);
            setCurrentResume(newResume);
            setCurrentView('editor');
        }
    };

    const handleAIGenerateStart = useCallback(async (jobTitle: string, expLevel: string, userData: string) => {
        if (!jobTitle || !user) return;
        setIsGeneratingFull(true);
        
        try {
            const generatedData = await generateFullResume(jobTitle, expLevel, userData);
            
            if (generatedData) {
                const newResume: Resume = {
                    ...initialResume,
                    id: Date.now().toString(),
                    name: `${jobTitle} Resume`,
                    templateId: selectedTemplate?.id,
                    ...generatedData,
                    // Ensure personal info merges correctly and job title exists
                    personalInfo: {
                        ...generatedData.personalInfo,
                        jobTitle: generatedData.personalInfo?.jobTitle || jobTitle,
                        fullName: user?.name || generatedData.personalInfo?.fullName || "Your Name",
                        email: user?.email || generatedData.personalInfo?.email || "email@example.com"
                    },
                    colorAccent: '#4f46e5'
                };
                
                try {
                    const savedResume = await saveResume(user.id, newResume);
                    setCurrentResume(savedResume);
                    setIsAIModalOpen(false);
                    setCurrentView('editor');
                    loadUserResumes(user.id);
                } catch (error) {
                    console.error('Failed to save resume:', error);
                    setCurrentResume(newResume);
                    setIsAIModalOpen(false);
                    setCurrentView('editor');
                }
            } else {
                alert("We couldn't generate the resume. Please check your internet connection or API key.");
            }
        } catch (error) {
            console.error("Generation failed", error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            let userMessage = "An error occurred while generating your resume.\n\n";
            
            if (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('API key')) {
                userMessage += "Error: API key is missing or invalid.\n";
                userMessage += "Please check your .env file and make sure GEMINI_API_KEY is set correctly.\n";
                userMessage += "Then restart the server.";
            } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
                userMessage += "Error: Invalid API key or access denied.\n";
                userMessage += "Please verify your Gemini API key is correct and has proper permissions.";
            } else if (errorMessage.includes('429')) {
                userMessage += "Error: API quota exceeded.\n";
                userMessage += "Please check your Gemini API quota or try again later.";
            } else if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network')) {
                userMessage += "Error: Could not connect to the server.\n";
                userMessage += "Please make sure the backend server is running on port 3001.";
            } else {
                userMessage += `Error details: ${errorMessage}\n\n`;
                userMessage += "Check the browser console for more details.";
            }
            
            alert(userMessage);
            // Don't automatically switch to manual mode - let user decide
            setIsGeneratingFull(false);
        } finally {
            setIsGeneratingFull(false);
        }
    }, [user, selectedTemplate]);

    // Handler that receives values from uncontrolled inputs
    const handleGenerateFromForm = useCallback((jobTitle: string, expLevel: string, userData: string) => {
        setAiJobTitle(jobTitle);
        setAiExpLevel(expLevel);
        setAiUserData(userData);
        // Call generate directly with the values
        handleAIGenerateStart(jobTitle, expLevel, userData);
    }, [handleAIGenerateStart]);

    const scrollToSection = (id: string) => {
        setIsMobileMenuOpen(false);
        if (currentView !== 'landing') {
            setCurrentView('landing');
            setTimeout(() => {
                const element = document.getElementById(id);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } else {
            const element = document.getElementById(id);
            if (element) element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // --- Auth Component ---
    const AuthPage = () => {
        const [isLoading, setIsLoading] = useState(false);
        const [formData, setFormData] = useState({
            name: '',
            email: '',
            password: ''
        });

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);

            try {
                let authResponse;
                if (authMode === 'signup') {
                    authResponse = await signUp({
                        name: formData.name,
                        email: formData.email,
                        password: formData.password
                    });
                } else {
                    authResponse = await signIn({
                        email: formData.email,
                        password: formData.password
                    });
                }

                localStorage.setItem('resuai_user', JSON.stringify(authResponse.user));
                localStorage.setItem('resuai_token', authResponse.token);
                setUser(authResponse.user);
                loadUserResumes(authResponse.user.id);
                setIsLoading(false);
                routeUser(authResponse.user);
            } catch (error) {
                console.error('Auth error:', error);
                alert(error instanceof Error ? error.message : 'Authentication failed. Please try again.');
                setIsLoading(false);
            }
        };

        return (
            <div className="min-h-screen flex">
                {/* Left Side - Image */}
                <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10 text-white max-w-lg">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary-500/30">
                            <Sparkles className="w-8 h-8" />
                        </div>
                        <h1 className="text-5xl font-bold mb-6 leading-tight">Build your future, one resume at a time.</h1>
                        <p className="text-slate-300 text-xl leading-relaxed">Join 10,000+ professionals who have landed their dream jobs using resuAI's intelligent builder.</p>
                        
                        <div className="mt-12 grid grid-cols-2 gap-6">
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                <Zap className="w-6 h-6 text-yellow-400 mb-2" />
                                <div className="font-bold">Instant AI</div>
                                <div className="text-sm text-slate-400">Generate in seconds</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                                <ShieldCheck className="w-6 h-6 text-green-400 mb-2" />
                                <div className="font-bold">ATS Friendly</div>
                                <div className="text-sm text-slate-400">Pass the robots</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-6 md:p-12 relative">
                    <button 
                        onClick={() => setCurrentView('landing')} 
                        className="absolute top-8 left-8 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <ArrowRight className="w-6 h-6 rotate-180" />
                    </button>

                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-900 mb-2">
                                {authMode === 'signup' ? 'Create an account' : 'Welcome back'}
                            </h2>
                            <p className="text-slate-500">
                                {authMode === 'signup' 
                                    ? 'Enter your details to get started with resuAI.' 
                                    : 'Please enter your details to sign in.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {authMode === 'signup' && (
                                <Input 
                                    label="Full Name" 
                                    placeholder="John Doe" 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    required
                                    className="h-12"
                                />
                            )}
                            <Input 
                                label="Email Address" 
                                type="email"
                                placeholder="name@company.com" 
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                required
                                className="h-12"
                            />
                            <Input 
                                label="Password" 
                                type="password"
                                placeholder="••••••••" 
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                required
                                className="h-12"
                            />

                            <Button 
                                type="submit" 
                                className="w-full py-4 text-base" 
                                isLoading={isLoading}
                                leftIcon={authMode === 'signin' ? <LogOut className="w-4 h-4 rotate-180" /> : <Sparkles className="w-4 h-4" />}
                            >
                                {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                            </Button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-slate-600">
                                {authMode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
                                <button 
                                    onClick={() => setAuthMode(authMode === 'signup' ? 'signin' : 'signup')}
                                    className="font-bold text-primary-600 hover:text-primary-700 hover:underline"
                                >
                                    {authMode === 'signup' ? 'Sign in' : 'Sign up'}
                                </button>
                            </p>
                        </div>
                        
                        {/* Admin hint for demo */}
                        <div className="mt-8 p-4 bg-blue-50 text-blue-700 text-xs rounded-lg text-center">
                            <strong>Demo Tip:</strong> Use an email containing "admin" (e.g., admin@resuai.com) to access the Admin Dashboard.
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // --- Admin Dashboard Component ---
    const AdminDashboard = () => (
        <div className="min-h-screen bg-slate-100 font-sans">
             <nav className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-30 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-primary-500 p-1.5 rounded text-white"><ShieldCheck className="w-5 h-5" /></div>
                        <span className="font-bold text-lg tracking-tight">resuAI <span className="text-slate-400 font-normal">| Admin</span></span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-slate-800 py-1.5 px-3 rounded-full border border-slate-700">
                            <img src={user?.avatar} className="w-6 h-6 rounded-full" alt="Admin" />
                            <span className="text-sm font-medium text-slate-300">{user?.name}</span>
                        </div>
                        <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <h1 className="text-2xl font-bold text-slate-900 mb-8">System Overview</h1>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-10">
                    {[
                        { label: 'Total Users', value: '12,345', icon: <Users className="w-5 h-5 text-blue-500" />, change: '+12%' },
                        { label: 'Resumes Generated', value: '45,678', icon: <FileText className="w-5 h-5 text-primary-500" />, change: '+24%' },
                        { label: 'AI Tokens Used', value: '1.2M', icon: <Cpu className="w-5 h-5 text-purple-500" />, change: '+8%' },
                        { label: 'Revenue', value: '$89.4k', icon: <Star className="w-5 h-5 text-green-500" />, change: '+15%' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">{stat.icon}</div>
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{stat.change}</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                            <div className="text-sm text-slate-500">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* User Table */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Recent Users</h3>
                            <Button variant="outline" size="sm">View All</Button>
                        </div>
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3">User</th>
                                    <th className="px-6 py-3">Role</th>
                                    <th className="px-6 py-3">Status</th>
                                    <th className="px-6 py-3">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[
                                    { name: 'Alice Cooper', email: 'alice@example.com', role: 'User', status: 'Active' },
                                    { name: 'Bob Smith', email: 'bob@example.com', role: 'Premium', status: 'Active' },
                                    { name: 'Charlie Brown', email: 'charlie@example.com', role: 'User', status: 'Inactive' },
                                    { name: 'Diana Prince', email: 'diana@example.com', role: 'Premium', status: 'Active' },
                                ].map((u, i) => (
                                    <tr key={i} className="hover:bg-slate-50">
                                        <td className="px-6 py-4 font-medium text-slate-900">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium">{u.name}</div>
                                                    <div className="text-xs text-slate-500">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">{u.role}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {u.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500">Oct 24, 2023</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Server Status */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-800 mb-4">System Health</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">API Latency</span>
                                        <span className="text-green-600 font-medium">24ms</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{width: '15%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Database Load</span>
                                        <span className="text-blue-600 font-medium">45%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '45%'}}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-600">Storage</span>
                                        <span className="text-amber-600 font-medium">78%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-amber-500 h-2 rounded-full" style={{width: '78%'}}></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-6 rounded-xl text-white shadow-lg">
                            <Sparkles className="w-8 h-8 mb-4 opacity-80" />
                            <h3 className="text-lg font-bold mb-2">Admin Actions</h3>
                            <p className="text-primary-100 text-sm mb-4">Quick shortcuts for system management.</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button className="bg-white/10 hover:bg-white/20 py-2 rounded text-sm font-medium transition-colors">Manage API</button>
                                <button className="bg-white/10 hover:bg-white/20 py-2 rounded text-sm font-medium transition-colors">View Logs</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // --- Landing Page Component ---
    const LandingPage = () => (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navbar */}
            <nav className="fixed w-full z-50 glass-nav border-b border-slate-100 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                        <span className="font-bold text-2xl text-slate-900 tracking-tight">resu<span className="text-primary-600">AI</span></span>
                        <div className="w-2 h-2 bg-primary-500 rounded-full mb-3 ml-0.5 animate-pulse"></div>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="hover:text-primary-600 transition-colors">Home</button>
                        <button onClick={() => scrollToSection('features')} className="hover:text-primary-600 transition-colors">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="hover:text-primary-600 transition-colors">How it works</button>
                        <button onClick={() => scrollToSection('testimonials')} className="hover:text-primary-600 transition-colors">Testimonials</button>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-4">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => routeUser(user)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
                                >
                                    <Layout className="w-4 h-4" />
                                    Dashboard
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-red-500 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => { setAuthMode('signin'); setCurrentView('auth'); }}
                                    className="px-6 py-2.5 rounded-full border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                                    title="Sign In"
                                >
                                    Sign In
                                </button>
                                <button 
                                    onClick={() => { setAuthMode('signup'); setCurrentView('auth'); }}
                                    className="px-6 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
                                    title="Sign Up"
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-700">
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white border-b border-slate-100 p-4 space-y-4 shadow-lg">
                        <button onClick={() => scrollToSection('features')} className="block text-slate-600 font-medium w-full text-left">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="block text-slate-600 font-medium w-full text-left">How it works</button>
                         <button onClick={() => scrollToSection('testimonials')} className="block text-slate-600 font-medium w-full text-left">Testimonials</button>
                        
                        {user ? (
                            <>
                                <button onClick={() => routeUser(user)} className="w-full text-left font-bold text-primary-600">Dashboard</button>
                                <button onClick={handleLogout} className="w-full text-left text-red-500">Logout</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setAuthMode('signin'); setCurrentView('auth'); }} className="w-full text-left text-slate-600 font-medium">Sign In</button>
                                <button onClick={() => { setAuthMode('signup'); setCurrentView('auth'); }} className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium">Sign Up</button>
                            </>
                        )}
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 md:pt-40 md:pb-20 relative overflow-hidden">
                {/* Background Blobs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                     <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-100/50 rounded-full blur-3xl -z-10 animate-blob"></div>
                     <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    
                    {/* Social Proof */}
                    <div className="flex flex-col items-center justify-center gap-4 mb-8 animate-fade-in-up">
                        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-100 shadow-sm">
                            <div className="flex -space-x-3">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 12}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col items-start">
                                <div className="flex gap-0.5">
                                    {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                                </div>
                                <span className="text-xs font-semibold text-slate-700">Used by 10,000+ users</span>
                            </div>
                        </div>
                    </div>

                    {/* Headlines */}
                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 tracking-tight mb-6 leading-[1.1] max-w-4xl mx-auto">
                        Land your dream job with <span className="text-primary-600 inline-block relative">
                            AI-powered
                            <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary-200 -z-10" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 Q 50 10 100 5" stroke="currentColor" strokeWidth="8" fill="none" />
                            </svg>
                        </span> resumes.
                    </h1>
                    
                    <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Create, edit and download professional resumes with <strong>resuAI</strong>. 
                        Beat the ATS and get hired faster with our intelligent algorithms.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button 
                            onClick={handleStartBuilding}
                            className="h-14 px-8 rounded-full bg-primary-600 text-white text-lg font-semibold hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all transform hover:-translate-y-1 flex items-center gap-2"
                        >
                            Get started <ArrowRight className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => { if(user) routeUser(user); else { setAuthMode('signin'); setCurrentView('auth'); } }}
                            className="h-14 px-8 rounded-full bg-white text-slate-700 border border-slate-200 text-lg font-medium hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2"
                        >
                            <PlayCircle className="w-5 h-5" /> Try demo
                        </button>
                    </div>

                    {/* Hero Image / UI Preview */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl blur opacity-20"></div>
                        <div className="relative rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
                            <img 
                                src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=2000&h=1000" 
                                alt="Resume Builder Dashboard" 
                                className="w-full h-auto opacity-90"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/5 group hover:bg-black/0 transition-colors cursor-pointer" onClick={handleStartBuilding}>
                                <div className="bg-white/90 backdrop-blur text-primary-600 px-6 py-3 rounded-full font-bold shadow-lg transform scale-90 hover:scale-105 transition-transform">
                                    Start Building Now
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trusted Brands Section */}
            <section className="py-12 border-b border-slate-100 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-center text-slate-500 font-medium mb-8">Trusting by leading brands, including</p>
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Instagram */}
                        <div className="h-8 w-auto flex items-center">
                            <svg viewBox="0 0 24 24" className="h-8 w-auto fill-current text-slate-800" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            <span className="ml-2 font-bold text-lg hidden md:block">Instagram</span>
                        </div>
                        {/* Framer */}
                        <div className="h-8 w-auto flex items-center">
                            <svg viewBox="0 0 24 24" className="h-7 w-auto fill-current text-slate-800" xmlns="http://www.w3.org/2000/svg"><path d="M4 0h16v8h-8zM4 8h8l8 8h-16zM4 16h8v8z"/></svg>
                            <span className="ml-2 font-bold text-lg hidden md:block">Framer</span>
                        </div>
                        {/* Microsoft */}
                        <div className="h-8 w-auto flex items-center">
                            <svg viewBox="0 0 24 24" className="h-7 w-auto fill-current text-slate-800" xmlns="http://www.w3.org/2000/svg"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/></svg>
                            <span className="ml-2 font-bold text-lg hidden md:block">Microsoft</span>
                        </div>
                        {/* Huawei */}
                         <div className="h-8 w-auto flex items-center">
                           <svg className="h-8 w-auto fill-current text-slate-800" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.98 14.99c1.81 0 3.33-1.32 3.63-3.06l1.55-8.88c.1-.54-.36-1.02-.91-.93-2.63.46-4.26 2.75-4.27 5.4v7.47zM17.31 14.54c.94 0 1.82-.37 2.48-.97l4.04-3.7c.43-.39.28-1.1-.29-1.29-2.21-.75-4.64-.22-6.23 1.25v4.71zM6.69 14.54c-.94 0-1.82-.37-2.48-.97l-4.04-3.7c-.43-.39-.28-1.1.29-1.29 2.21-.75 4.64-.22 6.23 1.25v4.71zM12 24c-1.46 0-2.75-.81-3.43-2.01L5.46 16.5c-.28-.49.07-1.09.64-1.09h11.8c.57 0 .92.6.64 1.09l-3.11 5.49C14.75 23.19 13.46 24 12 24zM7.94 13.33c.95 2.29 2.83 3.28 4.06 3.28V2.12c0-2.65-1.63-4.94-4.27-5.4-.55-.09-1.01.39-.91.93l1.55 8.88c.3 1.74 1.82 3.06 3.63 3.06-1.82 0-3.33-1.32-3.63-3.06l-1.55-8.88c-.1-.54.36-1.02.91-.93 2.64.46 4.27 2.75 4.27 5.4v14.49c-1.23 0-3.11-.99-4.06-3.28z"/>
                           </svg>
                            <span className="ml-2 font-bold text-lg hidden md:block">HUAWEI</span>
                        </div>
                        {/* Walmart */}
                        <div className="h-8 w-auto flex items-center">
                            <svg viewBox="0 0 24 24" className="h-8 w-auto fill-current text-slate-800" xmlns="http://www.w3.org/2000/svg"><path d="M12.06.001c-.61 0-1.09.57-1.01 1.18l.59 4.51c.07.52.51.9 1.03.9a1.03 1.03 0 0 0 1.03-.9l.59-4.51c.08-.61-.4-1.18-1.01-1.18h-1.22zM3.47 3.04c-.47.39-.46 1.13.02 1.51l3.55 2.82c.41.33 1.01.18 1.22-.3a1.04 1.04 0 0 0-.2-1.17L4.51 3.08a1.04 1.04 0 0 0-1.04-.04zm17.06 0c-.47-.39-1.16-.23-1.45.29l-1.96 3.5c-.25.45.08 1.01.6 1.01.17 0 .34-.06.47-.16l3.55-2.82c.48-.38.49-1.12.02-1.51l-1.23-.31zM.75 11.06c-.58.18-.57.99.02 1.16l4.39 1.27c.5.15 1.02-.14 1.16-.64.15-.5-.14-1.02-.64-1.16L1.29 10.42c-.18-.05-.36-.02-.54.64zm22.5 0c-.18-.66-.98-.69-1.16-.05l-1.27 4.39c-.14.5.15 1.02.64 1.16.5.14 1.02-.15 1.16-.64l1.27-4.39c.05-.17.02-.35-.64-.47zM5.15 17.53c-.39.47-.23 1.16.29 1.45l3.5 1.96c.45.25 1.01-.08 1.01-.6 0-.17-.06-.34-.16-.47l-2.82-3.55c-.38-.48-1.12-.49-1.51-.02l-.31 1.23zm13.7 0c-.39-.47-1.13-.46-1.51.02l-2.82 3.55c-.33.41-.18 1.01.3 1.22.45.19.98.02 1.17-.2l2.82-3.55c.39-.48.23-1.17-.29-1.45l-1.23-.31zM12.06 19.5c-.52 0-.9.44-.9 1.03l-.59 4.51c-.08.61.4 1.18 1.01 1.18h1.22c.61 0 1.09-.57 1.01-1.18l-.59-4.51c-.07-.52-.51-.9-1.03-.9h-.13z"/></svg>
                            <span className="ml-2 font-bold text-lg hidden md:block">Walmart</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">Workflow</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Build your resume in 3 steps</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-12">
                        {[
                            { 
                                icon: <MousePointerClick className="w-8 h-8 text-white" />, 
                                color: "bg-blue-500",
                                title: "Pick a Template", 
                                desc: "Choose from our collection of professional, ATS-friendly resume templates." 
                            },
                            { 
                                icon: <Sparkles className="w-8 h-8 text-white" />, 
                                color: "bg-primary-500",
                                title: "AI-Assist Writing", 
                                desc: "Let our AI write your summary and optimize your bullet points for maximum impact." 
                            },
                            { 
                                icon: <Download className="w-8 h-8 text-white" />, 
                                color: "bg-purple-500",
                                title: "Download & Apply", 
                                desc: "Export your polished resume as a PDF and start applying to your dream jobs." 
                            }
                        ].map((step, idx) => (
                            <div key={idx} className="relative flex flex-col items-center text-center group">
                                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center shadow-lg shadow-slate-200 mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                                <p className="text-slate-600 leading-relaxed max-w-xs">{step.desc}</p>
                                
                                {/* Connector Line */}
                                {idx < 2 && (
                                    <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 border-t-2 border-dashed border-slate-200 -z-10"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">Features</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Everything you need to get hired</h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: <Zap />, title: "Instant Generation", desc: "Create a full resume from scratch in seconds using smart data entry." },
                            { icon: <ShieldCheck />, title: "ATS-Friendly", desc: "Our templates are designed to pass Applicant Tracking Systems with 100% accuracy." },
                            { icon: <Layout />, title: "Live Preview", desc: "See changes instantly as you type. No more guessing how it will look." },
                            { icon: <Cpu />, title: "AI Co-Pilot", desc: "Stuck on words? Use AI to rewrite your sentences to sound more professional." },
                            { icon: <FileText />, title: "PDF Export", desc: "Download high-quality PDFs ready for any job application." },
                            { icon: <Users />, title: "Expert Tips", desc: "Get real-time suggestions on how to improve your resume content." }
                        ].map((feat, i) => (
                            <div key={i} className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:border-primary-200 hover:bg-primary-50/30 hover:shadow-lg transition-all duration-300 group">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-primary-600 mb-6 group-hover:scale-110 transition-transform">
                                    {React.cloneElement(feat.icon as React.ReactElement, { className: "w-6 h-6" })}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-3">{feat.title}</h3>
                                <p className="text-slate-600 leading-relaxed">{feat.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

             {/* Testimonials */}
             <section id="testimonials" className="py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-6">
                     <div className="text-center mb-16">
                        <span className="text-primary-600 font-semibold tracking-wider uppercase text-sm">Testimonials</span>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mt-2">Loved by job seekers worldwide</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { name: "Sarah Jenkins", role: "Product Manager", text: "I applied to 50 jobs with my old resume and got 0 calls. I used resuAI and got 3 interviews in the first week. The AI suggestions are a game changer." },
                            { name: "David Chen", role: "Software Engineer", text: "The ATS optimization feature is incredible. It highlighted keywords I was missing. Landed a job at a FAANG company thanks to this builder!" },
                            { name: "Emily Rodriguez", role: "Marketing Director", text: "Beautiful templates and so easy to use. I love how I can just type a role and the AI generates bullet points for me. Saved me hours of work." }
                        ].map((t, i) => (
                            <div key={i} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                                <Quote className="w-8 h-8 text-primary-200 mb-4" />
                                <p className="text-slate-600 mb-6 flex-grow italic">"{t.text}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-slate-200 rounded-full overflow-hidden">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt={t.name} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900">{t.name}</div>
                                        <div className="text-xs text-primary-600 font-medium">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </section>

            {/* CTA Section */}
            <section className="py-20">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
                        {/* Decorative gradients */}
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">Ready to build your professional resume?</h2>
                        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto relative z-10">Join thousands of job seekers who have successfully landed their dream jobs using our AI-powered tools.</p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                             <button onClick={handleStartBuilding} className="px-8 py-4 rounded-full bg-primary-600 text-white font-bold text-lg hover:bg-primary-500 transition-colors shadow-lg shadow-primary-900/50">
                                Build My Resume Now
                            </button>
                            <span className="text-slate-500 text-sm mt-4 sm:mt-0 sm:ml-4">No credit card required</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-1 mb-4">
                                <span className="font-bold text-xl text-slate-900">resu<span className="text-primary-600">AI</span></span>
                                <div className="w-2 h-2 bg-primary-500 rounded-full mb-2 ml-1"></div>
                            </div>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                The smartest way to build a professional resume. Powered by advanced AI to help you get hired faster.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><button onClick={handleStartBuilding} className="hover:text-primary-600">Resume Builder</button></li>
                                <li><a href="#" className="hover:text-primary-600">Templates</a></li>
                                <li><a href="#" className="hover:text-primary-600">Cover Letter</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Resources</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-primary-600">Blog</a></li>
                                <li><a href="#" className="hover:text-primary-600">Career Advice</a></li>
                                <li><a href="#" className="hover:text-primary-600">ATS Check</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-900 mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm text-slate-600">
                                <li><a href="#" className="hover:text-primary-600">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-primary-600">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-100 pt-8 text-center text-sm text-slate-500">
                        &copy; {new Date().getFullYear()} resuAI. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );

    // --- User Dashboard Component ---
    const Dashboard = () => (
        <div className="min-h-screen bg-slate-50">
            <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <div 
                        className="flex items-center gap-2 cursor-pointer"
                        onClick={() => setCurrentView('landing')}
                    >
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">R</div>
                        <span className="font-bold text-xl text-slate-900">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                         <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium border border-primary-100">
                            Free Plan
                         </div>
                         <div className="flex items-center gap-2 bg-slate-100 pl-2 pr-4 py-1 rounded-full">
                            <img src={user?.avatar} className="w-7 h-7 rounded-full" alt="Avatar" />
                            <span className="text-sm font-medium text-slate-700">{user?.name}</span>
                         </div>
                         <button onClick={handleLogout} className="text-slate-400 hover:text-slate-600" title="Logout">
                            <LogOut className="w-5 h-5" />
                         </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 mb-2">My Resumes</h1>
                        <p className="text-slate-500">Manage and edit your professional documents.</p>
                    </div>
                    <Button className="bg-primary-600 hover:bg-primary-700" onClick={handleStartBuilding} leftIcon={<Sparkles className="w-4 h-4"/>}>
                        Create New Resume
                    </Button>
                </div>

                {isLoadingResumes ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Create New Card */}
                        <div 
                            onClick={handleStartBuilding}
                            className="group border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50/30 transition-all h-64 bg-white"
                        >
                            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-slate-900 mb-1">Create New Resume</h3>
                            <p className="text-sm text-slate-500">Start from scratch or with AI</p>
                        </div>

                        {/* User Resumes */}
                        {userResumes.map((resume) => (
                            <Card key={resume.id} className="relative overflow-hidden group cursor-pointer h-64 hover:shadow-md transition-shadow">
                                <div className="h-2/3 bg-slate-100 border-b border-slate-100 p-4 overflow-hidden relative">
                                    {/* Tiny Mockup */}
                                    <div className="w-full h-full bg-white shadow-sm p-2 text-[4px] text-slate-300 space-y-1 opacity-60">
                                        <div className="w-1/3 h-1 bg-slate-400 rounded"></div>
                                        <div className="w-full h-px bg-slate-200 mt-2"></div>
                                        <div className="space-y-1 mt-2">
                                            <div className="w-full h-1 bg-slate-200"></div>
                                            <div className="w-2/3 h-1 bg-slate-200"></div>
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                                        <Button 
                                            size="sm" 
                                            className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all bg-primary-600 hover:bg-primary-700"
                                            onClick={() => {
                                                setCurrentResume(resume);
                                                setCurrentView('editor');
                                            }}
                                        >
                                            Edit Resume
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-slate-900">{resume.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        Last edited {new Date(resume.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );

    // --- AI Modal ---
    const AIOnboardingModal = () => {
        if (!isAIModalOpen) return null;

        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAIModalOpen(false)}></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-fade-in-up max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="bg-primary-600 p-6 text-white text-center">
                        <Bot className="w-12 h-12 mx-auto mb-3 opacity-90" />
                        <h2 className="text-2xl font-bold">Let's Build Your Resume</h2>
                        <p className="text-primary-100 text-sm mt-1">How would you like to start?</p>
                    </div>
                    
                    <div className="p-8">
                        {isGeneratingFull ? (
                            <div className="flex flex-col items-center py-12 text-center">
                                <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                                <h3 className="text-xl font-bold text-slate-800">Generating your resume...</h3>
                                <p className="text-slate-500 mt-2">Analyzing your role and crafting professional content.</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="grid gap-4">
                                    {/* Option 1: AI Auto-Fill */}
                                    <div className="p-4 border-2 border-primary-100 bg-primary-50/30 rounded-xl hover:border-primary-300 transition-colors cursor-pointer group relative">
                                        <div className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                                                <Sparkles className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-slate-900 group-hover:text-primary-700">Generate with AI</h3>
                                                <p className="text-sm text-slate-600 mb-4">We'll build a complete resume for you instantly.</p>
                                                
                                                <AIFormInputs
                                                    initialJobTitle={aiJobTitle}
                                                    initialExpLevel={aiExpLevel}
                                                    initialUserData={aiUserData}
                                                    isGeneratingFull={isGeneratingFull}
                                                    onGenerate={handleGenerateFromForm}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="relative flex items-center justify-center my-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-200"></div>
                                        </div>
                                        <span className="relative bg-white px-2 text-xs text-slate-400 uppercase">OR</span>
                                    </div>

                                    {/* Option 2: Manual */}
                                    <div 
                                        onClick={handleManualStart}
                                        className="p-4 border border-slate-200 rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-4"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                                            <PenTool className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">Start from Scratch</h3>
                                            <p className="text-sm text-slate-600">Manually enter your details using our blank template.</p>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-slate-400 ml-auto" />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!isGeneratingFull && (
                            <button 
                                onClick={() => setIsAIModalOpen(false)}
                                className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {currentView === 'landing' && <LandingPage />}
            {currentView === 'auth' && <AuthPage />}
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'admin-dashboard' && <AdminDashboard />}
            {currentView === 'editor' && (
                <Editor 
                    resume={currentResume} 
                    onResumeChange={async (updatedResume) => {
                        setCurrentResume(updatedResume);
                        // Auto-save to backend
                        if (user) {
                            try {
                                await saveResume(user.id, updatedResume);
                            } catch (error) {
                                console.error('Auto-save failed:', error);
                            }
                        }
                    }}
                    onBack={() => {
                        if (user) {
                            routeUser(user);
                            loadUserResumes(user.id);
                        } else {
                            setCurrentView('landing');
                        }
                    }}
                />
            )}
            {showTemplateSelector && (
                <TemplateSelector
                    templates={cvTemplates}
                    selectedTemplate={selectedTemplate}
                    onSelectTemplate={setSelectedTemplate}
                    onContinue={handleTemplateSelected}
                    onCancel={() => {
                        setShowTemplateSelector(false);
                        setSelectedTemplate(null);
                    }}
                />
            )}
            <AIOnboardingModal />
        </>
    );
};

export default App;
