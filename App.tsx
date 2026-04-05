
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
            <nav className="fixed w-full z-50 glass-nav border-b border-slate-200/80 transition-all duration-300 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary-300/40 after:to-transparent">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-1 cursor-pointer group" onClick={() => window.scrollTo({top:0, behavior:'smooth'})}>
                        <span className="font-bold text-2xl text-slate-900 tracking-tight">resu<span className="text-primary-600">AI</span></span>
                        <div className="w-2 h-2 bg-primary-500 rounded-full mb-3 ml-0.5 animate-pulse ring-4 ring-primary-500/15 group-hover:ring-primary-500/25 transition-[box-shadow]"></div>
                    </div>

                    {/* Desktop Links */}
                    <div className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
                        <button onClick={() => window.scrollTo({top:0, behavior:'smooth'})} className="px-3 py-2 rounded-full hover:bg-slate-100/90 hover:text-primary-700 transition-colors">Home</button>
                        <button onClick={() => scrollToSection('features')} className="px-3 py-2 rounded-full hover:bg-slate-100/90 hover:text-primary-700 transition-colors">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="px-3 py-2 rounded-full hover:bg-slate-100/90 hover:text-primary-700 transition-colors">How it works</button>
                        <button onClick={() => scrollToSection('testimonials')} className="px-3 py-2 rounded-full hover:bg-slate-100/90 hover:text-primary-700 transition-colors">Testimonials</button>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={() => routeUser(user)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-br from-slate-100 to-slate-50 text-slate-800 font-medium border border-slate-200/80 shadow-sm hover:shadow transition-shadow"
                                >
                                    <Layout className="w-4 h-4" />
                                    Dashboard
                                </button>
                                <button 
                                    onClick={handleLogout}
                                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors border border-transparent hover:border-rose-100"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => { setAuthMode('signin'); setCurrentView('auth'); }}
                                    className="hidden sm:inline-flex px-5 py-2.5 rounded-full border border-slate-200/90 text-slate-700 font-medium bg-white/50 hover:bg-white hover:border-slate-300 transition-colors"
                                    title="Sign In"
                                >
                                    Sign In
                                </button>
                                <button 
                                    onClick={() => { setAuthMode('signup'); setCurrentView('auth'); }}
                                    className="px-6 py-2.5 rounded-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium shadow-lg shadow-primary-600/25 transition-all hover:shadow-primary-600/35 hover:-translate-y-0.5"
                                    title="Sign Up"
                                >
                                    Sign Up
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden">
                        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 rounded-xl text-slate-700 hover:bg-slate-100" aria-label="Toggle menu">
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-100 p-4 space-y-1 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.15)]">
                        <button onClick={() => scrollToSection('features')} className="block text-slate-700 font-medium w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50">Features</button>
                        <button onClick={() => scrollToSection('how-it-works')} className="block text-slate-700 font-medium w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50">How it works</button>
                         <button onClick={() => scrollToSection('testimonials')} className="block text-slate-700 font-medium w-full text-left px-3 py-2.5 rounded-xl hover:bg-slate-50">Testimonials</button>
                        
                        {user ? (
                            <>
                                <button onClick={() => routeUser(user)} className="w-full text-left font-bold text-primary-600 px-3 py-2.5 rounded-xl hover:bg-primary-50">Dashboard</button>
                                <button onClick={handleLogout} className="w-full text-left text-rose-600 px-3 py-2.5 rounded-xl hover:bg-rose-50">Logout</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setAuthMode('signin'); setCurrentView('auth'); }} className="w-full text-left text-slate-700 font-medium px-3 py-2.5 rounded-xl hover:bg-slate-50">Sign In</button>
                                <button onClick={() => { setAuthMode('signup'); setCurrentView('auth'); }} className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-medium shadow-md">Sign Up</button>
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
            <section className="relative py-16 md:py-24 overflow-hidden bg-gradient-to-b from-white via-indigo-50/35 to-slate-50/90 border-b border-slate-200/60">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_45%_at_50%_-10%,rgba(99,102,241,0.11),transparent)]" aria-hidden />
                <div className="pointer-events-none absolute -left-24 top-1/2 h-80 w-80 -translate-y-1/2 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-violet-300/25 blur-3xl" aria-hidden />
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-10 md:mb-12">
                        <div className="max-w-xl">
                            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary-800/90">
                                <span className="h-px w-10 bg-gradient-to-r from-primary-500 to-transparent" aria-hidden />
                                Social proof
                            </p>
                            <h2 className="mt-3 text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                                Trusted by teams who hire at scale
                            </h2>
                            <p className="mt-2 text-slate-600 text-sm md:text-base leading-relaxed">
                                From startups to enterprises—cleaner stories, stronger keywords, fewer rejections in the ATS black hole.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                            <span className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">ATS-aligned copy</span>
                            <span className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">Brand-safe tone</span>
                            <span className="rounded-full border border-slate-200/90 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">Export-ready PDFs</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-5">
                        {[
                            { label: 'Instagram', node: (
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                            )},
                            { label: 'Framer', node: (
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M4 0h16v8h-8zM4 8h8l8 8h-16zM4 16h8v8z"/></svg>
                            )},
                            { label: 'Microsoft', node: (
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/></svg>
                            )},
                            { label: 'HUAWEI', node: (
                                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M11.98 14.99c1.81 0 3.33-1.32 3.63-3.06l1.55-8.88c.1-.54-.36-1.02-.91-.93-2.63.46-4.26 2.75-4.27 5.4v7.47zM17.31 14.54c.94 0 1.82-.37 2.48-.97l4.04-3.7c.43-.39.28-1.1-.29-1.29-2.21-.75-4.64-.22-6.23 1.25v4.71zM6.69 14.54c-.94 0-1.82-.37-2.48-.97l-4.04-3.7c-.43-.39-.28-1.1.29-1.29 2.21-.75 4.64-.22 6.23 1.25v4.71zM12 24c-1.46 0-2.75-.81-3.43-2.01L5.46 16.5c-.28-.49.07-1.09.64-1.09h11.8c.57 0 .92.6.64 1.09l-3.11 5.49C14.75 23.19 13.46 24 12 24zM7.94 13.33c.95 2.29 2.83 3.28 4.06 3.28V2.12c0-2.65-1.63-4.94-4.27-5.4-.55-.09-1.01.39-.91.93l1.55 8.88c.3 1.74 1.82 3.06 3.63 3.06-1.82 0-3.33-1.32-3.63-3.06l-1.55-8.88c-.1-.54.36-1.02.91-.93 2.64.46 4.27 2.75 4.27 5.4v14.49c-1.23 0-3.11-.99-4.06-3.28z"/>
                                </svg>
                            )},
                            { label: 'Walmart', node: (
                                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12.06.001c-.61 0-1.09.57-1.01 1.18l.59 4.51c.07.52.51.9 1.03.9a1.03 1.03 0 0 0 1.03-.9l.59-4.51c.08-.61-.4-1.18-1.01-1.18h-1.22zM3.47 3.04c-.47.39-.46 1.13.02 1.51l3.55 2.82c.41.33 1.01.18 1.22-.3a1.04 1.04 0 0 0-.2-1.17L4.51 3.08a1.04 1.04 0 0 0-1.04-.04zm17.06 0c-.47-.39-1.16-.23-1.45.29l-1.96 3.5c-.25.45.08 1.01.6 1.01.17 0 .34-.06.47-.16l3.55-2.82c.48-.38.49-1.12.02-1.51l-1.23-.31zM.75 11.06c-.58.18-.57.99.02 1.16l4.39 1.27c.5.15 1.02-.14 1.16-.64.15-.5-.14-1.02-.64-1.16L1.29 10.42c-.18-.05-.36-.02-.54.64zm22.5 0c-.18-.66-.98-.69-1.16-.05l-1.27 4.39c-.14.5.15 1.02.64 1.16.5.14 1.02-.15 1.16-.64l1.27-4.39c.05-.17.02-.35-.64-.47zM5.15 17.53c-.39.47-.23 1.16.29 1.45l3.5 1.96c.45.25 1.01-.08 1.01-.6 0-.17-.06-.34-.16-.47l-2.82-3.55c-.38-.48-1.12-.49-1.51-.02l-.31 1.23zm13.7 0c-.39-.47-1.13-.46-1.51.02l-2.82 3.55c-.33.41-.18 1.01.3 1.22.45.19.98.02 1.17-.2l2.82-3.55c.39-.48.23-1.17-.29-1.45l-1.23-.31zM12.06 19.5c-.52 0-.9.44-.9 1.03l-.59 4.51c-.08.61.4 1.18 1.01 1.18h1.22c.61 0 1.09-.57 1.01-1.18l-.59-4.51c-.07-.52-.51-.9-1.03-.9h-.13z"/></svg>
                            )}
                        ].map((brand, i) => (
                            <div
                                key={brand.label}
                                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-slate-200/85 bg-white/75 px-4 py-4 shadow-[0_1px_0_rgba(15,23,42,0.05)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary-300/70 hover:bg-white hover:shadow-xl hover:shadow-primary-500/10"
                                style={{ transitionDelay: `${i * 45}ms` }}
                            >
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-inner ring-1 ring-white/10">
                                    {brand.node}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Partner</div>
                                    <div className="truncate text-sm font-bold text-slate-900">{brand.label}</div>
                                </div>
                                <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section id="how-it-works" className="relative py-24 md:py-28 overflow-hidden bg-slate-950 text-white">
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage: `linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)`,
                        backgroundSize: '48px 48px'
                    }}
                    aria-hidden
                />
                <div className="pointer-events-none absolute -top-24 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-primary-600/25 blur-3xl" aria-hidden />
                <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-64 translate-x-1/3 translate-y-1/3 rounded-full bg-violet-600/20 blur-3xl" aria-hidden />

                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14 md:mb-16">
                        <div className="max-w-2xl">
                            <span className="text-primary-300 font-semibold tracking-[0.25em] uppercase text-xs">Workflow</span>
                            <h2 className="text-3xl md:text-5xl font-bold mt-3 leading-[1.1] tracking-tight">
                                A calm path from blank page to offer-ready PDF
                            </h2>
                        </div>
                        <p className="text-slate-400 max-w-md text-sm md:text-base leading-relaxed border-l border-white/10 pl-6">
                            No guesswork: pick structure, let AI sharpen the story, then export with confidence.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
                        {[
                            {
                                n: '01',
                                icon: <MousePointerClick className="w-7 h-7" />,
                                accent: 'from-sky-400/20 to-cyan-500/5',
                                title: 'Pick a Template',
                                desc: 'Choose from professional, ATS-friendly layouts tuned for readability and scanners.'
                            },
                            {
                                n: '02',
                                icon: <Sparkles className="w-7 h-7" />,
                                accent: 'from-primary-400/25 to-indigo-600/10',
                                title: 'AI-Assist Writing',
                                desc: 'Generate summaries and bullet points, then refine tone until it sounds unmistakably you.'
                            },
                            {
                                n: '03',
                                icon: <Download className="w-7 h-7" />,
                                accent: 'from-fuchsia-400/20 to-violet-700/10',
                                title: 'Download & Apply',
                                desc: 'Export a crisp PDF and keep iterating as you target new roles.'
                            }
                        ].map((step, idx) => (
                            <div
                                key={step.n}
                                className={`relative rounded-3xl border border-white/10 bg-gradient-to-br ${step.accent} p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-sm`}
                            >
                                <div className="flex items-start justify-between gap-4 mb-8">
                                    <span className="text-5xl font-black text-white/[0.07] leading-none select-none">{step.n}</span>
                                    <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15 shadow-lg shadow-black/20">
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold mb-3 tracking-tight">{step.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm md:text-[15px]">{step.desc}</p>
                                {idx < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 lg:-right-6 w-8 lg:w-12 h-px bg-gradient-to-r from-white/25 to-transparent translate-y-[-50%]" aria-hidden />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid — bento */}
            <section id="features" className="relative py-24 md:py-28 bg-[#f4f6fb] overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-300/60 to-transparent" aria-hidden />
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 md:mb-16">
                        <div className="max-w-3xl">
                            <span className="text-primary-700 font-semibold tracking-[0.2em] uppercase text-xs">Features</span>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mt-3 tracking-tight leading-[1.12]">
                                Everything you need to get hired — arranged like a product studio, not a bullet list.
                            </h2>
                            <p className="mt-4 text-slate-600 text-sm md:text-base leading-relaxed max-w-2xl">
                                Pair speed (generation) with control (editing). Your voice stays central—AI just removes friction.
                            </p>
                        </div>
                        <div className="flex items-center gap-3 rounded-2xl border border-slate-200/90 bg-white/90 px-4 py-3 shadow-sm">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold text-slate-900">Built for outcomes</div>
                                <div className="text-xs text-slate-500">Fewer rewrites, stronger first impressions</div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 auto-rows-fr">
                        {[
                            { icon: <Zap />, title: 'Instant Generation', desc: 'Spin up a full resume fast with smart prompts and structured fields.', span: 'md:col-span-7 md:row-span-2', bg: 'bg-gradient-to-br from-white via-white to-primary-50/50 border-primary-100/80' },
                            { icon: <ShieldCheck />, title: 'ATS-Friendly', desc: 'Layouts and copy cues built to survive modern parsers.', span: 'md:col-span-5', bg: 'bg-white border-emerald-100/70' },
                            { icon: <Layout />, title: 'Live Preview', desc: 'Edit and see the final look in real time.', span: 'md:col-span-5', bg: 'bg-white border-slate-200/80' },
                            { icon: <Cpu />, title: 'AI Co-Pilot', desc: 'Rewrite lines until they sound senior, clear, and specific.', span: 'md:col-span-4', bg: 'bg-slate-900 text-white border-slate-800' },
                            { icon: <FileText />, title: 'PDF Export', desc: 'Print-sharp exports for every application.', span: 'md:col-span-4', bg: 'bg-white border-slate-200/80' },
                            { icon: <Users />, title: 'Expert Tips', desc: 'Inline nudges that tighten impact without fluff.', span: 'md:col-span-4', bg: 'bg-gradient-to-br from-violet-50 to-white border-violet-100/80' }
                        ].map((feat, i) => {
                            const isDark = feat.bg.includes('bg-slate-900');
                            return (
                                <div
                                    key={feat.title}
                                    className={`group relative rounded-[1.75rem] border p-7 md:p-8 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_60px_-28px_rgba(79,70,229,0.35)] ${feat.span} ${feat.bg}`}
                                >
                                    <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl mb-6 ${isDark ? 'bg-white/10 text-primary-200 ring-1 ring-white/10' : 'bg-primary-50 text-primary-700 ring-1 ring-primary-100/80'}`}>
                                        {React.cloneElement(feat.icon as React.ReactElement, { className: 'w-6 h-6' })}
                                    </div>
                                    <h3 className={`text-xl font-bold mb-2 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{feat.title}</h3>
                                    <p className={`leading-relaxed text-sm md:text-[15px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{feat.desc}</p>
                                    <div className={`pointer-events-none absolute -right-8 -bottom-8 h-28 w-28 rounded-full blur-2xl opacity-40 ${isDark ? 'bg-primary-500/30' : 'bg-primary-400/20'} group-hover:opacity-70 transition-opacity`} aria-hidden />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

             {/* Testimonials */}
             <section id="testimonials" className="relative py-24 md:py-28 bg-[#f4f1ea] border-t border-stone-200/80 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(99,102,241,0.09),transparent_42%),radial-gradient(circle_at_82%_18%,rgba(168,85,247,0.08),transparent_38%)]" aria-hidden />
                <div className="pointer-events-none absolute top-6 left-4 text-[11rem] font-black leading-none text-stone-300/50 select-none" aria-hidden>“</div>
                <div className="max-w-7xl mx-auto px-6 relative">
                     <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14 md:mb-16">
                        <div className="max-w-2xl">
                            <span className="text-primary-800 font-semibold tracking-[0.2em] uppercase text-xs">Testimonials</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mt-3 tracking-tight">
                                Real outcomes, not marketing fluff
                            </h2>
                            <p className="text-stone-700 mt-3 text-sm md:text-base leading-relaxed">
                                Short stories from people who needed momentum—and found it.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-stone-700">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            <span className="font-bold">4.9/5</span>
                            <span className="text-stone-500">average satisfaction</span>
                        </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6 lg:gap-7 items-stretch">
                        {[
                            { name: 'Sarah Jenkins', role: 'Product Manager', text: 'I applied to 50 jobs with my old resume and got 0 calls. I used resuAI and got 3 interviews in the first week. The AI suggestions are a game changer.', tilt: 'md:-rotate-1', bar: 'border-l-amber-400' },
                            { name: 'David Chen', role: 'Software Engineer', text: 'The ATS optimization feature is incredible. It highlighted keywords I was missing. Landed a job at a FAANG company thanks to this builder!', tilt: 'md:rotate-1', bar: 'border-l-indigo-500' },
                            { name: 'Emily Rodriguez', role: 'Marketing Director', text: 'Beautiful templates and so easy to use. I love how I can just type a role and the AI generates bullet points for me. Saved me hours of work.', tilt: 'md:-rotate-[0.5deg]', bar: 'border-l-fuchsia-500' }
                        ].map((t, i) => (
                            <div
                                key={t.name}
                                className={`relative flex flex-col rounded-3xl border border-stone-200/80 bg-white/85 p-8 shadow-[0_22px_55px_-38px_rgba(28,25,23,0.45)] backdrop-blur-sm transition-transform duration-300 hover:-translate-y-1 border-l-4 ${t.bar} ${t.tilt}`}
                            >
                                <Quote className="w-9 h-9 text-primary-200 mb-5" />
                                <p className="text-stone-700 mb-8 flex-grow leading-relaxed text-[15px] md:text-base">
                                    “{t.text}”
                                </p>
                                <div className="flex items-center gap-4 mt-auto pt-6 border-t border-stone-200/70">
                                    <div className="h-12 w-12 rounded-2xl overflow-hidden ring-2 ring-white shadow-md">
                                        <img src={`https://i.pravatar.cc/100?img=${i + 20}`} alt="" className="h-full w-full object-cover" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-stone-900">{t.name}</div>
                                        <div className="text-xs font-semibold text-primary-800">{t.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
             </section>

            {/* CTA Section */}
            <section className="relative py-20 md:py-24 bg-white overflow-hidden">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-950 p-10 md:p-16 lg:p-20 text-center md:text-left shadow-[0_40px_100px_-45px_rgba(79,70,229,0.75)] ring-1 ring-white/10">
                        <div className="pointer-events-none absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_18%_0%,rgba(99,102,241,0.55),transparent_52%),radial-gradient(circle_at_88%_12%,rgba(168,85,247,0.45),transparent_48%),radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.22),transparent_55%)]" aria-hidden />
                        <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-[120%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/12 to-transparent blur-2xl" aria-hidden />

                        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
                            <div className="max-w-xl mx-auto md:mx-0 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-100/95 backdrop-blur-md mb-6">
                                    <Sparkles className="w-4 h-4 text-amber-200" />
                                    Start free · upgrade when you want more
                                </div>
                                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.08]">
                                    Ready for a resume that reads like a tight pitch?
                                </h2>
                                <p className="text-indigo-100/90 mt-4 text-base md:text-lg leading-relaxed">
                                    Join thousands of job seekers who ship cleaner applications with AI-assisted structure, sharper wording, and export-ready formatting.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-4 lg:min-w-[260px]">
                                <button
                                    type="button"
                                    onClick={handleStartBuilding}
                                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-8 py-4 text-lg font-bold text-slate-950 shadow-xl shadow-black/30 transition-transform hover:-translate-y-0.5 hover:bg-indigo-50"
                                >
                                    Build my resume now
                                    <ArrowRight className="w-5 h-5" />
                                </button>
                                <span className="text-center lg:text-right text-sm text-indigo-200/85">
                                    No credit card required
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative bg-slate-950 text-slate-300 pt-20 pb-10 overflow-hidden">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" aria-hidden />
                <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-primary-600/20 blur-3xl" aria-hidden />
                <div className="max-w-7xl mx-auto px-6 relative">
                    <div className="grid md:grid-cols-12 gap-12 mb-14">
                        <div className="md:col-span-5">
                            <div className="flex items-center gap-1 mb-5">
                                <span className="font-bold text-2xl text-white tracking-tight">resu<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-300 to-violet-300">AI</span></span>
                                <div className="w-2 h-2 bg-primary-400 rounded-full mb-2 ml-1 ring-4 ring-primary-500/20"></div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                                The smartest way to build a professional resume. Clear structure, sharper language, and exports you can send with confidence.
                            </p>
                            <div className="mt-8 flex flex-wrap gap-3">
                                {['Product', 'Privacy', 'Careers'].map((chip) => (
                                    <span key={chip} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-400">
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="md:col-span-2 md:col-start-7">
                            <h4 className="font-bold text-white mb-4 text-sm tracking-wide uppercase text-slate-500">Product</h4>
                            <ul className="space-y-3 text-sm">
                                <li><button type="button" onClick={handleStartBuilding} className="text-slate-400 hover:text-white transition-colors text-left">Resume Builder</button></li>
                                <li><a href="#" className="hover:text-white transition-colors">Templates</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Cover Letter</a></li>
                            </ul>
                        </div>
                        <div className="md:col-span-2">
                            <h4 className="font-bold text-white mb-4 text-sm tracking-wide uppercase text-slate-500">Resources</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Career Advice</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">ATS Check</a></li>
                            </ul>
                        </div>
                        <div className="md:col-span-2">
                            <h4 className="font-bold text-white mb-4 text-sm tracking-wide uppercase text-slate-500">Legal</h4>
                            <ul className="space-y-3 text-sm">
                                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
                        <span>&copy; {new Date().getFullYear()} resuAI. All rights reserved.</span>
                        <span className="inline-flex items-center gap-2 text-slate-500">
                            <Mail className="w-4 h-4 text-slate-500 shrink-0" aria-hidden />
                            hello@resuai.app
                        </span>
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
