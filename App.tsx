import React, { useState } from 'react';
import { AppState, VoiceAnalysisData, FaceAnalysisData, ChatMessage, AnalysisResult, View } from './types';
import { CrisisOverlay } from './components/CrisisOverlay';
import { VoiceAnalyzer } from './components/VoiceAnalyzer';
import { FaceAnalyzer } from './components/FaceAnalyzer';
import { ChatBot } from './components/ChatBot';
import { Dashboard } from './components/Dashboard';
import { Heart, Mic, Camera, MessageSquare, Activity, Menu, X, Info, ShieldCheck } from './components/Icons';

function App() {
  const [view, setView] = useState<View>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [state, setState] = useState<AppState>({
    voiceResult: null,
    faceResult: null,
    chatHistory: [],
    finalReport: null,
    isCrisisMode: false
  });

  const handleVoiceComplete = (data: VoiceAnalysisData) => {
    setState(prev => ({ ...prev, voiceResult: data }));
  };

  const handleFaceComplete = (data: FaceAnalysisData) => {
    setState(prev => ({ ...prev, faceResult: data }));
  };

  const triggerCrisis = () => {
    setState(prev => ({ ...prev, isCrisisMode: true }));
  };

  const handleReportGenerated = (report: AnalysisResult) => {
    setState(prev => ({ ...prev, finalReport: report }));
  };

  // Check if we have enough data to show results tab as "ready"
  const isDataReady = state.voiceResult || state.faceResult || state.chatHistory.length > 2;

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800">
      {/* Crisis Overlay */}
      {state.isCrisisMode && (
        <CrisisOverlay onClose={() => setState(prev => ({ ...prev, isCrisisMode: false }))} />
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-white/20 shadow-sm">
        
        {/* Top Disclaimer */}
        <div className="bg-amber-50 text-amber-800 text-xs py-2 px-4 text-center border-b border-amber-100 flex items-center justify-center gap-2">
          <Info className="w-3 h-3" />
          <span className="font-medium">AI indicators only. Not a medical diagnosis. In crisis? Call 988.</span>
        </div>

        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setView('home')}
          >
            <div className="bg-primary-50 p-2 rounded-xl group-hover:bg-primary-100 transition-colors">
              <Heart className="w-6 h-6 text-primary-600 fill-primary-600" />
            </div>
            <span className="font-bold text-2xl text-slate-800 tracking-tight">MindGuard<span className="text-primary-600">AI</span></span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-2 bg-slate-50/50 p-1.5 rounded-full border border-slate-100">
            {[
              { id: 'home', label: 'Home', icon: null },
              { id: 'voice', label: 'Voice', icon: Mic },
              { id: 'face', label: 'Face', icon: Camera },
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'results', label: 'Results', icon: Activity },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setView(item.id as View)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all flex items-center gap-2 ${
                  view === item.id 
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/25' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white'
                }`}
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.label}
              </button>
            ))}
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-2 shadow-xl absolute w-full">
            {[
              { id: 'home', label: 'Home' },
              { id: 'voice', label: 'Voice Analysis' },
              { id: 'face', label: 'Facial Analysis' },
              { id: 'chat', label: 'AI Companion' },
              { id: 'results', label: 'Dashboard' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id as View);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-4 rounded-xl font-medium ${
                  view === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {view === 'home' && (
          <div className="space-y-16 animate-fade-in py-8">
            {/* Hero */}
            <div className="text-center space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 text-sm font-medium text-slate-600 animate-float">
                <ShieldCheck className="w-4 h-4 text-primary-500" />
                <span>Secure • Private • AI-Powered</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Mental wellness, <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600">reimagined.</span>
              </h1>
              
              <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                Your supportive AI companion. Analyze your voice, expression, and conversation to get real-time wellness insights in a safe, private space.
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <button 
                  onClick={() => setView('voice')}
                  className="btn-primary px-8 py-4 text-lg font-bold shadow-xl shadow-primary-500/20"
                >
                  Start Check-in
                </button>
                <button 
                  onClick={() => setView('chat')}
                  className="px-8 py-4 rounded-full bg-white text-slate-700 border border-slate-200 font-bold hover:border-primary-200 hover:text-primary-600 transition-all shadow-sm hover:shadow-md"
                >
                  Chat with AI
                </button>
              </div>
            </div>

            {/* Features Cards */}
            <div className="grid md:grid-cols-3 gap-8">
              <div 
                onClick={() => setView('voice')}
                className="card-base p-8 cursor-pointer group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
                  <Mic className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">Voice Analysis</h3>
                <p className="text-slate-500 leading-relaxed">Detects emotional tone, pace, and energy levels from your speech patterns.</p>
              </div>

              <div 
                 onClick={() => setView('face')}
                 className="card-base p-8 cursor-pointer group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">Facial Expression</h3>
                <p className="text-slate-500 leading-relaxed">Analyzes micro-expressions and eye contact to assess emotional state.</p>
              </div>

              <div 
                 onClick={() => setView('chat')}
                 className="card-base p-8 cursor-pointer group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">Supportive Chat</h3>
                <p className="text-slate-500 leading-relaxed">A safe space to vent with an empathetic AI companion that remembers context.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'voice' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
             <VoiceAnalyzer onComplete={handleVoiceComplete} onCrisis={triggerCrisis} />
             {state.voiceResult && (
               <div className="mt-6 text-center animate-pulse-slow">
                 <p className="text-green-600 font-bold text-lg mb-2">✓ Voice Analysis Completed</p>
                 <button onClick={() => setView('results')} className="text-primary-600 font-medium hover:underline">View Comprehensive Report &rarr;</button>
               </div>
             )}
          </div>
        )}

        {view === 'face' && (
          <div className="animate-fade-in max-w-4xl mx-auto">
            <FaceAnalyzer onComplete={handleFaceComplete} onCrisis={triggerCrisis} />
             {state.faceResult && (
               <div className="mt-6 text-center animate-pulse-slow">
                 <p className="text-green-600 font-bold text-lg mb-2">✓ Facial Analysis Completed</p>
                 <button onClick={() => setView('results')} className="text-primary-600 font-medium hover:underline">View Comprehensive Report &rarr;</button>
               </div>
             )}
          </div>
        )}

        {view === 'chat' && (
          <div className="animate-fade-in max-w-4xl mx-auto h-[calc(100vh-12rem)] min-h-[600px]">
            <ChatBot 
              history={state.chatHistory} 
              setHistory={(val) => setState(prev => ({ ...prev, chatHistory: typeof val === 'function' ? val(prev.chatHistory) : val }))} 
              onCrisis={triggerCrisis}
            />
          </div>
        )}

        {view === 'results' && (
          <div className="animate-fade-in max-w-5xl mx-auto">
            {isDataReady ? (
              <Dashboard data={state} onReportGenerated={handleReportGenerated} />
            ) : (
              <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-slate-300 shadow-sm">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">No Data to Analyze Yet</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-8 text-lg">
                  Please complete at least one analysis (Voice, Face, or Chat) to generate your comprehensive mental wellness report.
                </p>
                <button onClick={() => setView('voice')} className="btn-primary px-8 py-3 font-semibold shadow-lg shadow-primary-500/20">
                  Start New Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-12 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
               <Heart className="w-5 h-5" />
               <span className="font-semibold">MindGuard AI</span>
             </div>
             
             <div className="text-sm text-slate-500 text-center md:text-right">
               <p className="mb-2">Powered by Gemini 3 Pro • Privacy First • Secure Encryption</p>
               <div className="flex gap-6 justify-center md:justify-end">
                 <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
                 <a href="#" className="hover:text-primary-600 transition-colors">Terms of Use</a>
                 <a href="#" className="hover:text-primary-600 transition-colors">Support</a>
               </div>
             </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;