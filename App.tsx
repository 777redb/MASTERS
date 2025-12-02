
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  BookOpen, 
  GraduationCap, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  CheckCircle, 
  Circle, 
  MessageSquare, 
  Search, 
  Send,
  Loader2,
  BrainCircuit,
  LayoutDashboard,
  Menu,
  X,
  Settings
} from 'lucide-react';
import { Course, Module, ChatMessage, ResearchResult, ViewState, DisplaySettings } from './types';
import { generateCourseSyllabus, generateLessonContent, chatWithTutor, conductResearch } from './services/geminiService';
import { CourseCard } from './components/CourseCard';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { SettingsModal } from './components/SettingsModal';

const DEFAULT_SETTINGS: DisplaySettings = {
  zoom: 100,
  fontFamily: 'serif',
  maxWidth: 'medium',
  theme: 'dark'
};

const STEM_SUBJECTS = [
  "Computer Science",
  "Physics", 
  "Mathematics",
  "Chemistry",
  "Biology",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Artificial Intelligence",
  "Data Science",
  "Astronomy",
  "Neuroscience",
  "Quantum Mechanics"
];

const App: React.FC = () => {
  // --- State ---
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [view, setView] = useState<ViewState>('dashboard');
  
  // Settings State
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(false);

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPrompt, setGenerationPrompt] = useState('');
  
  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // Research State
  const [showResearch, setShowResearch] = useState(false);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);

  // Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Refs for scrolling
  const chatEndRef = useRef<HTMLDivElement>(null);

  // --- Effects ---
  
  // Theme Application
  useEffect(() => {
    const root = window.document.documentElement;
    if (displaySettings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [displaySettings.theme]);

  // Load courses and settings from local storage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('stem-masters-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        // Migration support: add defaults for new fields if missing
        setDisplaySettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
  }, []);

  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('stem-masters-settings', JSON.stringify(displaySettings));
  }, [displaySettings]);

  useEffect(() => {
    // Scroll to bottom of chat
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showResearch]);

  // --- Handlers ---

  const handleGenerateCourse = async () => {
    if (!generationPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const newCourse = await generateCourseSyllabus(generationPrompt);
      setCourses(prev => [newCourse, ...prev]);
      setActiveCourse(newCourse);
      setView('course-view');
      setGenerationPrompt('');
    } catch (err) {
      alert("Failed to generate course. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubjectClick = (subject: string) => {
    setGenerationPrompt(subject);
    setView('course-generator');
    setIsMobileMenuOpen(false);
  };

  const handleOpenModule = async (module: Module) => {
    setActiveModule(module);
    setView('lesson-view');
    setChatMessages([]); // Reset chat for new lesson
    
    // Generate content if missing
    if (!module.content) {
      setIsGenerating(true);
      try {
        if (!activeCourse) return;
        const content = await generateLessonContent(activeCourse.title, module);
        
        // Update module with content
        const updatedModule = { ...module, content };
        setActiveModule(updatedModule);
        
        // Update course state
        const updatedCourse = {
          ...activeCourse,
          modules: activeCourse.modules.map(m => m.id === module.id ? updatedModule : m)
        };
        setActiveCourse(updatedCourse);
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        
      } catch (err) {
        console.error(err);
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const toggleModuleComplete = (e: React.MouseEvent, modId: string) => {
    e.stopPropagation();
    if (!activeCourse) return;

    const updatedModules = activeCourse.modules.map(m => 
      m.id === modId ? { ...m, isCompleted: !m.isCompleted } : m
    );
    
    const updatedCourse = { ...activeCourse, modules: updatedModules };
    setActiveCourse(updatedCourse);
    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: chatInput,
      timestamp: Date.now()
    };
    
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      // Build history for API
      const history = chatMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));
      
      // Contextualize with current lesson content if available
      let contextMessage = chatInput;
      if (activeModule?.content && chatMessages.length === 0) {
        contextMessage = `Context: I am studying "${activeModule.title}" from the course "${activeCourse?.title}". \n\nMy Question: ${chatInput}`;
      }

      const responseText = await chatWithTutor(history, contextMessage);
      
      const modelMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: "I encountered an error trying to answer that. Please try again.",
        timestamp: Date.now(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleResearch = async () => {
    if (!researchQuery.trim()) return;
    setIsResearching(true);
    setResearchResult(null);
    try {
      const result = await conductResearch(researchQuery);
      setResearchResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResearching(false);
    }
  };

  // --- Render Helpers ---

  const renderDashboard = () => (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">My Learning Paths</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your autonomous masters degree progress.</p>
        </div>
        <button 
          onClick={() => setView('course-generator')}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus size={20} />
          <span>New Subject</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <GraduationCap size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-4" />
          <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">Start your journey by generating a rigorous syllabus for any STEM topic you wish to master.</p>
          <button 
            onClick={() => setView('course-generator')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium hover:underline"
          >
            Create your first syllabus &rarr;
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <CourseCard 
              key={course.id} 
              course={course} 
              onClick={() => { setActiveCourse(course); setView('course-view'); }} 
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderCourseGenerator = () => (
    <div className="max-w-2xl mx-auto py-12 animate-fade-in">
      <button 
        onClick={() => setView('dashboard')}
        className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-8 transition-colors"
      >
        <ChevronLeft size={20} className="mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center space-x-4 mb-6">
          <div className="p-3 bg-blue-100 dark:bg-blue-500/10 rounded-xl">
            <BrainCircuit className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Curriculum Architect</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Design a Masters-level syllabus for any topic.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Field of Study</label>
            <input 
              type="text" 
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="e.g. Quantum Computing, Bioinformatics, Advanced Fluid Dynamics..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateCourse()}
            />
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 text-sm text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-transparent">
            <p className="mb-2 font-semibold text-slate-700 dark:text-slate-300">What happens next?</p>
            <ul className="list-disc list-inside space-y-1">
              <li>AI analyzes the domain for academic depth.</li>
              <li>Generates 8-12 comprehensive modules.</li>
              <li>Structures a logical learning path from theory to application.</li>
            </ul>
          </div>

          <button 
            onClick={handleGenerateCourse}
            disabled={isGenerating || !generationPrompt.trim()}
            className={`w-full flex justify-center items-center py-4 rounded-lg text-white font-medium transition-all ${
              isGenerating || !generationPrompt.trim() 
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed text-slate-200 dark:text-slate-400' 
                : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Designing Curriculum...
              </>
            ) : (
              'Generate Syllabus'
            )}
          </button>
        </div>
      </div>
    </div>
  );

  const renderCourseView = () => {
    if (!activeCourse) return null;
    return (
      <div className="animate-fade-in h-full flex flex-col max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setView('dashboard')}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={20} className="mr-1" /> Dashboard
          </button>
          <div className="text-sm text-slate-500 dark:text-slate-500 font-mono">
            {activeCourse.level} Track
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-8 mb-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{activeCourse.title}</h1>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">{activeCourse.description}</p>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
          <BookOpen className="mr-2 text-blue-600 dark:text-blue-400" size={24} />
          Course Modules
        </h3>

        <div className="grid gap-4">
          {activeCourse.modules.map((module, idx) => (
            <div 
              key={module.id}
              onClick={() => handleOpenModule(module)}
              className={`group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-xl cursor-pointer hover:border-blue-500/50 dark:hover:border-blue-500/50 hover:shadow-md transition-all ${module.isCompleted ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div 
                  className="mt-1 text-slate-400 dark:text-slate-500 hover:text-green-500 dark:hover:text-green-500 transition-colors"
                  onClick={(e) => toggleModuleComplete(e, module.id)}
                >
                  {module.isCompleted ? <CheckCircle className="text-green-500" size={24} /> : <Circle size={24} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className={`text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${module.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900 dark:text-white'}`}>
                      {idx + 1}. {module.title}
                    </h4>
                  </div>
                  <p className={`text-sm mb-3 ${module.isCompleted ? 'text-slate-500 dark:text-slate-600' : 'text-slate-600 dark:text-slate-400'}`}>
                    {module.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {module.topics.map((topic, i) => (
                      <span key={i} className="text-xs font-mono bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-500 px-2 py-1 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white self-center" size={24} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderLessonView = () => {
    if (!activeModule || !activeCourse) return null;

    return (
      <div className="flex h-full animate-fade-in relative overflow-hidden bg-slate-50 dark:bg-[#0a0f1c] transition-colors duration-300">
        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ${showResearch ? 'mr-[400px]' : ''}`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10 shadow-sm">
             <div className="flex items-center gap-4">
               <button 
                  onClick={() => setView('course-view')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div className="flex flex-col">
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold tracking-wider uppercase mb-0.5">Chapter: {activeCourse.title}</span>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">{activeModule.title}</h2>
                </div>
             </div>
             
             <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors md:hidden"
                >
                  <Settings size={20} />
                </button>
                <button 
                  onClick={() => setShowResearch(!showResearch)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    showResearch 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
                  }`}
                >
                  <Search size={16} />
                  <span className="hidden sm:inline">Research Assistant</span>
                </button>
             </div>
          </div>

          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-[#0a0f1c] transition-colors duration-300">
            {isGenerating && !activeModule.content ? (
              <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
                <Loader2 className="animate-spin text-indigo-500 mb-6" size={48} />
                <h3 className="text-2xl font-serif text-slate-900 dark:text-white mb-2">Writing Chapter...</h3>
                <p className="text-slate-500 dark:text-slate-400 text-center max-w-md">Consulting academic sources, formulating proofs, and structuring the lesson.</p>
              </div>
            ) : (
              <div className="pb-24">
                <MarkdownRenderer content={activeModule.content || ''} settings={displaySettings} />
              </div>
            )}
          </div>

          {/* Chat Overlay / Bottom Bar */}
          <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)]">
             <div className="max-w-3xl mx-auto flex flex-col gap-4">
                {/* Chat History */}
                {chatMessages.length > 0 && (
                   <div className="max-h-48 overflow-y-auto space-y-4 mb-2 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-br-none' 
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                          }`}>
                             <ReactMarkdown>{msg.text}</ReactMarkdown>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                   </div>
                )}
                
                {/* Input Area */}
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Ask a question about this chapter..."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-4 pr-12 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none placeholder-slate-500 dark:placeholder-slate-600 font-light"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={isChatting || !chatInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                  >
                    {isChatting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
             </div>
          </div>
        </div>

        {/* Research Sidebar */}
        <div className={`fixed inset-y-0 right-0 w-[400px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 z-20 flex flex-col shadow-2xl ${showResearch ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Search size={18} className="text-indigo-500 dark:text-indigo-400"/> Research Assistant
            </h3>
            <button onClick={() => setShowResearch(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto bg-white dark:bg-slate-900">
             <div className="mb-6">
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Find real-world papers and citations.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={researchQuery}
                    onChange={(e) => setResearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
                    placeholder="e.g. Latest applications of..."
                    className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={handleResearch}
                    disabled={isResearching}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-md transition-colors"
                  >
                    {isResearching ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>}
                  </button>
                </div>
             </div>

             {researchResult && (
               <div className="space-y-6">
                 <div className="prose prose-sm prose-slate dark:prose-invert prose-indigo">
                   <ReactMarkdown>{researchResult.text}</ReactMarkdown>
                 </div>
                 
                 {researchResult.sources.length > 0 && (
                   <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sources & Citations</h4>
                     <ul className="space-y-2">
                       {researchResult.sources.map((source, i) => (
                         <li key={i}>
                           <a 
                             href={source.web?.uri} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             className="block p-3 bg-slate-50 dark:bg-slate-800/50 rounded hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-indigo-500/50 transition-all group"
                           >
                             <div className="text-indigo-600 dark:text-indigo-400 text-xs mb-1 truncate group-hover:underline">{source.web?.title}</div>
                             <div className="text-slate-500 text-[10px] truncate">{source.web?.uri}</div>
                           </a>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
               </div>
             )}
          </div>
        </div>
      </div>
    );
  };

  // --- Main Layout ---

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 overflow-hidden font-inter transition-colors duration-300">
      {/* Settings Modal */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={displaySettings} 
        onUpdateSettings={setDisplaySettings} 
      />

      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors duration-300 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center space-x-3 text-blue-600 dark:text-blue-500 mb-8">
            <GraduationCap size={32} />
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">STEM<span className="font-light text-slate-400">Masters</span></span>
          </div>
          
          <nav className="space-y-2">
            <button 
              onClick={() => setView('dashboard')}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                view === 'dashboard' || view === 'course-generator' 
                  ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
              }`}
            >
              <LayoutDashboard size={20} />
              <span className="font-medium">Dashboard</span>
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              <Settings size={20} />
              <span className="font-medium">Settings</span>
            </button>

            {/* Subjects Dropdown */}
            <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800">
              <button 
                onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors group"
              >
                <span>Explore Subjects</span>
                {isSubjectsExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              
              {isSubjectsExpanded && (
                <div className="mt-2 pl-4 space-y-1 animate-fade-in">
                  {STEM_SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectClick(subject)}
                      className="w-full text-left px-4 py-2 text-sm text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-lg transition-colors truncate"
                    >
                      {subject}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-200 dark:border-slate-800">
           <div className="text-xs text-slate-500 dark:text-slate-600">
              Powered by <span className="text-slate-700 dark:text-slate-500 font-semibold">Gemini 2.5 Flash</span>
           </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
           <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-500">
              <GraduationCap size={24} />
              <span className="font-bold text-slate-900 dark:text-white">STEM Masters</span>
           </div>
           <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-500 dark:text-slate-400">
             {isMobileMenuOpen ? <X size={24}/> : <Menu size={24} />}
           </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full h-full bg-white dark:bg-slate-950 z-50 p-6 md:hidden overflow-y-auto">
             <button 
              onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-4 text-slate-900 dark:text-white text-lg border-b border-slate-200 dark:border-slate-800"
            >
              Dashboard
            </button>
             <button 
              onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
              className="w-full text-left py-4 text-slate-900 dark:text-white text-lg border-b border-slate-200 dark:border-slate-800 flex items-center justify-between"
            >
              Settings <Settings size={20} />
            </button>
            <div className="py-4">
              <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Explore Subjects</h4>
              <div className="grid grid-cols-1 gap-2">
                 {STEM_SUBJECTS.map(subject => (
                    <button
                      key={subject}
                      onClick={() => handleSubjectClick(subject)}
                      className="text-left py-2 px-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg"
                    >
                      {subject}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        <main className={`flex-1 overflow-hidden ${view !== 'lesson-view' ? 'p-6 md:p-12 overflow-y-auto' : ''}`}>
           {view === 'dashboard' && renderDashboard()}
           {view === 'course-generator' && renderCourseGenerator()}
           {view === 'course-view' && renderCourseView()}
           {view === 'lesson-view' && renderLessonView()}
        </main>
      </div>
    </div>
  );
};

export default App;
