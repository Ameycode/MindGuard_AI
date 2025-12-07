import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Heart } from './Icons';
import { chatWithBot } from '../services/geminiService';
import { ChatMessage } from '../types';

interface Props {
  history: ChatMessage[];
  setHistory: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  onCrisis: () => void;
}

export const ChatBot: React.FC<Props> = ({ history, setHistory, onCrisis }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [history]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setHistory(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const result = await chatWithBot(history, userMsg.text);
      
      if (result.isCrisis) {
        onCrisis();
      }

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: result.text,
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "I'm having a little trouble connecting right now. Please check your internet connection.",
        timestamp: Date.now()
      };
      setHistory(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="card-base w-full h-full flex flex-col overflow-hidden border-0">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 shadow-sm">
           <Heart className="w-6 h-6 fill-current" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 text-lg">MindGuard Companion</h3>
          <p className="text-xs text-slate-500 font-medium">Supportive AI • Always here to listen</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/50">
        {history.length === 0 && (
          <div className="text-center text-slate-400 mt-20">
            <div className="bg-white p-6 rounded-full inline-block mb-4 shadow-sm">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-lg font-medium text-slate-500">How are you feeling today?</p>
            <p className="text-sm">This is a safe, judgment-free space.</p>
          </div>
        )}
        
        {history.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-5 shadow-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none p-5 shadow-sm flex gap-2 items-center">
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce delay-150"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
        <div className="flex gap-3 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-transparent focus:bg-white transition-colors rounded-full px-6 py-4 pr-24 text-slate-800 placeholder-slate-400 shadow-inner"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 bottom-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:hover:bg-primary-600 text-white rounded-full px-6 font-bold transition-all shadow-md"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};