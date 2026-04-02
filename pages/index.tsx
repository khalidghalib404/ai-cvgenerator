import React, { useState, useEffect } from 'react';
import { Resume, User, UserRole } from '../types';
import { Editor } from '../components/Editor';
import { Button, Card, Input, TextArea, Badge } from '../components/UIComponents';
import { generateFullResume } from '../services/aiService';
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

const initialResume: Resume = {
    id: '1',
    name: 'My Professional Resume',
    lastModified: Date.now(),
    colorAccent: '#4f46e5',
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

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('landing');
    const [authMode, setAuthMode] = useState<AuthMode>('signup');
    const [user, setUser] = useState<User | null>(null);
    const [currentResume, setCurrentResume] = useState<Resume>(initialResume);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [aiJobTitle, setAiJobTitle] = useState("");
    const [aiExpLevel, setAiExpLevel] = useState("Mid-Level");
    const [aiUserData, setAiUserData] = useState("");
    const [isGeneratingFull, setIsGeneratingFull] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('resuai_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
    }, []);

    const routeUser = (u: User) => {
        if (u.role === 'admin') {
            setCurrentView('admin-dashboard');
        } else {
            setCurrentView('dashboard');
        }
    };

    const handleStartBuilding = () => {
        if (!user) {
            setAuthMode('signup');
            setCurrentView('auth');
        } else {
            setIsAIModalOpen(true);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('resuai_user');
        setUser(null);
        setCurrentView('landing');
    };

    const handleManualStart = () => {
        setIsAIModalOpen(false);
        setCurrentResume({ ...initialResume, id: Date.now().toString() });
        setCurrentView('editor');
    };

    const handleAIGenerateStart = async () => {
        if (!aiJobTitle) return;
        setIsGeneratingFull(true);
        
        try {
            const generatedData = await generateFullResume(aiJobTitle, aiExpLevel, aiUserData);
            
            if (generatedData) {
                setCurrentResume({
                    ...initialResume,
                    id: Date.now().toString(),
                    ...generatedData,
                    personalInfo: {
                        ...generatedData.personalInfo,
                        jobTitle: generatedData.personalInfo?.jobTitle || aiJobTitle,
                        fullName: user?.name || generatedData.personalInfo?.fullName || "Your Name",
                        email: user?.email || generatedData.personalInfo?.email || "email@example.com"
                    },
                    colorAccent: '#4f46e5'
                });
                setIsAIModalOpen(false);
                setCurrentView('editor');
            } else {
                alert("We couldn't generate the resume. Please check your internet connection or try again.");
            }
        } catch (error) {
            console.error("Generation failed", error);
            alert("An unexpected error occurred. Starting with a blank template instead.");
            handleManualStart();
        } finally {
            setIsGeneratingFull(false);
        }
    };

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

    const AuthPage = () => {
        const [isLoading, setIsLoading] = useState(false);
        const [formData, setFormData] = useState({
            name: '',
            email: '',
            password: ''
        });

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);

            setTimeout(() => {
                const isAdmin = formData.email.includes('admin');
                const role: UserRole = isAdmin ? 'admin' : 'user';
                
                const newUser: User = {
                    id: Date.now().toString(),
                    name: authMode === 'signup' ? formData.name : 'Test User',
                    email: formData.email,
                    role: role,
                    avatar: `https://i.pravatar.cc/150?u=${formData.email}`
                };

                localStorage.setItem('resuai_user', JSON.stringify(newUser));
                setUser(newUser);
                setIsLoading(false);
                routeUser(newUser);
            }, 1500);
        };

        return (
            <div className="min-h-screen flex">
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
                        
                        <div className="mt-8 p-4 bg-blue-50 text-blue-700 text-xs rounded-lg text-center">
                            <strong>Demo Tip:</strong> Use an email containing "admin" (e.g., admin@resuai.com) to access the Admin Dashboard.
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const AdminDashboard = (        onClick={() => { setAuthMode('signup'); setCurrentView('auth'); }}
                                    className="px-6 py-2.5 rounded-full bg-primary-600 text-white font-medium hover:bg-primary-700 shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5"
                                >
                                    Get started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <section className="pt-32 pb-20 md:pt-40 md:pb-20 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
                     <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-100/50 rounded-full blur-3xl -z-10 animate-blob"></div>
                     <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-purple-100/40 rounded-full blur-3xl -z-10 animate-blob animation-delay-2000"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
                    <div className="flex flex-col items-center justify-center gap-4 mb-8">
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
                                <span className="text-xs font-semibold text-slate-600">10,000+ users</span>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-slate-900 mb-8 leading-tight tracking-tight">
                        Build your <span className="text-primary-600">dream resume</span> with AI
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
                        Create professional, ATS-friendly resumes in minutes. Our AI analyzes your experience and crafts compelling content that gets you noticed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                        <Button 
                            onClick={handleStartBuilding}
                            size="lg"
                            className="px-8 py-4 text-lg shadow-xl shadow-primary-500/30 transform hover:-translate-y-1"
                            leftIcon={<Sparkles className="w-5 h-5" />}
                        >
                            Start Building for Free
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg"
                            className="px-8 py-4 text-lg"
                            leftIcon={<PlayCircle className="w-5 h-5" />}
                        >
                            Watch Demo
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Zap className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">AI-Powered</h3>
                            <p className="text-slate-600">Generate professional content instantly with our advanced AI technology</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <ShieldCheck className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">ATS-Friendly</h3>
                            <p className="text-slate-600">Optimized to pass through applicant tracking systems</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Download className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Export Ready</h3>
                            <p className="text-slate-600">Download as PDF or share directly with employers</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Modal */}
            {isAIModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-8 rounded-xl max-w-md w-full mx-4">
                        <h3 className="text-2xl font-bold mb-4">AI Resume Builder</h3>
                        <div className="space-y-4">
                            <Input
                                label="Job Title"
                                placeholder="e.g., Software Engineer"
                                value={aiJobTitle}
                                onChange={e => setAiJobTitle(e.target.value)}
                            />
                            <div>
                                <label className="block text-sm font-medium mb-2">Experience Level</label>
                                <select 
                                    value={aiExpLevel} 
                                    onChange={e => setAiExpLevel(e.target.value)}
                                    className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option>Entry-Level</option>
                                    <option>Mid-Level</option>
                                    <option>Senior-Level</option>
                                    <option>Executive</option>
                                </select>
                            </div>
                            <TextArea
                                label="Additional Context (Optional)"
                                placeholder="Tell us about your background, skills, achievements..."
                                value={aiUserData}
                                onChange={e => setAiUserData(e.target.value)}
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <Button 
                                    onClick={handleAIGenerateStart}
                                    isLoading={isGeneratingFull}
                                    className="flex-1"
                                >
                                    Generate with AI
                                </Button>
                                <Button 
                                    onClick={handleManualStart}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Start Blank
                                </Button>
                            </div>
                            <button 
                                onClick={() => setIsAIModalOpen(false)}
                                className="w-full text-slate-500 hover:text-slate-700 mt-4"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    if (currentView === 'auth') return <AuthPage />;
    if (currentView === 'editor') return (
        <Editor 
            resume={currentResume} 
            onResumeChange={setCurrentResume}
            onBack={() => {
                if (user) routeUser(user);
                else setCurrentView('landing');
            }}
        />
    );
    
    return <LandingPage />;
};

export default App;