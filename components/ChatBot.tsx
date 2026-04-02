import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { Resume } from '../types';
import { improveText } from '../services/aiService';

interface ChatBotProps {
    resume: Resume;
    onResumeUpdate: (updates: Partial<Resume>) => void;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export const ChatBot: React.FC<ChatBotProps> = ({ resume, onResumeUpdate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "Hi! I'm your AI resume assistant. I can help you improve your resume content, suggest better wording, or answer questions about your CV. What would you like to improve?",
            timestamp: Date.now()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            // Analyze the user's request
            const userRequest = input.toLowerCase();
            let response = '';

            if (userRequest.includes('improve') || userRequest.includes('better') || userRequest.includes('rewrite')) {
                // Extract what they want to improve
                if (userRequest.includes('summary') || userRequest.includes('profile')) {
                    if (resume.summary) {
                        const improved = await improveText(resume.summary);
                        onResumeUpdate({ summary: improved });
                        response = `I've improved your summary! Here's the updated version:\n\n"${improved}"\n\nThe changes have been applied to your resume.`;
                    } else {
                        response = "I don't see a summary in your resume yet. Would you like me to generate one?";
                    }
                } else if (userRequest.includes('experience') || userRequest.includes('work')) {
                    response = "Which experience entry would you like me to improve? Please tell me the company name or position title.";
                } else {
                    // Try to improve the summary as default
                    if (resume.summary) {
                        const improved = await improveText(resume.summary);
                        onResumeUpdate({ summary: improved });
                        response = `I've improved your summary! Here's what changed:\n\n"${improved}"\n\nThe changes have been applied to your resume.`;
                    } else {
                        response = "I can help improve your resume content. What specific section would you like me to work on? (summary, experience, skills, etc.)";
                    }
                }
            } else if (userRequest.includes('add') || userRequest.includes('suggest')) {
                if (userRequest.includes('skill')) {
                    response = "What skill would you like to add? I can help you add it with an appropriate proficiency level.";
                } else if (userRequest.includes('experience')) {
                    response = "I can help you add a new experience entry. What's the company name and your position?";
                } else {
                    response = "What would you like to add to your resume? I can help with skills, experience, education, or other sections.";
                }
            } else if (userRequest.includes('ats') || userRequest.includes('keyword')) {
                response = `To make your resume more ATS-friendly, I recommend:\n\n1. Use standard section headings (Experience, Education, Skills)\n2. Include relevant keywords from job descriptions\n3. Use bullet points for achievements\n4. Keep formatting simple and clean\n\nWould you like me to analyze your resume for ATS optimization?`;
            } else if (userRequest.includes('help') || userRequest.includes('what can')) {
                response = `I can help you with:\n\n✨ Improve text and wording\n📝 Add new sections\n🔍 ATS optimization tips\n💡 Content suggestions\n📊 Resume analysis\n\nJust tell me what you'd like to work on!`;
            } else {
                // General response - try to be helpful
                response = `I understand you're asking about "${input}". I can help improve your resume content, add sections, or provide suggestions. What specific part of your resume would you like to work on?`;
            }

            const assistantMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: response,
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm sorry, I encountered an error. Please try again or rephrase your request.",
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Chat Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center z-50 group"
                    title="Open AI Assistant"
                >
                    <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-slate-200">
                    {/* Header */}
                    <div className="bg-primary-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold">AI Resume Assistant</h3>
                                <p className="text-xs text-primary-100">Always here to help</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-primary-600" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                        message.role === 'user'
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-slate-100 text-slate-900'
                                    }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                </div>
                                {message.role === 'user' && (
                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4 text-slate-600" />
                                    </div>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 justify-start">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="bg-slate-100 rounded-2xl px-4 py-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-slate-200">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask me anything about your resume..."
                                className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isLoading}
                                className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                            Try: "Improve my summary" or "Make it more ATS-friendly"
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

