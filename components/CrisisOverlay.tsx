import React from 'react';
import { AlertTriangle, Phone } from './Icons';

interface Props {
  onClose: () => void;
}

export const CrisisOverlay: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-10 text-center relative animate-pulse-slow border-t-8 border-red-500">
        
        <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>

        <h2 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          You Are Not Alone
        </h2>
        
        <p className="text-xl text-slate-600 mb-10 max-w-lg mx-auto leading-relaxed">
          It seems like you might be going through a difficult time. Please reach out for support immediately. There are people who care and want to help.
        </p>

        <div className="space-y-4 mb-10">
          <a 
            href="tel:988"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-5 px-8 rounded-2xl text-xl transition-transform hover:scale-105 shadow-xl shadow-red-500/20 flex items-center justify-center gap-3"
          >
            <Phone className="w-7 h-7" />
            Call 988 (Suicide & Crisis Lifeline)
          </a>
          
          <a 
            href="sms:741741"
            className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-5 px-8 rounded-2xl text-xl transition-colors"
          >
            Text HOME to 741741
          </a>
        </div>

        <div className="border-t border-slate-100 pt-8 text-sm text-slate-500">
          <p className="mb-4 font-medium">If you are in immediate danger, please call 911 or go to the nearest emergency room.</p>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 underline hover:no-underline transition-colors"
          >
            I am safe now, return to app
          </button>
        </div>
      </div>
    </div>
  );
};